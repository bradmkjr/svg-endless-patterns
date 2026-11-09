"use client";

import { ColorInput } from "./ColorInput";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { generateMaze, generateMazePdf, generateMazePng, generateMazePosterPdf, MAZE_PAPERS, mazeAcross, mazeTallRows, type MazePaperId, type Locale, type MazeColors, type MazeRequest, type MazeResult } from "@/lib/generator";
import { downloadBytes, downloadSvg } from "@/lib/download";
import { useTrackCustomize } from "@/lib/analytics";
import { fill, messages } from "@/lib/i18n";
import copy from "@/i18n/messages/maze.json";
import { ALGORITHM_OPTIONS, DIFFICULTY_OPTIONS, MAX_SEED, MESSAGE_DIFFICULTY_OPTIONS, MESSAGE_LIMITS, messageProblem, normalizeMessage, PNG_OPTIONS, SIZE_OPTIONS, serializeMazeState, SHAPE_OPTIONS, WEIGHT_OPTIONS } from "@/lib/mazeState";
import { paletteAccents } from "@/lib/palettes";
import { rememberSeed, syncShareLink } from "@/lib/toolOptions";
import { OptionNav, useOptionNavigation } from "./OptionNav";
import { PalettePicker } from "./PalettePicker";
import { ToolLoading } from "./ToolLoading";
import styles from "./BlockBuilder.module.css";

const COLOR_KEYS: (keyof MazeColors)[] = ["background", "wall", "accent"];
const VIEWS = ["maze", "solution"] as const;
/** Long enough that a word being typed doesn't draw a maze for every letter. */
const MESSAGE_SETTLE_MS = 500;

/** Draws the solution from start to exit. Capped at five seconds, so it needs no pause control. */
function drawRoute(route: SVGPathElement, cells: number): Animation {
  const length = route.getTotalLength();
  const duration = Math.min(5000, Math.max(1500, cells * 30));
  // A hidden message's letters come up as the route finishes spelling them.
  route.ownerSVGElement?.querySelector("[data-letters]")?.animate({ opacity: [0, 0] }, { duration });
  return route.animate({ strokeDasharray: [`${length} ${length}`, `${length} ${length}`], strokeDashoffset: [length, 0] }, { duration, easing: "ease-in-out" });
}

