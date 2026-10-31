"use client";

import { useEffect, useState } from "react";
import catalog from "@/i18n/messages/needlepoint.json";
import { generateNeedlepoint, generateNeedlepointPdf, type Locale, type NeedlepointRequest, type NeedlepointResult, type NeedlepointStitch, type NeedlepointYarn } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { fill, messages } from "@/lib/i18n";
import {
  FINISH_OPTIONS,
  GRID_OPTIONS,
  MARGIN_OPTIONS,
  MAX_COLORS,
  MESH_OPTIONS,
  MOTIFS,
  removeColor,
  resizeGrid,
  serializeNeedlepointState,
  setCell,
  STITCH_OPTIONS,
  YARN_OPTIONS,
} from "@/lib/needlepointState";
import { syncShareLink } from "@/lib/toolOptions";
import { paletteAccents } from "@/lib/palettes";
import { OptionNav, useOptionNavigation } from "./OptionNav";
import { PalettePicker } from "./PalettePicker";
import styles from "./BlockBuilder.module.css";
import { CountedProjectGuide, NumberSelect } from "./CountedProjectGuide";
import css from "./CrossStitchBuilder.module.css";
import { CrossStitchBuilderGrid } from "./CrossStitchBuilderGrid";

/** A color's chart symbol. Blank for a color just added, until the next result arrives. */
const symbolOf = (result: NeedlepointResult, i: number) => result.colors[i]?.symbol ?? "";

type View = "stitched" | "chart" | "edit";

