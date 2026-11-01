"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { generateLife, generateLifePdf, type LifeColors, type LifeRequest, type LifeResult, type Locale } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { fill, messages } from "@/lib/i18n";
import copy from "@/i18n/messages/life.json";
import { CELL_SIZE_OPTIONS, columnOptions, COUNT_OPTIONS, NEIGHBORHOOD_OPTIONS, PATTERN_OPTIONS, phaseOptions, rowOptions, serializeLifeState, SPACING_OPTIONS } from "@/lib/lifeState";
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
const VIEWS: View[] = ["sheet", "tile", "phases", "neighborhood"];
const COLOR_KEYS: (keyof LifeColors)[] = ["background", "primary", "accent"];

export function LifeBuilder({ locale, option, labels, initialState }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: LifeRequest }) {
  const t = copy[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("life", locale);
  const [state, setState] = useState(initialState);
  const [view, setView] = useState<View>("sheet");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

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
  const hasPhases = phaseOptions(state.pattern).length > 1;

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
              <div className={`art ${styles.art}`} role="img" aria-label={t.views[view]} onClick={view === "neighborhood" ? pickCell : undefined} dangerouslySetInnerHTML={{ __html: svg }} />
              <p className={styles.note}>{t.notes[state.pattern]}</p>
              {view === "sheet" && <p className={styles.note}>{fill(t.sheetStats, { cols: result.sheet.cols, rows: result.sheet.rows, width: result.sheet.width, height: result.sheet.height, live: result.sheet.live })}</p>}
              {view === "tile" && <p className={styles.note}>{fill(t.tileStats, { cols: result.tile.cols, rows: result.tile.rows, spacing: state.spacing })}</p>}
              {view === "phases" && <p className={styles.note}>{hasPhases ? fill(t.phaseStats, { period: result.period, counts: result.phaseCells.join(", ") }) : fill(t.stillStats, { live: result.phaseCells[0] })}</p>}
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
            {hasPhases && <NumberSelect label={t.phase} value={state.phase} options={phaseOptions(state.pattern)} format={(n) => String(n + 1)} onChange={(phase) => update({ phase })} />}
          </fieldset>

          <fieldset>
            <legend>{t.layout}</legend>
            <div className={styles.fieldRow}>
              <NumberSelect label={t.columns} value={state.columns} options={COUNT_OPTIONS} onChange={(columns) => update({ columns })} />
              <NumberSelect label={t.rows} value={state.rows} options={COUNT_OPTIONS} onChange={(rows) => update({ rows })} />
            </div>
            <div className={styles.fieldRow}>
              <NumberSelect label={t.cellSize} value={state.cellSize} options={CELL_SIZE_OPTIONS} format={(n) => `${n}"`} onChange={(cellSize) => update({ cellSize })} />
              <NumberSelect label={t.spacing} value={state.spacing} options={SPACING_OPTIONS} onChange={(spacing) => update({ spacing })} />
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
              <NumberSelect label={t.cellColumn} value={state.cellX} options={columnOptions(state.pattern)} format={(n) => String(n + 1)} onChange={(cellX) => update({ cellX })} />
              <NumberSelect label={t.cellRow} value={state.cellY} options={rowOptions(state.pattern)} format={(n) => String(n + 1)} onChange={(cellY) => update({ cellY })} />
            </div>
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
            <PalettePicker locale={locale} current={[state.colors.background, state.colors.primary, state.colors.accent]} onApply={(c) => update({ colors: { background: c[0], primary: c[1], accent: c[2] ?? c[1] } })} />
          </fieldset>
        </form>
      </div>
    </div>
  );
}
