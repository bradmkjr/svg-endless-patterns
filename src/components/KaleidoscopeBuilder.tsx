"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from "react";
import { generateKaleidoscope, generateKaleidoscopePdf, type KaleidoscopeRequest, type KaleidoscopeResult, type KaleidoscopeSource, type Locale } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { useTrackCustomize } from "@/lib/analytics";
import { fill, messages } from "@/lib/i18n";
import copy from "@/i18n/messages/kaleidoscope.json";
import {
  isSeeded,
  isTiling,
  MAX_COLORS,
  MAX_OFFSET,
  MAX_SEED,
  MAX_ZOOM,
  MIN_OFFSET,
  MIN_ZOOM,
  MIRROR_OPTIONS,
  normalAngle,
  PATTERN_SOURCES,
  REPEAT_OPTIONS,
  SEEDED_SOURCES,
  SEGMENT_OPTIONS,
  serializeKaleidoscopeState,
} from "@/lib/kaleidoscopeState";
import { ToolLoading } from "./ToolLoading";
import { useLiveResult } from "@/lib/useLiveResult";
import { OptionNav, useOptionNavigation } from "./OptionNav";
import { PalettePicker } from "./PalettePicker";
import { rememberSeed, syncShareLink } from "@/lib/toolOptions";
import styles from "./BlockBuilder.module.css";

type View = keyof KaleidoscopeResult["svg"];

/** How long the angle rests before it goes into the link. Dragging only updates the picture. */
const COMMIT_MS = 300;
/** Degrees a second while spinning on its own. */
const SPIN_SPEED = 24;

/** The same attribute the API writes, so a turned picture is the one the API would draw. */
const turn = (angle: number) => `rotate(${Number(angle.toFixed(3))})`;

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(change: () => void) {
  const query = window.matchMedia(reducedMotionQuery);
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
}
const prefersReducedMotion = () => window.matchMedia(reducedMotionQuery).matches;

function NumberSelect({ label, value, options, onChange }: { label: string; value: number; options: number[]; onChange: (value: number) => void }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Range({ label, value, min, max, step = 1, shown, onChange }: { label: string; value: number; min: number; max: number; step?: number; shown: string; onChange: (value: number) => void }) {
  return (
    <label className={styles.field}>
      <span>
        {label}: {shown}
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

/** A round handle to turn the source by dragging, or with the arrow keys. */
function Dial({ angle, label, onTurn, onRelease }: { angle: number; label: string; onTurn: (angle: number) => void; onRelease: () => void }) {
  const dragging = useRef(false);
  const angleAt = (e: PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    // Zero is straight up, and angles grow clockwise, as rotate() turns on screen.
    return (Math.atan2(e.clientX - (box.left + box.width / 2), -(e.clientY - (box.top + box.height / 2))) * 180) / Math.PI;
  };
  const keys = (e: KeyboardEvent<SVGSVGElement>) => {
    const step = e.shiftKey ? 15 : 1;
    const moves: Record<string, number> = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: 15, PageDown: -15 };
    if (!(e.key in moves)) return;
    e.preventDefault();
    onTurn(angle + moves[e.key]);
    onRelease();
  };
  const rad = (angle * Math.PI) / 180;
  return (
    <svg
      viewBox="0 0 100 100"
      width={112}
      height={112}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={359}
      aria-valuenow={normalAngle(angle)}
      aria-valuetext={`${normalAngle(angle)}°`}
      style={{ touchAction: "none", cursor: "grab", flex: "none" }}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        onTurn(angleAt(e));
      }}
      onPointerMove={(e) => dragging.current && onTurn(angleAt(e))}
      onPointerUp={() => {
        dragging.current = false;
        onRelease();
      }}
      onPointerCancel={() => {
        dragging.current = false;
        onRelease();
      }}
      onKeyDown={keys}
    >
      <circle cx="50" cy="50" r="46" fill="var(--surface)" stroke="var(--line)" strokeWidth="2" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        return <line key={i} x1={50 + 38 * Math.sin(a)} y1={50 - 38 * Math.cos(a)} x2={50 + 44 * Math.sin(a)} y2={50 - 44 * Math.cos(a)} stroke="var(--line)" strokeWidth="2" />;
      })}
      <line x1="50" y1="50" x2={50 + 32 * Math.sin(rad)} y2={50 - 32 * Math.cos(rad)} stroke="var(--foreground)" strokeWidth="4" strokeLinecap="round" />
      <circle cx={50 + 32 * Math.sin(rad)} cy={50 - 32 * Math.cos(rad)} r="8" fill="var(--locale-swatch, var(--foreground))" />
    </svg>
  );
}