export function NeedlepointBuilder({ locale, option, labels, initialState, initialResult }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: NeedlepointRequest; initialResult: NeedlepointResult }) {
  const t = catalog[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("needlepoint", locale);
  const [state, setState] = useState(initialState);
  const [result, setResult] = useState(initialResult);
  const [view, setView] = useState<View>("stitched");
  /** The color being painted, or -1 for bare canvas. */
  const [tool, setTool] = useState(0);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<NeedlepointRequest>) => setState((s) => ({ ...s, ...patch }));
  const setColor = (i: number, color: string) => setState((s) => ({ ...s, colors: s.colors.map((c, n) => (n === i ? color : c)) }));

  // Repainting a cell with its own color changes nothing, so a slow drag doesn't regenerate the chart.
  const paint = (row: number, column: number) => {
    const cell = tool < 0 ? "." : String.fromCharCode(97 + tool);
    setState((s) => (s.grid[row][column] === cell ? s : { ...s, grid: setCell(s.grid, row, column, cell) }));
  };

  useEffect(() => {
    let stale = false;
    generateNeedlepoint(state).then(
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
    const query = serializeNeedlepointState(state);
    syncShareLink(query, "needlepoint", option);
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

  const cellLabel = (row: number, column: number, cell: string) =>
    cell === "." ? fill(t.cellEmpty, { row: row + 1, column: column + 1 }) : fill(t.cellColor, { row: row + 1, column: column + 1, symbol: symbolOf(result, cell.charCodeAt(0) - 97) });
  const tabs: [View, string][] = [
    ["stitched", t.stitchedTab],
    ["chart", t.chartTab],
    ["edit", t.editTab],
  ];
  const stitchNames: Record<NeedlepointStitch, string> = { basketweave: t.stitchBasketweave, continental: t.stitchContinental, tent: t.stitchTent };
  const yarnNames: Record<NeedlepointYarn, string> = { tapestry: t.yarnTapestry, persian: t.yarnPersian };

  return (
    <div className={styles.builder}>
      <OptionNav tool="needlepoint" locale={locale} current={option} labels={labels} />
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          <div className={`${styles.tabs} no-print`}>
            {tabs.map(([id, label]) => (
              <button key={id} type="button" className={view === id ? styles.tabOn : styles.tab} aria-pressed={view === id} onClick={() => setView(id)}>
                {label}
              </button>
            ))}
          </div>

          {view === "stitched" && (
            <>
              <div className={styles.art} dangerouslySetInnerHTML={{ __html: result.svg.stitched }} />
              <p className={styles.note}>{t.stitchedNote}</p>
            </>
          )}
          {view === "chart" && (
            <>
              <div className={styles.chart} dangerouslySetInnerHTML={{ __html: result.svg.chart }} />
              <p className={styles.note}>{t.chartNote}</p>
            </>
          )}
          {view === "edit" && (
            <>
              <div className={css.tools}>
                <span>{t.paint}</span>
                {state.colors.map((color, i) => (
                  <button key={i} type="button" className={tool === i ? css.toolOn : css.tool} aria-pressed={tool === i} onClick={() => setTool(i)}>
                    <span className={css.toolSwatch} style={{ background: color }} aria-hidden />
                    <span className={css.symbol}>{symbolOf(result, i)}</span>
                  </button>
                ))}
                <button type="button" className={tool < 0 ? css.toolOn : css.tool} aria-pressed={tool < 0} onClick={() => setTool(-1)}>
                  {t.erase}
                </button>
                <button type="button" className={css.tool} onClick={() => update({ grid: resizeGrid([], state.grid[0].length, state.grid.length) })}>
                  {t.clear}
                </button>
              </div>
              <CrossStitchBuilderGrid grid={state.grid} colors={state.colors} fabric={state.canvas} label={t.gridLabel} cellLabel={cellLabel} onPaint={paint} />
              <p className={styles.note}>{t.editNote}</p>
            </>
          )}

          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateNeedlepointPdf(state), "needlepoint-project.pdf", "application/pdf"))}>
              {t.downloadChart}
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(view === "chart" ? result.svg.chart : result.svg.stitched, view === "chart" ? "needlepoint-chart.svg" : "needlepoint-design.svg"))}>
              SVG
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(result.svg.stitched, "needlepoint-design.png"))}>
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
            <legend>{t.motif}</legend>
            <div className={styles.presets}>
              {MOTIFS.map((design) => (
                <button
                  key={design.id}
                  type="button"
                  className={styles.tab}
                  onClick={() => goToOption(design.id)}
                >
                  {t.motifs[design.id]}
                </button>
              ))}
            </div>
            <div className={styles.fieldRow}>
              <NumberSelect label={t.gridColumns} value={state.grid[0].length} options={GRID_OPTIONS} onChange={(columns) => update({ grid: resizeGrid(state.grid, columns, state.grid.length) })} />
              <NumberSelect label={t.gridRows} value={state.grid.length} options={GRID_OPTIONS} onChange={(rows) => update({ grid: resizeGrid(state.grid, state.grid[0].length, rows) })} />
            </div>
          </fieldset>

          <fieldset>
            <legend>{t.colors}</legend>
            {state.colors.map((color, i) => {
              const symbol = symbolOf(result, i);
              return (
                <div key={i} className={styles.stripe}>
                  <strong>{symbol}</strong>
                  <input type="color" aria-label={fill(t.colorLabel, { symbol })} value={color} onChange={(e) => setColor(i, e.target.value)} />
                  <span className={css.colorCount}>{result.colors[i]?.stitches ?? 0}</span>
                  <button
                    type="button"
                    className={styles.tab}
                    disabled={state.colors.length <= 1}
                    onClick={() => {
                      update(removeColor(state, i));
                      // Keep painting with the same color, whose position may have moved.
                      setTool((current) => (current === i ? 0 : current > i ? current - 1 : current));
                    }}
                  >
                    {t.remove}
                  </button>
                </div>
              );
            })}
            <button type="button" className={styles.tab} disabled={state.colors.length >= MAX_COLORS} onClick={() => update({ colors: [...state.colors, "#888888"] })}>
              {t.add}
            </button>
            <label className={`${styles.color} ${styles.check}`}>
              <input type="color" value={state.canvas} onChange={(e) => update({ canvas: e.target.value })} />
              {t.canvasColor}
            </label>
            <PalettePicker locale={locale} current={[state.canvas, ...state.colors]} onApply={(c) => update({ canvas: c[0], colors: paletteAccents(c, state.colors.length) })} />
          </fieldset>

          <fieldset>
            <legend>{t.canvasSection}</legend>
            <NumberSelect label={t.mesh} value={state.mesh} options={MESH_OPTIONS} onChange={(mesh) => update({ mesh })} />
            <label className={styles.field}>
              <span>{t.stitch}</span>
              <select value={state.stitch} onChange={(e) => update({ stitch: e.target.value as NeedlepointStitch })}>
                {STITCH_OPTIONS.map((stitch) => (
                  <option key={stitch} value={stitch}>
                    {stitchNames[stitch]}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>{t.yarn}</span>
              <select value={state.yarn} onChange={(e) => update({ yarn: e.target.value as NeedlepointYarn })}>
                {YARN_OPTIONS.map((yarn) => (
                  <option key={yarn} value={yarn}>
                    {yarnNames[yarn]}
                  </option>
                ))}
              </select>
            </label>
            <NumberSelect label={t.margin} value={state.margin} options={MARGIN_OPTIONS} unit={'"'} onChange={(margin) => update({ margin })} />
            <label className={styles.field}>
              <span>{t.finish}</span>
              <select value={state.finish} onChange={(e) => update({ finish: e.target.value as NeedlepointRequest["finish"] })}>
                {FINISH_OPTIONS.map((finish) => (
                  <option key={finish} value={finish}>
                    {finish === "frame" ? t.finishFrame : t.finishPillow}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>
        </form>
      </div>

      <p className={styles.notice}>
        <strong>{t.originalTitle}</strong> {t.originalText}
      </p>

      <CountedProjectGuide
        t={t}
        result={result}
        sizeLines={[fill(t.sizeLine, { w: result.width, h: result.height, mesh: state.mesh, columns: result.columns, rows: result.rows }), fill(t.canvasLine, { w: result.canvasWidth, h: result.canvasHeight })]}
        note={fill(t.yarnNote, { n: result.stitches, y: result.totalYards })}
      />
    </div>
  );
}
