"use client";

import { useEffect, useState } from "react";
import { generateStainedGlass, generateStainedGlassPdf, type Locale, type StainedGlassRequest, type StainedGlassResult } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { fill, messages } from "@/lib/i18n";
import text from "@/i18n/messages/stainedGlass.json";
import { CAME_WIDTHS, GLASS_DETAILS, GLASS_LAYOUTS, GLASS_PALETTES, GLASS_SIDES, HEART_WIDTHS, serializeStainedGlassState } from "@/lib/stainedGlassState";
import { OptionNav, useOptionNavigation } from "./OptionNav";
import { PalettePicker } from "./PalettePicker";
import { syncShareLink } from "@/lib/toolOptions";
import { paletteAccents } from "@/lib/palettes";
import styles from "./BlockBuilder.module.css";

/** Came is measured in fractions, so 0.046875 shows as 3/64". */
function fraction(value: number): string {
  let top = Math.round(value * 64);
  let bottom = 64;
  while (top % 2 === 0) {
    top /= 2;
    bottom /= 2;
  }
  return `${top}/${bottom}"`;
}

function Select({ label, value, options, format, onChange }: { label: string; value: number; options: number[]; format: (value: number) => string; onChange: (value: number) => void }) {
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

export function StainedGlassBuilder({ locale, option, labels, initialState, initialResult }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: StainedGlassRequest; initialResult: StainedGlassResult }) {
  const t = text[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("stainedGlass", locale);
  const [state, setState] = useState(initialState);
  const [result, setResult] = useState(initialResult);
  const [view, setView] = useState<"panel" | "numbered">("panel");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<StainedGlassRequest>) => setState((s) => ({ ...s, ...patch }));

  useEffect(() => {
    let stale = false;
    generateStainedGlass(state).then(
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
    const query = serializeStainedGlassState(state);
    syncShareLink(query, "stainedGlass", option);
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
  const inches = (value: number) => `${value}"`;

  return (
    <div className={styles.builder}>
      <OptionNav tool="stainedGlass" locale={locale} current={option} labels={labels} />
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          <div className={styles.tabs}>
            {(["panel", "numbered"] as const).map((id) => (
              <button key={id} type="button" aria-pressed={view === id} className={view === id ? styles.tabOn : styles.tab} onClick={() => setView(id)}>
                {id === "panel" ? t.viewPanel : t.viewNumbered}
              </button>
            ))}
          </div>
          <div className={`${styles.art} ${styles.quiltArt}`} role="img" aria-label={view === "panel" ? t.panelAlt : t.numberedAlt} dangerouslySetInnerHTML={{ __html: svg }} />
          <p className={styles.note}>{fill(t.previewNote, { n: result.pieces.length, w: result.width, h: result.height })}</p>
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateStainedGlassPdf(state), "stained-glass-pattern.pdf", "application/pdf"))}>
              {t.downloadPattern}
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(svg, `stained-glass-${view}.svg`))}>
              SVG
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(svg, `stained-glass-${view}.png`))}>
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
            <legend>{t.layout}</legend>
            <div className={styles.presets}>
              {GLASS_LAYOUTS.map((layout) => (
                <button key={layout} type="button" aria-pressed={state.layout === layout} className={state.layout === layout ? styles.tabOn : styles.tab} onClick={() => goToOption(layout)}>
                  {t.layouts[layout]}
                </button>
              ))}
            </div>
            <Select label={t.detail} value={state.detail} options={GLASS_DETAILS} format={(d) => t.details[String(d) as "1" | "2" | "3"]} onChange={(detail) => update({ detail })} />
          </fieldset>

          <fieldset>
            <legend>{t.panel}</legend>
            <div className={styles.fieldRow}>
              <Select label={t.width} value={state.width} options={GLASS_SIDES} format={inches} onChange={(width) => update({ width })} />
              <Select label={t.height} value={state.height} options={GLASS_SIDES} format={inches} onChange={(height) => update({ height })} />
            </div>
            <p className={styles.note}>{t.sizeHelp}</p>
          </fieldset>

          <fieldset>
            <legend>{t.came}</legend>
            <div className={styles.fieldRow}>
              <Select label={t.cameWidth} value={state.cameWidth} options={CAME_WIDTHS} format={fraction} onChange={(cameWidth) => update({ cameWidth })} />
              <Select label={t.heartWidth} value={state.heartWidth} options={HEART_WIDTHS} format={fraction} onChange={(heartWidth) => update({ heartWidth })} />
            </div>
            <p className={styles.note}>{t.cameHelp}</p>
          </fieldset>

          <fieldset>
            <legend>{t.glass}</legend>
            <div className={styles.palettes}>
              {GLASS_PALETTES.map((palette) => (
                <button key={palette.id} type="button" title={t.palettes[palette.id]} aria-label={fill(t.usePalette, { name: t.palettes[palette.id] })} className={styles.palette} onClick={() => update({ colors: palette.colors })}>
                  {palette.colors.map((color) => (
                    <span key={color} style={{ background: color }} />
                  ))}
                </button>
              ))}
            </div>
            <div className={styles.colors}>
              {state.colors.map((color, i) => {
                const name = fill(t.glassColor, { letter: String.fromCharCode(65 + i) });
                return (
                  <label key={i} className={styles.color}>
                    <input type="color" value={color} onChange={(e) => update({ colors: state.colors.map((c, n) => (n === i ? e.target.value : c)) })} />
                    {name}
                  </label>
                );
              })}
            </div>
            <PalettePicker locale={locale} current={[state.colors[3], state.colors[1], state.colors[0], state.colors[2]]} onApply={(c) => { const [main, center, second] = paletteAccents(c, 3); update({ colors: [center, main, second, c[0]] }); }} />
          </fieldset>
        </form>
      </div>

      {result.notes.map((note) => (
        <p key={note} className={styles.notice}>
          {note}
        </p>
      ))}

      <div className={styles.results}>
        <section>
          <h2>{t.rulesTitle}</h2>
          <p className={styles.note}>{t.rulesLead}</p>
          <ul className={styles.steps}>
            {result.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
          <h2>{t.guide}</h2>
          <ol className={styles.steps}>
            {result.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section>
          <h2>{t.estimate}</h2>
          <table className={styles.yardage}>
            <thead>
              <tr>
                <th scope="col">{t.color}</th>
                <th scope="col">{t.pieces}</th>
                <th scope="col">{t.cutArea}</th>
                <th scope="col" style={{ textAlign: "right" }}>
                  {t.needed}
                </th>
                <th scope="col" style={{ textAlign: "right" }}>
                  {t.squareFeet}
                </th>
              </tr>
            </thead>
            <tbody>
              {result.colors.map((c) => (
                <tr key={c.letter}>
                  <th scope="row" title={`${t.largest}: ${c.largest}`}>
                    <span className={styles.swatch} style={{ background: c.color }} aria-hidden />
                    {c.letter}
                  </th>
                  <td style={{ textAlign: "left", fontWeight: 400 }}>{c.pieces}</td>
                  <td style={{ textAlign: "left", fontWeight: 400 }}>{c.cutArea}</td>
                  <td>{c.needed}</td>
                  <td>{c.squareFeet}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={styles.note}>{fill(t.estimateNote, { waste: result.wastePercent })}</p>
          <p className={styles.note}>{fill(t.cameNote, { inner: result.came.innerFeet, outer: result.came.perimeterFeet })}</p>
        </section>
      </div>

      <p className={styles.notice}>
        <strong>{t.originalTitle}</strong> {t.originalText}
      </p>
    </div>
  );
}
