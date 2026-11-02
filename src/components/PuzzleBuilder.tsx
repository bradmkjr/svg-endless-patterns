"use client";

import { useEffect, useState } from "react";
import { generatePuzzle, generatePuzzlePdf, generatePuzzlePosterPdf, MAZE_PAPERS, type Locale, type MazePaperId, type PuzzleColors, type PuzzleDifficulty, type PuzzlePaper, type PuzzleRequest, type PuzzleType } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { useTrackCustomize } from "@/lib/analytics";
import { fill, messages } from "@/lib/i18n";
import copy from "@/i18n/messages/puzzle.json";
import { DIFFICULTY_OPTIONS, hasDifficulty, hasPoster, isSolved, MAX_SEED, PAPER_OPTIONS, PUZZLE_OPTIONS, PUZZLE_SIZES, serializePuzzleState } from "@/lib/puzzleState";
import { rememberSeed, syncShareLink } from "@/lib/toolOptions";
import { useLiveResult } from "@/lib/useLiveResult";
import { OptionNav, useOptionNavigation } from "./OptionNav";
import { PalettePicker } from "./PalettePicker";
import { ToolLoading } from "./ToolLoading";
import styles from "./BlockBuilder.module.css";

type View = "puzzle" | "solution";
const isPlainPaper = (paper: PuzzlePaper | MazePaperId): paper is PuzzlePaper => (PAPER_OPTIONS as string[]).includes(paper);
const COLOR_KEYS: (keyof PuzzleColors)[] = ["background", "ink", "accent"];

export function PuzzleBuilder({ locale, option, labels, initialState }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: PuzzleRequest }) {
  const t = copy[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("puzzle", locale);
  const [state, setState] = useState(initialState);
  useTrackCustomize("puzzle", state);
  const [chosenView, setView] = useState<View>("puzzle");
  const [paper, setPaper] = useState<PuzzlePaper | MazePaperId>("letter");
  const [withSolution, setWithSolution] = useState(true);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<PuzzleRequest>) => setState((s) => ({ ...s, ...patch }));
  const setSeed = (seed: number) => {
    rememberSeed("puzzle", seed);
    update({ seed });
  };

  const result = useLiveResult(generatePuzzle, state, setStatus, b.updateError);

  useEffect(() => {
    syncShareLink(serializePuzzleState(state), "puzzle", option);
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

  const solved = isSolved(state.puzzle);
  const view: View = solved ? chosenView : "puzzle";
  const svg = result?.svg[view] ?? "";
  const sizes = PUZZLE_SIZES[state.puzzle];
  // A poster is any page beyond the everyday ones, which keep their own layout with the rules at full size.
  const posters = hasPoster(state.puzzle) ? MAZE_PAPERS.filter((option) => !isPlainPaper(option.id)) : [];
  const isPoster = !isPlainPaper(paper);
  const fileName = `${state.puzzle}${solved ? `-${state.seed}` : ""}`;

  return (
    <div className={styles.builder}>
      <OptionNav tool="puzzle" locale={locale} current={option} labels={labels} />
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          {solved && (
            <div className={`${styles.tabs} no-print`}>
              {(["puzzle", "solution"] as const).map((name) => (
                <button key={name} type="button" className={view === name ? styles.tabOn : styles.tab} aria-pressed={view === name} onClick={() => setView(name)}>
                  {t.views[name]}
                </button>
              ))}
            </div>
          )}
          {svg ? <div className={`art ${styles.art}`} role="img" aria-label={labels[state.puzzle]} dangerouslySetInnerHTML={{ __html: svg }} /> : <ToolLoading locale={locale} />}
          {result && <p className={styles.note}>{result.rules}</p>}
          {result?.givens !== undefined && <p className={styles.note}>{fill(t.givens, { n: result.givens })}</p>}
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(isPoster ? await generatePuzzlePosterPdf(state, paper as MazePaperId) : await generatePuzzlePdf(state, { paper: paper as PuzzlePaper, solution: withSolution }), `${fileName}${isPoster ? `-${state.size}-${paper}` : ""}.pdf`, "application/pdf"))}>
              {t.downloadPdf}
            </button>
            <button type="button" disabled={busy || !svg} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(svg, `${fileName}-${view}.svg`))}>
              SVG
            </button>
            <button type="button" disabled={busy || !svg} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(svg, `${fileName}-${view}.png`))}>
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
              <span>{t.type}</span>
              <select value={state.puzzle} onChange={(e) => goToOption(e.target.value as PuzzleType)}>
                {PUZZLE_OPTIONS.map((id) => (
                  <option key={id} value={id}>
                    {t.types[id]}
                  </option>
                ))}
              </select>
            </label>
            {sizes.length > 1 && (
              <label className={styles.field}>
                <span>{t.size}</span>
                <select value={state.size} onChange={(e) => update({ size: Number(e.target.value) })}>
                  {sizes.map((size) => (
                    <option key={size} value={size}>
                      {fill(state.puzzle === "dots-and-boxes" ? t.boxesLabel : t.sizeLabel, { n: size })}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {hasDifficulty(state.puzzle) && (
              <>
                <label className={styles.field}>
                  <span>{t.difficulty}</span>
                  <select value={state.difficulty} onChange={(e) => update({ difficulty: e.target.value as PuzzleDifficulty })}>
                    {DIFFICULTY_OPTIONS.map((id) => (
                      <option key={id} value={id}>
                        {t.difficulties[id]}
                      </option>
                    ))}
                  </select>
                </label>
                <p className={styles.note}>{t.difficultyNote}</p>
              </>
            )}
            {solved && (
              <>
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
              </>
            )}
          </fieldset>

          <fieldset>
            <legend>{t.download}</legend>
            <label className={styles.field}>
              <span>{t.paper}</span>
              <select value={paper} onChange={(e) => setPaper(e.target.value as PuzzlePaper | MazePaperId)}>
                {PAPER_OPTIONS.map((id) => (
                  <option key={id} value={id}>
                    {t.papers[id]}
                  </option>
                ))}
                {posters.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {!isPlainPaper(paper) && result?.posterBox && <p className={styles.note}>{fill(t.posterBox, { size: result.posterBox[paper] })}</p>}
            <p className={styles.note}>{hasPoster(state.puzzle) ? `${t.paperNote} ${t.posterNote}` : t.paperNote}</p>
            {solved && (
              <label className={styles.check}>
                <input type="checkbox" checked={withSolution} onChange={(e) => setWithSolution(e.target.checked)} />
                {t.includeSolution}
              </label>
            )}
          </fieldset>

          <fieldset>
            <legend>{t.colors}</legend>
            <div className={styles.fieldRow}>
              {COLOR_KEYS.map((key) => (
                <label key={key} className={styles.field}>
                  <span>{t[key]}</span>
                  <input type="color" value={state.colors[key]} onChange={(e) => update({ colors: { ...state.colors, [key]: e.target.value } })} />
                </label>
              ))}
            </div>
            <p className={styles.note}>{t.colorNote}</p>
            <PalettePicker locale={locale} current={[state.colors.background, state.colors.ink, state.colors.accent]} onApply={(c) => update({ colors: { background: c[0], ink: c[1], accent: c[2] ?? c[1] } })} />
          </fieldset>
        </form>
      </div>
    </div>
  );
}