export function KaleidoscopeBuilder({ locale, option, labels, initialState }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: KaleidoscopeRequest }) {
  const t = copy[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("kaleidoscope", locale);
  const [state, setState] = useState(initialState);
  useTrackCustomize("kaleidoscope", state);
  const [view, setView] = useState<View>("art");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  // The angle on screen. It runs ahead of `state.angle`, which follows once the turning stops.
  const [shownAngle, setShownAngle] = useState(initialState.angle);
  const [spinning, setSpinning] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false);
  const liveAngle = useRef(initialState.angle);
  const frame = useRef(0);
  const commitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const art = useRef<HTMLDivElement>(null);

  const update = (patch: Partial<KaleidoscopeRequest>) => setState((s) => ({ ...s, ...patch }));
  const setColor = (i: number, color: string) => setState((s) => ({ ...s, colors: s.colors.map((c, n) => (n === i ? color : c)) }));

  // The picture is asked for unturned: turning never waits on the API, only on the next frame.
  const result = useLiveResult(generateKaleidoscope, { ...state, angle: 0 }, setStatus, b.updateError);

  useEffect(() => {
    syncShareLink(serializeKaleidoscopeState(state), "kaleidoscope", option);
    rememberSeed("kaleidoscope", state.seed);
  }, [state, option]);

  const tiling = isTiling(state.mirrors);
  const shown: View = tiling ? view : "art";
  const svg = result?.svg[shown] ?? "";

  /** Turns every copy at once: they're all `<use>`s of the one turned cell. */
  const paint = useCallback(() => {
    frame.current = 0;
    art.current?.querySelectorAll("[data-turn]").forEach((element) => element.setAttribute("transform", turn(liveAngle.current)));
  }, []);

  // A new picture arrives unturned; turn it to where the dial is before it's seen.
  useLayoutEffect(() => {
    paint();
  }, [svg, paint]);

  const commit = useCallback(() => {
    clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => {
      const angle = normalAngle(liveAngle.current);
      liveAngle.current = angle;
      setShownAngle(angle);
      paint();
      setState((s) => (s.angle === angle ? s : { ...s, angle }));
    }, COMMIT_MS);
  }, [paint]);

  const turnTo = useCallback(
    (angle: number) => {
      liveAngle.current = angle;
      setShownAngle(angle);
      if (!frame.current) frame.current = requestAnimationFrame(paint);
    },
    [paint],
  );

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      clearTimeout(commitTimer.current);
    },
    [],
  );

  const spinOn = spinning && !reducedMotion;
  useEffect(() => {
    if (!spinOn) return;
    let last = performance.now();
    let id = 0;
    const step = (now: number) => {
      turnTo((liveAngle.current + ((now - last) / 1000) * SPIN_SPEED) % 360);
      last = now;
      id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(id);
      commit();
    };
  }, [spinOn, turnTo, commit]);

  const run = async (working: string, done: string, action: () => Promise<void> | void) => {
    setBusy(true);
    setStatus(working);
    try {
      await action();
      setStatus(done);
    } catch {
      setStatus(b.actionError);
    } finally {
      setBusy(false);
    }
  };

  /** Files come from the API at the angle on screen, so they match what's shown. */
  const onScreen = (): KaleidoscopeRequest => ({ ...state, angle: normalAngle(liveAngle.current) });
  const drawnFile = async () => (await generateKaleidoscope(onScreen())).svg[shown] ?? "";

  const sourceOption = (id: KaleidoscopeSource) => (
    <option key={id} value={id}>
      {t.sourceNames[id]}
    </option>
  );

  return (
    <div className={styles.builder}>
      <OptionNav tool="kaleidoscope" locale={locale} current={option} labels={labels} />
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          {tiling ? (
            <div className={`${styles.tabs} no-print`}>
              {(["art", "repeat"] as View[]).map((name) => (
                <button key={name} type="button" className={view === name ? styles.tabOn : styles.tab} aria-pressed={view === name} onClick={() => setView(name)}>
                  {t.views[name]}
                </button>
              ))}
            </div>
          ) : null}
          {result ? <div ref={art} className={`art ${styles.art}`} role="img" aria-label={t.artAlt} dangerouslySetInnerHTML={{ __html: svg }} /> : <ToolLoading locale={locale} />}
          <p className={styles.note}>{t.viewNotes[shown]}</p>
          {result ? (
            <p className={styles.note}>
              {result.tile
                ? fill(t.statsTiling, { angles: result.angles.join("-"), copies: result.copies, width: result.tile.width, height: result.tile.height })
                : fill(t.statsTwo, { angle: result.angles[0], copies: result.copies })}
            </p>
          ) : null}
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateKaleidoscopePdf(onScreen()), "kaleidoscope.pdf", "application/pdf"))}>
              {t.downloadPdf}
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, async () => downloadSvg(await drawnFile(), `kaleidoscope-${shown}.svg`))}>
              SVG
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, async () => downloadPng(await drawnFile(), `kaleidoscope-${shown}.png`))}>
              PNG
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run(b.copying, b.copied, () => navigator.clipboard.writeText(window.location.href))}>
              {b.copyLink}
            </button>
          </div>
          <p className={styles.status} role="status">
            {status}
          </p>
        </section>

        <form className={`${styles.controls} no-print`} onSubmit={(e) => e.preventDefault()}>
          <fieldset>
            <legend>{t.turnLegend}</legend>
            <div className={styles.fieldRow} style={{ alignItems: "center" }}>
              <Dial angle={shownAngle} label={t.dial} onTurn={turnTo} onRelease={commit} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className={styles.field}>
                  <span>
                    {t.angle}: {fill(t.degrees, { n: normalAngle(shownAngle) })}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={359}
                    step={1}
                    value={normalAngle(shownAngle)}
                    onChange={(e) => {
                      turnTo(Number(e.target.value));
                      commit();
                    }}
                  />
                </label>
                <button type="button" className={spinOn ? styles.tabOn : styles.tab} aria-pressed={spinOn} disabled={reducedMotion} onClick={() => setSpinning((on) => !on)}>
                  {spinOn ? t.stopSpin : t.spin}
                </button>
              </div>
            </div>
            <p className={styles.note}>{reducedMotion ? t.reducedMotion : t.turnNote}</p>
          </fieldset>

          <fieldset>
            <legend>{t.mirrorsLegend}</legend>
            <label className={styles.field}>
              <span>{t.mirrors}</span>
              <select value={state.mirrors} onChange={(e) => goToOption(e.target.value)}>
                {MIRROR_OPTIONS.map((id) => (
                  <option key={id} value={id}>
                    {t.mirrorNames[id]}
                  </option>
                ))}
              </select>
            </label>
            <p className={styles.note}>{t.mirrorNotes[state.mirrors]}</p>
            {tiling ? (
              <NumberSelect label={t.repeats} value={state.repeats} options={REPEAT_OPTIONS} onChange={(repeats) => update({ repeats })} />
            ) : (
              <NumberSelect label={t.segments} value={state.segments} options={SEGMENT_OPTIONS} onChange={(segments) => update({ segments })} />
            )}
          </fieldset>

          <fieldset>
            <legend>{t.sourceLegend}</legend>
            <label className={styles.field}>
              <span>{t.source}</span>
              <select value={state.source} onChange={(e) => update({ source: e.target.value as KaleidoscopeSource })}>
                <optgroup label={t.sourceGroups.seeded}>{SEEDED_SOURCES.map(sourceOption)}</optgroup>
                <optgroup label={t.sourceGroups.patterns}>{PATTERN_SOURCES.map(sourceOption)}</optgroup>
              </select>
            </label>
            {isSeeded(state.source) ? (
              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span>{t.seed}</span>
                  <input type="number" min={0} max={MAX_SEED} value={state.seed} style={{ padding: "0.45rem 0.5rem", border: "1px solid var(--line)", borderRadius: 5, background: "var(--surface)", color: "var(--foreground)", font: "inherit", fontSize: "1rem" }} onChange={(e) => update({ seed: Math.min(MAX_SEED, Math.max(0, Math.floor(Number(e.target.value)) || 0)) })} />
                </label>
                <button type="button" className={styles.tab} onClick={() => update({ seed: Math.floor(Math.random() * (MAX_SEED + 1)) })}>
                  {t.newSeed}
                </button>
              </div>
            ) : (
              <p className={styles.note}>{t.patternNote}</p>
            )}
            <Range label={t.zoom} value={state.zoom} min={MIN_ZOOM} max={MAX_ZOOM} step={10} shown={fill(t.percent, { n: state.zoom })} onChange={(zoom) => update({ zoom })} />
            <Range label={t.offsetX} value={state.offsetX} min={MIN_OFFSET} max={MAX_OFFSET} step={5} shown={String(state.offsetX)} onChange={(offsetX) => update({ offsetX })} />
            <Range label={t.offsetY} value={state.offsetY} min={MIN_OFFSET} max={MAX_OFFSET} step={5} shown={String(state.offsetY)} onChange={(offsetY) => update({ offsetY })} />
            <button type="button" className={styles.tab} disabled={!state.offsetX && !state.offsetY} onClick={() => update({ offsetX: 0, offsetY: 0 })}>
              {t.recenter}
            </button>
          </fieldset>

          <fieldset>
            <legend>{t.colors}</legend>
            <div className={styles.colors}>
              <label className={styles.color}>
                <input type="color" value={state.background} onChange={(e) => update({ background: e.target.value })} />
                {t.background}
              </label>
              {state.colors.map((color, i) => (
                <label key={i} className={styles.color}>
                  <input type="color" value={color} onChange={(e) => setColor(i, e.target.value)} />
                  {fill(t.color, { n: i + 1 })}
                </label>
              ))}
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.tab} disabled={state.colors.length >= MAX_COLORS} onClick={() => update({ colors: [...state.colors, "#888888"] })}>
                {t.add}
              </button>
              <button type="button" className={styles.tab} disabled={state.colors.length <= 1} onClick={() => update({ colors: state.colors.slice(0, -1) })}>
                {t.remove}
              </button>
            </div>
            {!isSeeded(state.source) ? <p className={styles.note}>{t.patternNote}</p> : null}
            <PalettePicker locale={locale} current={[state.background, ...state.colors]} onApply={(c) => update({ background: c[0], colors: (c.length > 1 ? c.slice(1) : c).slice(0, MAX_COLORS) })} />
          </fieldset>
        </form>
      </div>
    </div>
  );
}
