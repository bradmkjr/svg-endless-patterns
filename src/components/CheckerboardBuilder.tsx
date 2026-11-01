"use client";

import { useEffect, useState } from "react";
import { generateCheckerboard, generateCheckerboardPdf, type CheckerboardRequest, type CheckerboardResult, type Locale } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { fill, messages } from "@/lib/i18n";
import copy from "@/i18n/messages/checkerboard.json";
import { boardAspect, COUNT_OPTIONS, isShapePattern, maxColors, MIN_COLORS, PATTERN_OPTIONS, RATIO_OPTIONS, RATIO_PRESETS, serializeCheckerboardState, spareColor, UNIT_OPTIONS } from "@/lib/checkerboardState";
import { syncShareLink } from "@/lib/toolOptions";
import { OptionNav, useOptionNavigation } from "./OptionNav";
import { PalettePicker } from "./PalettePicker";
import { ToolLoading } from "./ToolLoading";
import styles from "./BlockBuilder.module.css";

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

type View = keyof CheckerboardResult["svg"];
const VIEWS: View[] = ["art", "repeat"];

export function CheckerboardBuilder({ locale, option, labels, initialState }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: CheckerboardRequest }) {
  const t = copy[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("checkerboard", locale);
  const [state, setState] = useState(initialState);
  const [generated, setGenerated] = useState<{ key: string; result: CheckerboardResult } | null>(null);
  const [view, setView] = useState<View>("art");
  const [status, setStatus] = useState(t.loading);
  const [busy, setBusy] = useState(false);
  const requestKey = JSON.stringify(state);
  const result = generated?.key === requestKey ? generated.result : undefined;

  const update = (patch: Partial<CheckerboardRequest>) => {
    setStatus(t.loading);
    setState((s) => ({ ...s, ...patch }));
  };

  useEffect(() => {
    let stale = false;
    generateCheckerboard(state).then(
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
  }, [state, requestKey, b.updateError]);

  useEffect(() => {
    syncShareLink(serializeCheckerboardState(state), "checkerboard", option);
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

  const svg = result?.svg[view] ?? "";
  const gingham = state.pattern === "gingham";
  const colorLimit = maxColors(state.pattern);
  const shownColors = state.colors.slice(0, colorLimit);

  return (
    <div className={styles.builder}>
      <OptionNav tool="checkerboard" locale={locale} current={option} labels={labels} />
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          <div className={`${styles.tabs} no-print`}>
            {VIEWS.map((name) => (
              <button key={name} type="button" className={view === name ? styles.tabOn : styles.tab} aria-pressed={view === name} onClick={() => setView(name)}>
                {t.views[name]}
              </button>
            ))}
          </div>
          {result ? <div className={`art ${styles.art}`} role="img" aria-label={t.views[view]} dangerouslySetInnerHTML={{ __html: svg }} /> : <ToolLoading locale={locale} />}
          <p className={styles.note}>{t.viewNotes[view]}</p>
          {result && <p className={styles.note}>{fill(t.stats, { w: result.finished.width, h: result.finished.height, bw: result.box.width, bh: result.box.height })}</p>}
          {result && <p className={styles.note}>{result.counts.map((count, i) => fill(t.count, { n: i + 1, boxes: count.boxes })).join(" · ")}</p>}
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy || !result} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateCheckerboardPdf(state), "checkerboard.pdf", "application/pdf"))}>
              {t.downloadPdf}
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(svg, `checkerboard-${view}.svg`))}>
              SVG
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(svg, `checkerboard-${view}.png`))}>
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
            <p className={styles.note}>{t.patternNotes[state.pattern]}</p>
            <div className={styles.fieldRow}>
              <NumberSelect label={t.cols} value={state.cols} options={COUNT_OPTIONS} onChange={(cols) => update({ cols })} />
              <NumberSelect label={t.rows} value={state.rows} options={COUNT_OPTIONS} onChange={(rows) => update({ rows })} />
            </div>
          </fieldset>

          <fieldset>
            <legend>{isShapePattern(state.pattern) ? t.stretch : t.boxShape}</legend>
            {isShapePattern(state.pattern) && <p className={styles.note}>{t.stretchNote}</p>}
            <div className={styles.presets}>
              {RATIO_PRESETS.map(([w, h]) => {
                const on = state.ratioWidth === w && state.ratioHeight === h;
                return (
                  <button key={`${w}-${h}`} type="button" className={on ? styles.tabOn : styles.tab} aria-pressed={on} onClick={() => update({ ratioWidth: w, ratioHeight: h })}>
                    {`${w}:${h}`}
                  </button>
                );
              })}
            </div>
            <div className={styles.fieldRow}>
              <NumberSelect label={t.ratioWidth} value={state.ratioWidth} options={RATIO_OPTIONS} onChange={(ratioWidth) => update({ ratioWidth })} />
              <NumberSelect label={t.ratioHeight} value={state.ratioHeight} options={RATIO_OPTIONS} onChange={(ratioHeight) => update({ ratioHeight })} />
            </div>
            <NumberSelect label={t.unit} value={state.unit} options={UNIT_OPTIONS} unit={'"'} onChange={(unit) => update({ unit })} />
            <p className={styles.note}>{t.unitNote}</p>
          </fieldset>

          <fieldset>
            <legend>{t.colors}</legend>
            <div className={styles.colors}>
              {shownColors.map((color, i) => (
                <label key={i} className={styles.color}>
                  <input type="color" value={color} onChange={(e) => update({ colors: state.colors.map((c, n) => (n === i ? e.target.value : c)) })} />
                  {fill(t.color, { n: i + 1 })}
                </label>
              ))}
            </div>
            {gingham ? (
              <p className={styles.note}>{t.ginghamNote}</p>
            ) : (
              <>
                {state.pattern === "hexagon" && <p className={styles.note}>{t.hexagonNote}</p>}
                <div className={styles.actions}>
                  <button type="button" className={styles.tab} disabled={shownColors.length >= colorLimit} onClick={() => update({ colors: [...shownColors, spareColor(shownColors.length)] })}>
                    {t.add}
                  </button>
                  <button type="button" className={styles.tab} disabled={shownColors.length <= MIN_COLORS} onClick={() => update({ colors: shownColors.slice(0, -1) })}>
                    {t.remove}
                  </button>
                </div>
              </>
            )}
            <PalettePicker locale={locale} current={shownColors} onApply={(c) => update({ colors: [c[1], c[0], ...c.slice(2)].slice(0, Math.max(state.colors.length, MIN_COLORS)) })} />
          </fieldset>
        </form>
      </div>
    </div>
  );
}
