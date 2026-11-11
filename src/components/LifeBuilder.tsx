"use client";

import { ColorInput } from "./ColorInput";
import { useEffect, useState, type CSSProperties, type MouseEvent } from "react";
import { generateLife, generateLifePdf, type LifeColors, type LifeRequest, type LifeResult, type Locale } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { useTrackCustomize } from "@/lib/analytics";
import { fill, messages } from "@/lib/i18n";
import copy from "@/i18n/messages/life.json";
import { CELL_SIZE_OPTIONS, columnOptions, COUNT_OPTIONS, lifeGenerations, NEIGHBORHOOD_OPTIONS, PATTERN_OPTIONS, phaseOptions, randomSeed, rowOptions, SEED_MAX, serializeLifeState, SPACING_OPTIONS, withRun, wraps } from "@/lib/lifeState";
import { syncShareLink } from "@/lib/toolOptions";
import { useLiveResult } from "@/lib/useLiveResult";
import { OptionNav, useOptionNavigation } from "./OptionNav";
import { PalettePicker } from "./PalettePicker";
import { ToolLoading } from "./ToolLoading";
import styles from "./BlockBuilder.module.css";

function NumberSelect({ label, value, options, format = String, onChange }: { label: string; value: number; options: number[]; format?: (value: number) => string; onChange: (value: number) => void }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {options.map((option) => (
          <option key={option} value={option}>
            {format(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

type View = keyof LifeResult["svg"];
const VIEWS: View[] = ["sheet", "animation", "tile", "phases", "neighborhood"];
/** Seconds per generation. The API's drawing reads the step from `--life-step`, so speed needs no new drawing. */
const SPEEDS = { slow: 1.2, normal: 0.6, fast: 0.25 } as const;
type Speed = keyof typeof SPEEDS;
const COLOR_KEYS: (keyof LifeColors)[] = ["background", "primary", "accent"];

export function LifeBuilder({ locale, option, labels, initialState }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: LifeRequest }) {
  const t = copy[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("life", locale);
  const [state, setState] = useState(initialState);
  useTrackCustomize("life", state);
  const [view, setView] = useState<View>("sheet");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [speed, setSpeed] = useState<Speed>("normal");
  const [paused, setPaused] = useState(false);

  const update = (patch: Partial<LifeRequest>) => setState((s) => ({ ...s, ...patch }));

  const result = useLiveResult(generateLife, state, setStatus, b.updateError);

  useEffect(() => {
    syncShareLink(serializeLifeState(state), "life", option);
  }, [state, option]);

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

  /** The diagram's cells carry their place, so a click there chooses the cell. */
  const pickCell = (event: MouseEvent<HTMLDivElement>) => {
    const target = (event.target as Element).closest("[data-x]");
    if (!target) return;
    update({ cellX: Number(target.getAttribute("data-x")), cellY: Number(target.getAttribute("data-y")) });
  };

  const svg = result?.svg[view] ?? "";
  const wrapping = wraps(state.pattern);
  // Noise's run is known only once the API has run it.
  const generations = state.pattern === "noise" ? (result?.generations ?? 1) : lifeGenerations(state.pattern, state.spacing);
  const phases = phaseOptions(state.pattern, state.spacing, generations);
  const hasPhases = generations > 1;
  /** Past the last generation run, a loop goes back to where it starts, and noise still changing starts over. */
  const nextStep = () => update({ phase: state.phase + 1 < generations ? state.phase + 1 : (result?.settle ?? 0) });
  const frames = result?.loop.length ?? 1;
  const animating = view === "animation" && frames > 1;
  const order = (result?.loop ?? []).map((n) => n + 1).join(" → ");
  const changeRun = (patch: Pick<Partial<LifeRequest>, "spacing" | "seed">) => setState((s) => withRun(s, patch));

  const phasesNote = (r: LifeResult) => {
    const range = { min: Math.min(...r.phaseCells), max: Math.max(...r.phaseCells) };
    if (r.settle === null) return fill(t.soupRunning, { generations: r.generations, ...range });
    if (r.settle > 0) return fill(t.soupSettled, { settle: r.settle, period: r.period ?? 0, ...range });
    if (r.generations === 1) return fill(t.stillStats, { live: r.phaseCells[0] });
    return r.generations <= 8 ? fill(t.phaseStats, { period: r.period ?? 0, counts: r.phaseCells.join(", ") }) : fill(t.longStats, { period: r.period ?? 0, ...range });
  };

  return (
    <div className={styles.builder}>
      <OptionNav tool="life" locale={locale} current={option} labels={labels} />
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          <div className={`${styles.tabs} no-print`}>
            {VIEWS.map((name) => (
              <button key={name} type="button" className={view === name ? styles.tabOn : styles.tab} aria-pressed={view === name} onClick={() => setView(name)}>
                {t.views[name]}
              </button>
            ))}
          </div>
          {result ? (
            <>
              <div
                className={`art ${styles.art}${animating && paused ? ` ${styles.paused}` : ""}`}
                style={animating ? ({ "--life-step": `${SPEEDS[speed]}s` } as CSSProperties) : undefined}
                role="img"
                aria-label={t.views[view]}
                onClick={view === "neighborhood" ? pickCell : undefined}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
              <p className={styles.note}>{t.notes[state.pattern]}</p>
              {view === "sheet" && <p className={styles.note}>{fill(t.sheetStats, { cols: result.sheet.cols, rows: result.sheet.rows, width: result.sheet.width, height: result.sheet.height, live: result.sheet.live })}</p>}
              {view === "animation" &&
                (frames > 1 ? (
                  <>
                    <div className={`${styles.actions} ${styles.playback} no-print`}>
                      <button type="button" className={styles.secondary} aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
                        {paused ? t.play : t.pause}
                      </button>
                      <button type="button" className={styles.secondary} onClick={nextStep}>
                        {t.nextStep}
                      </button>
                      <label className={styles.field}>
                        <span>{t.speed}</span>
                        <select value={speed} onChange={(e) => setSpeed(e.target.value as Speed)}>
                          {(Object.keys(SPEEDS) as Speed[]).map((id) => (
                            <option key={id} value={id}>
                              {t.speeds[id]}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <p className={styles.note}>{result.seamless ? fill(t.loopStats, { period: frames, order }) : fill(t.runStats, { frames, phase: state.phase + 1 })}</p>
                    <p className={styles.note}>{t.motionNote}</p>
                  </>
                ) : (
                  <p className={styles.note}>{t.stillLoop}</p>
                ))}
              {view === "tile" && <p className={styles.note}>{fill(wrapping ? t.wrapStats : t.tileStats, { cols: result.tile.cols, rows: result.tile.rows, spacing: state.spacing })}</p>}
              {view === "phases" && <p className={styles.note}>{phasesNote(result)}</p>}
              {view === "neighborhood" && (
                <>
                  <p className={styles.note}>{t.clickNote}</p>
                  {result.neighborhood.lines.map((line) => (
                    <p key={line} className={styles.note}>
                      {line}
                    </p>
                  ))}
                </>
              )}
            </>
          ) : (
            <ToolLoading locale={locale} />
          )}
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateLifePdf(state), `life-${state.pattern}.pdf`, "application/pdf"))}>
              {t.downloadPdf}
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(svg, `life-${state.pattern}-${view}.svg`))}>
              SVG
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(svg, `life-${state.pattern}-${view}.png`))}>
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
            <legend>{t.design}</legend>
            <label className={styles.field}>
              <span>{t.pattern}</span>
              <select value={state.pattern} onChange={(e) => goToOption(e.target.value)}>
                {PATTERN_OPTIONS.map((id) => (
                  <option key={id} value={id}>
                    {t.patterns[id]}
                  </option>
                ))}
              </select>
            </label>
            {state.seed !== undefined && (
              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span>{t.seed}</span>
                  <input type="number" min={0} max={SEED_MAX} value={state.seed} onChange={(e) => changeRun({ seed: Math.min(SEED_MAX, Math.max(0, Math.floor(Number(e.target.value)) || 0)) })} />
                </label>
                <button type="button" className={styles.tab} onClick={() => changeRun({ seed: randomSeed() })}>
                  {t.newNoise}
                </button>
              </div>
            )}
            {hasPhases && (
              <>
                <NumberSelect label={t.phase} value={state.phase} options={phases} format={(n) => String(n + 1)} onChange={(phase) => update({ phase })} />
                <button type="button" className={styles.secondary} onClick={nextStep}>
                  {t.nextStep}
                </button>
              </>
            )}
          </fieldset>

          <fieldset>
            <legend>{t.layout}</legend>
            <div className={styles.fieldRow}>
              <NumberSelect label={t.columns} value={state.columns} options={COUNT_OPTIONS} onChange={(columns) => update({ columns })} />
              <NumberSelect label={t.rows} value={state.rows} options={COUNT_OPTIONS} onChange={(rows) => update({ rows })} />
            </div>
            <div className={styles.fieldRow}>
              <NumberSelect label={t.cellSize} value={state.cellSize} options={CELL_SIZE_OPTIONS} format={(n) => `${n}"`} onChange={(cellSize) => update({ cellSize })} />
              <NumberSelect label={wrapping ? t.spacingWrap : t.spacing} value={state.spacing} options={SPACING_OPTIONS} onChange={(spacing) => changeRun({ spacing })} />
            </div>
            <label className={styles.check}>
              <input type="checkbox" checked={state.gridLines} onChange={(e) => update({ gridLines: e.target.checked })} />
              {t.gridLines}
            </label>
          </fieldset>

          <fieldset>
            <legend>{t.neighborhood}</legend>
            <label className={styles.field}>
              <span>{t.counting}</span>
              <select
                value={state.neighborhood}
                onChange={(e) => {
                  update({ neighborhood: e.target.value as LifeRequest["neighborhood"] });
                  setView("neighborhood");
                }}
              >
                {NEIGHBORHOOD_OPTIONS.map((id) => (
                  <option key={id} value={id}>
                    {t.neighborhoods[id]}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.fieldRow}>
              <NumberSelect label={t.cellColumn} value={state.cellX} options={columnOptions(state.pattern, state.spacing)} format={(n) => String(n + 1)} onChange={(cellX) => update({ cellX })} />
              <NumberSelect label={t.cellRow} value={state.cellY} options={rowOptions(state.pattern, state.spacing)} format={(n) => String(n + 1)} onChange={(cellY) => update({ cellY })} />
            </div>
          </fieldset>

          <fieldset>
            <legend>{t.colors}</legend>
            <div className={styles.fieldRow}>
              {COLOR_KEYS.map((key) => (
                <label key={key} className={styles.field}>
                  <span>{t[key]}</span>
                  <ColorInput value={state.colors[key]} onChange={(picked) => update({ colors: { ...state.colors, [key]: picked } })} />
                </label>
              ))}
            </div>
            <p className={styles.note}>{t.colorNote}</p>
            <PalettePicker locale={locale} current={[state.colors.background, state.colors.primary, state.colors.accent]} onApply={(c) => update({ colors: { background: c[0], primary: c[1], accent: c[2] ?? c[1] } })} />
          </fieldset>
        </form>
      </div>
    </div>
  );
}
