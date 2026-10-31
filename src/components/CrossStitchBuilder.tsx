"use client";

import { useEffect, useState } from "react";
import catalog from "@/i18n/messages/crossStitch.json";
import { generateCrossStitch, generateCrossStitchPdf, type CrossStitchCraft, type CrossStitchRequest, type CrossStitchResult, type Locale } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { fill, messages } from "@/lib/i18n";
import {
  COUNT_OPTIONS,
  DEFAULT_COUNT,
  GRID_OPTIONS,
  MARGIN_OPTIONS,
  MAX_COLORS,
  MOTIFS,
  removeColor,
  resizeGrid,
  serializeCrossStitchState,
  setCell,
  STRAND_OPTIONS,
} from "@/lib/crossStitchState";
import { OptionNav, useOptionNavigation } from "./OptionNav";
import { PalettePicker } from "./PalettePicker";
import { syncShareLink } from "@/lib/toolOptions";
import { paletteAccents } from "@/lib/palettes";
import styles from "./BlockBuilder.module.css";
import css from "./CrossStitchBuilder.module.css";
import { CrossStitchBuilderGrid } from "./CrossStitchBuilderGrid";

/** A color's chart symbol. Blank for a color just added, until the next result arrives. */
const symbolOf = (result: CrossStitchResult, i: number) => result.colors[i]?.symbol ?? "";

type View = "stitched" | "chart" | "edit";
/** The color being painted, or -1 for bare fabric. */
type Tool = number;

function NumberSelect({ label, value, options, unit = "", onChange }: { label: string; value: number; options: number[]; unit?: string; onChange: (value: number) => void }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {options.map((option) => (
          <option key={option} value={option}>{`${option}${unit}`}</option>
        ))}
      </select>
    </label>
  );
}

export function CrossStitchBuilder({ locale, option, labels, initialState, initialResult }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: CrossStitchRequest; initialResult: CrossStitchResult }) {
  const t = catalog[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("crossStitch", locale);
  const [state, setState] = useState(initialState);
  const [result, setResult] = useState(initialResult);
  const [view, setView] = useState<View>("stitched");
  const [tool, setTool] = useState<Tool>(0);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<CrossStitchRequest>) => setState((s) => ({ ...s, ...patch }));
  const setColor = (i: number, color: string) => setState((s) => ({ ...s, colors: s.colors.map((c, n) => (n === i ? color : c)) }));

  // Repainting a cell with its own color changes nothing, so a slow drag doesn't regenerate the chart.
  const paint = (row: number, column: number) => {
    const cell = tool < 0 ? "." : String.fromCharCode(97 + tool);
    setState((s) => (s.grid[row][column] === cell ? s : { ...s, grid: setCell(s.grid, row, column, cell) }));
  };

  useEffect(() => {
    let stale = false;
    generateCrossStitch(state).then(
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
    const query = serializeCrossStitchState(state);
    syncShareLink(query, "crossStitch", option);
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

  const setCraft = (craft: CrossStitchCraft) => update({ craft, count: DEFAULT_COUNT[craft] });
  const cross = state.craft === "cross";
  const cellLabel = (row: number, column: number, cell: string) =>
    cell === "." ? fill(t.cellEmpty, { row: row + 1, column: column + 1 }) : fill(t.cellColor, { row: row + 1, column: column + 1, symbol: symbolOf(result, cell.charCodeAt(0) - 97) });
  const tabs: [View, string][] = [
    ["stitched", t.stitchedTab],
    ["chart", t.chartTab],
    ["edit", t.editTab],
  ];

  return (
    <div className={styles.builder}>
      <OptionNav tool="crossStitch" locale={locale} current={option} labels={labels} />
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
              <CrossStitchBuilderGrid grid={state.grid} colors={state.colors} fabric={state.fabric} label={t.gridLabel} cellLabel={cellLabel} onPaint={paint} />
              <p className={styles.note}>{t.editNote}</p>
            </>
          )}

          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateCrossStitchPdf(state), "cross-stitch-chart.pdf", "application/pdf"))}>
              {t.downloadChart}
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(view === "chart" ? result.svg.chart : result.svg.stitched, view === "chart" ? "cross-stitch-chart.svg" : "cross-stitch-design.svg"))}>
              SVG
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(result.svg.stitched, "cross-stitch-design.png"))}>
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
              {MOTIFS.map((motif) => (
                <button
                  key={motif.id}
                  type="button"
                  className={styles.tab}
                  onClick={() => goToOption(motif.id)}
                >
                  {t.motifs[motif.id]}
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
              <input type="color" value={state.fabric} onChange={(e) => update({ fabric: e.target.value })} />
              {t.fabricColor}
            </label>
            <PalettePicker locale={locale} current={[state.fabric, ...state.colors]} onApply={(c) => update({ fabric: c[0], colors: paletteAccents(c, state.colors.length) })} />
          </fieldset>

          <fieldset>
            <legend>{t.fabric}</legend>
            <div className={styles.presets} role="group" aria-label={t.craft}>
              <button type="button" className={cross ? styles.tabOn : styles.tab} aria-pressed={cross} onClick={() => setCraft("cross")}>
                {t.craftCross}
              </button>
              <button type="button" className={cross ? styles.tab : styles.tabOn} aria-pressed={!cross} onClick={() => setCraft("needlepoint")}>
                {t.craftNeedlepoint}
              </button>
            </div>
            <NumberSelect label={cross ? t.countCross : t.countNeedlepoint} value={state.count} options={COUNT_OPTIONS[state.craft]} onChange={(count) => update({ count })} />
            {cross && <NumberSelect label={t.strands} value={state.strands} options={STRAND_OPTIONS} onChange={(strands) => update({ strands })} />}
            <NumberSelect label={t.margin} value={state.margin} options={MARGIN_OPTIONS} unit={'"'} onChange={(margin) => update({ margin })} />
          </fieldset>
        </form>
      </div>

      <p className={styles.notice}>
        <strong>{t.originalTitle}</strong> {t.originalText}
      </p>

      <div className={styles.results}>
        <section>
          <h2>{t.guide}</h2>
          <p className={styles.quiltSize}>{fill(t.sizeLine, { w: result.width, h: result.height, count: state.count, columns: result.columns, rows: result.rows })}</p>
          <p className={styles.quiltSize}>{fill(t.fabricLine, { w: result.fabricWidth, h: result.fabricHeight })}</p>
          <ol className={styles.steps}>
            {result.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section>
          <h2>{t.colorList}</h2>
          <table className={styles.yardage}>
            <thead>
              <tr>
                <th scope="col">{t.symbol}</th>
                <th scope="col">{t.color}</th>
                <th scope="col" style={{ textAlign: "right" }}>
                  {t.stitches}
                </th>
                <th scope="col" style={{ textAlign: "right" }}>
                  {t.yards}
                </th>
              </tr>
            </thead>
            <tbody>
              {result.colors.map((c) => (
                <tr key={c.symbol}>
                  <th scope="row" className={css.symbol}>
                    {c.symbol}
                  </th>
                  <td style={{ textAlign: "left", fontWeight: 400 }}>
                    <span className={styles.swatch} style={{ background: c.color }} aria-hidden />
                    {c.color}
                  </td>
                  <td>{c.stitches}</td>
                  <td>{c.yards}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={styles.note}>{fill(cross ? t.flossNote : t.threadNote, { n: result.stitches, y: result.totalYards })}</p>
        </section>
      </div>
    </div>
  );
}
