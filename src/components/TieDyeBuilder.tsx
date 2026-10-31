"use client";

import { useEffect, useState } from "react";
import { generateTieDye, generateTieDyePdf, type TieDyeResult, type Locale, type TieDyeRequest } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { fill, messages } from "@/lib/i18n";
import copy from "@/i18n/messages/tieDye.json";
import { paletteAccents } from "@/lib/palettes";
import { BAND_OPTIONS, GARMENT_OPTIONS, MAX_DYES, MAX_SEED, MIN_DYES, serializeTieDyeState, STRENGTH_OPTIONS, TECHNIQUE_OPTIONS } from "@/lib/tieDyeState";
import { rememberSeed, syncShareLink } from "@/lib/toolOptions";
import { ToolLoading } from "./ToolLoading";
import { useLiveResult } from "@/lib/useLiveResult";
import { OptionNav, useOptionNavigation } from "./OptionNav";
import { PalettePicker } from "./PalettePicker";
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

type View = keyof TieDyeResult["svg"];
const VIEWS: View[] = ["art", "guide"];

function StepList({ heading, steps }: { heading: string; steps: string[] }) {
  return (
    <section>
      <h2>{heading}</h2>
      <ol>
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );
}

export function TieDyeBuilder({ locale, option, labels, initialState }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: TieDyeRequest }) {
  const t = copy[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("tieDye", locale);
  const [state, setState] = useState(initialState);
  const [view, setView] = useState<View>("art");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<TieDyeRequest>) => setState((s) => ({ ...s, ...patch }));

  const result = useLiveResult(generateTieDye, state, setStatus, b.updateError);

  useEffect(() => {
    syncShareLink(serializeTieDyeState(state), "tieDye", option);
    rememberSeed("tieDye", state.seed);
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

  return (
    <div className={styles.builder}>
      <OptionNav tool="tieDye" locale={locale} current={option} labels={labels} />
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
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateTieDyePdf(state), "tie-dye.pdf", "application/pdf"))}>
              {t.downloadPdf}
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(svg, `tie-dye-${view}.svg`))}>
              SVG
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(svg, `tie-dye-${view}.png`))}>
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
              <span>{t.technique}</span>
              <select value={state.technique} onChange={(e) => goToOption(e.target.value)}>
                {TECHNIQUE_OPTIONS.map((id) => (
                  <option key={id} value={id}>
                    {t.techniques[id]}
                  </option>
                ))}
              </select>
            </label>
            <NumberSelect label={t.bands[state.technique]} value={state.bands} options={BAND_OPTIONS} onChange={(bands) => update({ bands })} />
            <div className={styles.fieldRow}>
              <label className={styles.field}>
                <span>{t.seed}</span>
                <input type="number" min={0} max={MAX_SEED} value={state.seed} onChange={(e) => update({ seed: Math.min(MAX_SEED, Math.max(0, Math.floor(Number(e.target.value)) || 0)) })} />
              </label>
              <button type="button" className={styles.tab} onClick={() => update({ seed: Math.floor(Math.random() * (MAX_SEED + 1)) })}>
                {t.newSeed}
              </button>
            </div>
          </fieldset>

          <fieldset>
            <legend>{t.colors}</legend>
            <div className={styles.colors}>
              {state.dyes.map((dye, i) => (
                <label key={i} className={styles.color}>
                  <input type="color" value={dye} onChange={(e) => update({ dyes: state.dyes.map((c, n) => (n === i ? e.target.value : c)) })} />
                  {fill(t.dye, { letter: String.fromCharCode(65 + i) })}
                </label>
              ))}
              <label className={styles.color}>
                <input type="color" value={state.fabric} onChange={(e) => update({ fabric: e.target.value })} />
                {t.fabric}
              </label>
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.tab} disabled={state.dyes.length >= MAX_DYES} onClick={() => update({ dyes: [...state.dyes, "#2f9e6e"] })}>
                {t.add}
              </button>
              <button type="button" className={styles.tab} disabled={state.dyes.length <= MIN_DYES} onClick={() => update({ dyes: state.dyes.slice(0, -1) })}>
                {t.remove}
              </button>
            </div>
            <PalettePicker locale={locale} current={[state.fabric, ...state.dyes]} onApply={(c) => update({ fabric: c[0], dyes: paletteAccents(c, Math.min(MAX_DYES, Math.max(state.dyes.length, c.length - 1))) })} />
          </fieldset>

          <fieldset>
            <legend>{t.amounts}</legend>
            <NumberSelect label={t.garments} value={state.garments} options={GARMENT_OPTIONS} onChange={(garments) => update({ garments })} />
            <NumberSelect label={t.strength} value={state.strength} options={STRENGTH_OPTIONS} format={(n) => t.strengths[String(n) as keyof typeof t.strengths]} onChange={(strength) => update({ strength })} />
          </fieldset>
        </form>
      </div>

      <p className={styles.notice}>
        <strong>{t.previewTitle}</strong> {t.previewText}
      </p>

      {result ? (
      <div className={styles.results}>
        <section>
          <h2>{fill(t.mixHeading, { n: state.garments })}</h2>
          <table className={styles.yardage}>
            <thead>
              <tr>
                <th scope="col">{t.dyeColumn}</th>
                <th scope="col">{t.waterColumn}</th>
                <th scope="col">{t.powderColumn}</th>
                <th scope="col">{t.ureaColumn}</th>
              </tr>
            </thead>
            <tbody>
              {result.mix.map((row) => (
                <tr key={row.letter}>
                  <th scope="row">
                    <span className={styles.swatch} style={{ background: row.color }} aria-hidden />
                    {row.letter}
                  </th>
                  <td>{fill(t.ounces, { n: row.ounces })}</td>
                  <td>{fill(t.teaspoons, { n: row.teaspoons })}</td>
                  <td>{fill(t.tablespoons, { n: row.ureaTablespoons })}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={styles.note}>{fill(t.mixNote, { strength: state.strength })}</p>
        </section>
        <StepList heading={t.safetyHeading} steps={result.steps.safety} />
        <StepList heading={t.foldHeading} steps={result.steps.fold} />
        <StepList heading={t.soakHeading} steps={result.steps.soak} />
        <StepList heading={t.applyHeading} steps={result.steps.apply} />
        <StepList heading={t.cureHeading} steps={result.steps.cure} />
      </div>
      ) : null}
    </div>
  );
}