export function MazeBuilder({ locale, option, labels, initialState }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: MazeRequest }) {
  const t = copy[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("maze", locale);
  const [state, setState] = useState(initialState);
  useTrackCustomize("maze", state);
  const [paper, setPaper] = useState<MazePaperId>("a1");
  const [pngSize, setPngSize] = useState(PNG_OPTIONS[1]);
  const [generated, setGenerated] = useState<{ key: string; result: MazeResult } | null>(null);
  const [view, setView] = useState<(typeof VIEWS)[number]>("maze");
  const [status, setStatus] = useState(t.loading);
  const [busy, setBusy] = useState(false);
  const hidden = state.shape === "hidden-message";
  const [draft, setDraft] = useState(state.message ?? "");
  const message = normalizeMessage(draft);
  const problem = hidden ? messageProblem(message) : null;
  const requestKey = JSON.stringify(state);
  const result = generated?.key === requestKey ? generated.result : undefined;

  const update = (patch: Partial<MazeRequest>) => {
    setStatus(t.loading);
    setState((s) => ({ ...s, ...patch }));
  };

  useEffect(() => {
    let stale = false;
    generateMaze(state).then(
      (next) => {
        if (!stale) {
          setGenerated({ key: requestKey, result: next });
          setStatus("");
        }
      },
      () => {
        if (!stale) setStatus(b.updateError);
      },
    );
    return () => {
      stale = true;
    };
  }, [requestKey, state, b.updateError]);

  useEffect(() => {
    if (!hidden || problem || message === state.message) return;
    const timer = setTimeout(() => {
      setStatus(t.loading);
      setState((s) => ({ ...s, message }));
    }, MESSAGE_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [hidden, problem, message, state.message, t.loading]);

  useEffect(() => {
    const query = serializeMazeState({ ...state, message: undefined });
    syncShareLink(query, "maze", option);
  }, [state, option]);

  const setSeed = (seed: number) => {
    rememberSeed("maze", seed);
    update({ seed });
  };

  const across = state.cols ?? mazeAcross(state.difficulty);
  const down = state.rows ?? mazeTallRows(across);
  /** A size not on the list, such as a difficulty's, still has to show in its dropdown. */
  const sizes = (value: number) => [...new Set([...SIZE_OPTIONS, value])].sort((a, b) => a - b);

  const run = async (working: string, done: string, action: () => Promise<void> | void, failed = b.actionError) => {
    setBusy(true);
    setStatus(working);
    try {
      await action();
      setStatus(done);
    } catch {
      setStatus(failed);
    } finally {
      setBusy(false);
    }
  };

  const svg = result?.svg[view] ?? "";
  const solutionLength = result?.solutionLength ?? 0;

  const artRef = useRef<HTMLDivElement>(null);
  /** The route last drawn, so a change of color or wall weight doesn't draw it again. */
  const drawnRoute = useRef<string | null>(null);

  const solutionPath = () => artRef.current?.querySelector<SVGPathElement>("[data-solution]") ?? null;

  useLayoutEffect(() => {
    const route = solutionPath();
    if (!route) {
      if (view === "maze") drawnRoute.current = null;
      return;
    }
    const d = route.getAttribute("d");
    if (d === drawnRoute.current) return;
    drawnRoute.current = d;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = drawRoute(route, solutionLength);
    return () => animation.cancel();
  }, [view, svg, solutionLength]);

  return (
    <div className={styles.builder}>
      <OptionNav tool="maze" locale={locale} current={option} labels={labels} />
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          <div className={`${styles.tabs} no-print`}>
            {VIEWS.map((name) => (
              <button key={name} type="button" className={view === name ? styles.tabOn : styles.tab} aria-pressed={view === name} onClick={() => setView(name)}>
                {t.views[name]}
              </button>
            ))}
            {view === "solution" && (
              <button
                type="button"
                className={styles.tab}
                disabled={!result}
                onClick={() => {
                  const route = solutionPath();
                  if (!route) return;
                  route.getAnimations().forEach((animation) => animation.cancel());
                  drawRoute(route, solutionLength);
                }}
              >
                {t.playSolution}
              </button>
            )}
          </div>
          {result ? (
            <div ref={artRef} className={`art ${styles.art}`} role="img" aria-label={view === "maze" ? t.mazeAlt : t.solutionAlt} dangerouslySetInnerHTML={{ __html: svg }} />
          ) : (
            <ToolLoading locale={locale} />
          )}
          <p className={styles.note}>{hidden ? t.hiddenHowNote : t.howNote}</p>
          {result && <p className={styles.note}>{fill(t.stats, { cells: result.cells, length: result.solutionLength, deadEnds: result.deadEnds })}</p>}
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy || !result} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateMazePdf(state), "maze.pdf", "application/pdf"))}>
              {t.downloadPdf}
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateMazePdf(state, { solution: false }), "maze-activity.pdf", "application/pdf"))}>
              {t.downloadActivity}
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(svg, `maze-${view}.svg`))}>
              SVG
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, async () => downloadBytes(await generateMazePng(state, view, pngSize), `maze-${view}-${pngSize}.png`, "image/png"), t.pngTooLarge)}>
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
              <span>{t.shape}</span>
              <select value={state.shape} onChange={(e) => goToOption(e.target.value)}>
                {SHAPE_OPTIONS.map((id) => (
                  <option key={id} value={id}>
                    {t.shapes[id]}
                  </option>
                ))}
              </select>
            </label>
            {hidden && (
              <>
                <label className={styles.field}>
                  <span>{t.message}</span>
                  <input type="text" value={draft} maxLength={MESSAGE_LIMITS.characters * 2} autoComplete="off" spellCheck={false} aria-invalid={problem !== null} onChange={(e) => setDraft(e.target.value)} />
                </label>
                {problem ? <p className={styles.note} role="alert">{fill(t.messageProblems[problem], MESSAGE_LIMITS)}</p> : <p className={styles.note}>{fill(t.messageNote, MESSAGE_LIMITS)}</p>}
                <p className={styles.note}>{t.messagePrivacy}</p>
              </>
            )}
            <label className={styles.field}>
              <span>{t.algorithm}</span>
              <select value={state.algorithm} onChange={(e) => update({ algorithm: e.target.value as MazeRequest["algorithm"] })}>
                {ALGORITHM_OPTIONS.map((id) => (
                  <option key={id} value={id}>
                    {t.algorithms[id]}
                  </option>
                ))}
              </select>
            </label>
            <p className={styles.note}>{t.algorithmNotes[state.algorithm]}</p>
            <div className={styles.fieldRow}>
              <label className={styles.field}>
                <span>{t.difficulty}</span>
                <select value={state.cols === undefined ? state.difficulty : "custom"} onChange={(e) => update({ difficulty: e.target.value as MazeRequest["difficulty"], cols: undefined, rows: undefined })}>
                  {state.cols !== undefined && <option value="custom">{t.custom}</option>}
                  {(hidden ? MESSAGE_DIFFICULTY_OPTIONS : DIFFICULTY_OPTIONS).map((id) => (
                    <option key={id} value={id}>
                      {t.difficulties[id]}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>{t.weight}</span>
                <select value={state.weight} onChange={(e) => update({ weight: Number(e.target.value) })}>
                  {WEIGHT_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}%
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {!hidden && <div className={styles.fieldRow}>
              <label className={styles.field}>
                <span>{state.shape === "rectangle" ? t.columns : state.shape === "square" ? t.columnsAndRows : t.cellsAcross}</span>
                <select value={across} onChange={(e) => update({ cols: Number(e.target.value) })}>
                  {sizes(across).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              {state.shape === "rectangle" && (
                <label className={styles.field}>
                  <span>{t.rows}</span>
                  <select value={down} onChange={(e) => update({ cols: across, rows: Number(e.target.value) })}>
                    {sizes(down).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>}
            {hidden && <p className={styles.note}>{t.messageSize}</p>}
            <div className={styles.fieldRow}>
              <label className={styles.field}>
                <span>{t.seed}</span>
                <input type="number" min={0} max={MAX_SEED} value={state.seed} onChange={(e) => setSeed(Math.min(MAX_SEED, Math.max(0, Math.floor(Number(e.target.value)) || 0)))} />
              </label>
              <button type="button" className={styles.tab} onClick={() => setSeed(Math.floor(Math.random() * (MAX_SEED + 1)))}>
                {t.shuffle}
              </button>
            </div>
            <p className={styles.note}>{t.seedNote}</p>
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
            <PalettePicker locale={locale} current={[state.colors.background, state.colors.wall, state.colors.accent]} onApply={(c) => update({ colors: { background: c[0], wall: c[1], accent: paletteAccents(c, 2)[1] } })} />
          </fieldset>

          <fieldset>
            <legend>{t.large}</legend>
            <label className={styles.field}>
              <span>{t.paper}</span>
              <select value={paper} onChange={(e) => setPaper(e.target.value as MazePaperId)}>
                {MAZE_PAPERS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <p className={styles.note}>{result ? fill(t.cellSize, { size: result.posterCell[paper] }) : t.loading}</p>
            <div className={styles.actions}>
              <button type="button" disabled={busy || !result} className={styles.tab} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateMazePosterPdf(state, paper), `maze-${paper}.pdf`, "application/pdf"))}>
                {t.downloadPoster}
              </button>
            </div>
            <p className={styles.note}>{t.posterNote}</p>
            <label className={styles.field}>
              <span>{t.pngSize}</span>
              <select value={pngSize} onChange={(e) => setPngSize(Number(e.target.value))}>
                {PNG_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {fill(t.pixels, { n })}
                  </option>
                ))}
              </select>
            </label>
            <p className={styles.note}>{t.pngNote}</p>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
