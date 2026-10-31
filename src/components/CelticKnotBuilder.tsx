"use client";

import { useEffect, useState } from "react";
import { generateCelticKnot, generateCelticKnotPdf, type CelticKnotRequest, type CelticKnotResult, type Locale } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { fill, messages } from "@/lib/i18n";
import celticText from "@/i18n/messages/celticKnot.json";
import { defaultCelticKnotState, DENSITY_OPTIONS, INCH_OPTIONS, INTERLACE_OPTIONS, MAX_COLORS, MAX_SEED, PATTERN_OPTIONS, RIBBON_OPTIONS, SEEDED_PATTERNS, serializeCelticKnotState, SIZE_OPTIONS } from "@/lib/celticKnotState";
import { OptionNav, useOptionNavigation } from "./OptionNav";
import { PalettePicker } from "./PalettePicker";
import { syncShareLink } from "@/lib/toolOptions";
import { paletteAccents } from "@/lib/palettes";
import styles from "./BlockBuilder.module.css";

type View = keyof CelticKnotResult["svg"];
const VIEWS: View[] = ["art", "cut", "stencil", "coloring"];

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

export function CelticKnotBuilder({ locale, option, labels, initialState, initialResult }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: CelticKnotRequest; initialResult: CelticKnotResult }) {
  const b = messages(locale).builder;
  const t = celticText[locale];
  const goToOption = useOptionNavigation("celticKnot", locale);
  const [state, setState] = useState(initialState);
  const [result, setResult] = useState(initialResult);
  const [view, setView] = useState<View>("art");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<CelticKnotRequest>) => setState((s) => ({ ...s, ...patch }));
  const setColor = (i: number, color: string) => setState((s) => ({ ...s, colors: s.colors.map((c, n) => (n === i ? color : c)) }));

  useEffect(() => {
    let stale = false;
    generateCelticKnot(state).then(
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
    const query = serializeCelticKnotState(state);
    syncShareLink(query, "celticKnot", option, { value: state.seed, base: defaultCelticKnotState(state.locale).seed });
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

  const svg = result.svg[view];
  const seeded = SEEDED_PATTERNS.includes(state.pattern);

  return (
    <div className={styles.builder}>
      <OptionNav tool="celticKnot" locale={locale} current={option} labels={labels} />
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          <div className={`${styles.tabs} no-print`}>
            {VIEWS.map((name) => (
              <button key={name} type="button" className={view === name ? styles.tabOn : styles.tab} aria-pressed={view === name} onClick={() => setView(name)}>
                {t.views[name]}
              </button>
            ))}
          </div>
          {/* The cut and stencil files have no background of their own, so show them on white. */}
          <div className={`art ${styles.art}`} style={{ background: "#ffffff" }} role="img" aria-label={t.artAlt} dangerouslySetInnerHTML={{ __html: svg }} />
          <p className={styles.note}>{t.viewNotes[view]}</p>
          <p className={styles.note}>{fill(t.stats, { strands: result.strands, crossings: result.crossings, breaks: result.breaks, pieces: result.pieces })}</p>
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateCelticKnotPdf(state), "celtic-knot.pdf", "application/pdf"))}>
              {t.downloadPdf}
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(svg, `celtic-knot-${view}.svg`))}>
              SVG
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(svg, `celtic-knot-${view}.png`))}>
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
            <legend>{t.grid}</legend>
            <div className={styles.fieldRow}>
              <NumberSelect label={t.cols} value={state.cols} options={SIZE_OPTIONS} onChange={(cols) => update({ cols })} />
              <NumberSelect label={t.rows} value={state.rows} options={SIZE_OPTIONS} onChange={(rows) => update({ rows })} />
            </div>
          </fieldset>

          <fieldset>
            <legend>{t.breaks}</legend>
            <label className={styles.field}>
              <span>{t.pattern}</span>
              <select value={state.pattern} onChange={(e) => goToOption(e.target.value)}>
                {PATTERN_OPTIONS.map((pattern) => (
                  <option key={pattern} value={pattern}>
                    {t.patterns[pattern]}
                  </option>
                ))}
              </select>
            </label>
            {seeded && (
              <>
                <NumberSelect label={t.density} value={state.density} options={DENSITY_OPTIONS} unit="%" onChange={(density) => update({ density })} />
                <label className={styles.field}>
                  <span>{t.seed}</span>
                  <input
                    type="number"
                    min={0}
                    max={MAX_SEED}
                    step={1}
                    value={state.seed}
                    style={{ padding: "0.45rem 0.5rem", border: "1px solid var(--line)", borderRadius: 5, background: "var(--surface)", color: "var(--foreground)", font: "inherit", fontSize: "1rem" }}
                    onChange={(e) => update({ seed: Math.min(MAX_SEED, Math.max(0, Math.floor(Number(e.target.value)) || 0)) })}
                  />
                </label>
                <div className={styles.actions}>
                  <button type="button" className={styles.tab} onClick={() => update({ seed: Math.floor(Math.random() * (MAX_SEED + 1)) })}>
                    {t.newSeed}
                  </button>
                </div>
                <p className={styles.note}>{t.seedNote}</p>
              </>
            )}
          </fieldset>

          <fieldset>
            <legend>{t.ribbonGroup}</legend>
            <NumberSelect label={t.ribbon} value={state.ribbon} options={RIBBON_OPTIONS} unit="%" onChange={(ribbon) => update({ ribbon })} />
            <p className={styles.note}>{t.ribbonNote}</p>
            <label className={styles.field}>
              <span>{t.interlace}</span>
              <select value={state.interlace} onChange={(e) => update({ interlace: INTERLACE_OPTIONS.find((i) => i === e.target.value) ?? state.interlace })}>
                {INTERLACE_OPTIONS.map((interlace) => (
                  <option key={interlace} value={interlace}>
                    {t.interlaces[interlace]}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>

          <fieldset>
            <legend>{t.colors}</legend>
            <div className={styles.colors}>
              {state.colors.map((color, i) => (
                <label key={i} className={styles.color}>
                  <input type="color" value={color} onChange={(e) => setColor(i, e.target.value)} />
                  {fill(t.strandColor, { n: i + 1 })}
                </label>
              ))}
              <label className={styles.color}>
                <input type="color" value={state.background} onChange={(e) => update({ background: e.target.value })} />
                {t.background}
              </label>
              <label className={styles.color}>
                <input type="color" value={state.outline} onChange={(e) => update({ outline: e.target.value })} />
                {t.outline}
              </label>
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.tab} disabled={state.colors.length >= MAX_COLORS} onClick={() => update({ colors: [...state.colors, "#888888"] })}>
                {t.add}
              </button>
              <button type="button" className={styles.tab} disabled={state.colors.length <= 1} onClick={() => update({ colors: state.colors.slice(0, -1) })}>
                {t.remove}
              </button>
            </div>
            <label className={styles.check}>
              <input type="checkbox" checked={state.perStrand} onChange={(e) => update({ perStrand: e.target.checked })} />
              {t.perStrand}
            </label>
            <PalettePicker locale={locale} current={[state.background, ...state.colors]} onApply={(c) => update({ background: c[0], outline: c[1], colors: paletteAccents(c, state.colors.length) })} />
          </fieldset>

          <fieldset>
            <legend>{t.output}</legend>
            <NumberSelect label={t.size} value={state.size} options={INCH_OPTIONS} unit={'"'} onChange={(size) => update({ size })} />
          </fieldset>
        </form>
      </div>

      <p className={styles.notice}>
        <strong>{t.originalTitle}</strong> {t.originalText}
      </p>

      <div className={styles.results}>
        <section>
          <h2>{t.guide}</h2>
          <ol className={styles.steps}>
            {result.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section>
          <h2>{t.strands}</h2>
          <table className={styles.yardage}>
            <thead>
              <tr>
                <th scope="col">{t.strand}</th>
                <th scope="col" style={{ textAlign: "right" }}>
                  {t.strandCrossings}
                </th>
              </tr>
            </thead>
            <tbody>
              {result.strandList.map((strand) => (
                <tr key={strand.index}>
                  <th scope="row">
                    <span className={styles.swatch} style={{ background: strand.color }} aria-hidden />
                    {strand.index + 1}
                  </th>
                  <td>{strand.crossings}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={styles.note}>{t.strandsNote}</p>
        </section>
      </div>
    </div>
  );
}
