"use client";

import { useEffect, useState } from "react";
import { generateMaze, generateMazePdf, type Locale, type MazeColors, type MazeRequest, type MazeResult } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { fill, messages } from "@/lib/i18n";
import copy from "@/i18n/messages/maze.json";
import { ALGORITHM_OPTIONS, DIFFICULTY_OPTIONS, MAX_SEED, serializeMazeState, SHAPE_OPTIONS, WEIGHT_OPTIONS } from "@/lib/mazeState";
import { paletteAccents } from "@/lib/palettes";
import { rememberSeed, syncShareLink } from "@/lib/toolOptions";
import { OptionNav, useOptionNavigation } from "./OptionNav";
import { PalettePicker } from "./PalettePicker";
import styles from "./BlockBuilder.module.css";

const COLOR_KEYS: (keyof MazeColors)[] = ["background", "wall", "accent"];
const VIEWS = ["maze", "solution"] as const;

export function MazeBuilder({ locale, option, labels, initialState, initialResult }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: MazeRequest; initialResult: MazeResult }) {
  const t = copy[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("maze", locale);
  const [state, setState] = useState(initialState);
  const [result, setResult] = useState(initialResult);
  const [view, setView] = useState<(typeof VIEWS)[number]>("maze");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<MazeRequest>) => setState((s) => ({ ...s, ...patch }));

  useEffect(() => {
    let stale = false;
    generateMaze(state).then(
      (next) => {
        if (!stale) setResult(next);
      },
      () => {
        if (!stale) setStatus(b.updateError);
      },
    );
    return () => {
      stale = true;
    };
  }, [state, b.updateError]);

  useEffect(() => {
    const query = serializeMazeState(state);
    syncShareLink(query, "maze", option);
  }, [state, option]);

  const setSeed = (seed: number) => {
    rememberSeed("maze", seed);
    update({ seed });
  };

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

  const svg = result.svg[view];

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
          </div>
          <div className={`art ${styles.art}`} role="img" aria-label={view === "maze" ? t.mazeAlt : t.solutionAlt} dangerouslySetInnerHTML={{ __html: svg }} />
          <p className={styles.note}>{t.howNote}</p>
          <p className={styles.note}>{fill(t.stats, { cells: result.cells, length: result.solutionLength, deadEnds: result.deadEnds })}</p>
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateMazePdf(state), "maze.pdf", "application/pdf"))}>
              {t.downloadPdf}
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(svg, `maze-${view}.svg`))}>
              SVG
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(svg, `maze-${view}.png`))}>
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
                <select value={state.difficulty} onChange={(e) => update({ difficulty: e.target.value as MazeRequest["difficulty"] })}>
                  {DIFFICULTY_OPTIONS.map((id) => (
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
                  <input type="color" value={state.colors[key]} onChange={(e) => update({ colors: { ...state.colors, [key]: e.target.value } })} />
                </label>
              ))}
            </div>
            <PalettePicker locale={locale} current={[state.colors.background, state.colors.wall, state.colors.accent]} onApply={(c) => update({ colors: { background: c[0], wall: c[1], accent: paletteAccents(c, 2)[1] } })} />
          </fieldset>
        </form>
      </div>
    </div>
  );
}
