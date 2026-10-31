"use client";

import { useEffect, useState } from "react";
import { generateTartan, generateTartanPdf, type Locale, type TartanRequest, type TartanStripe } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { fill, messages } from "@/lib/i18n";
import { COUNT_OPTIONS, LENGTH_OPTIONS, MAX_STRIPES, serializeTartanState, TARTAN_PRESETS, TPI_OPTIONS, WIDTH_OPTIONS } from "@/lib/tartanState";
import { PalettePicker } from "./PalettePicker";
import { paletteAccents } from "@/lib/palettes";
import { ToolLoading } from "./ToolLoading";
import { useLiveResult } from "@/lib/useLiveResult";
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

export function TartanBuilder({ locale, initialState }: { locale: Locale; initialState: TartanRequest }) {
  const all = messages(locale);
  const t = all.tartan;
  const b = all.builder;
  const [state, setState] = useState(initialState);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<TartanRequest>) => setState((s) => ({ ...s, ...patch }));
  const setStripe = (i: number, patch: Partial<TartanStripe>) => setState((s) => ({ ...s, stripes: s.stripes.map((stripe, n) => (n === i ? { ...stripe, ...patch } : stripe)) }));

  const result = useLiveResult(generateTartan, state, setStatus, b.updateError);

  useEffect(() => {
    const query = serializeTartanState(state);
    window.history.replaceState(window.history.state, "", query ? `?${query}` : window.location.pathname);
  }, [state]);

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

  const swatch = result?.svg.swatch ?? "";
  const swatchUrl = `data:image/svg+xml,${encodeURIComponent(swatch)}`;
  const tileThreads = Number(/viewBox="0 0 (\d+) /.exec(swatch)?.[1] ?? 1);
  // Show about 8" of cloth, however large the repeat.
  const tileInches = tileThreads / state.threadsPerInch;

  return (
    <div className={styles.builder}>
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          {result ? <div className={styles.tile} style={{ backgroundImage: `url("${swatchUrl}")`, backgroundSize: `${(tileInches / 8) * 100}% auto`, imageRendering: "pixelated" }} role="img" aria-label={t.swatchAlt} /> : <ToolLoading locale={locale} />}
          <p className={styles.note}>{t.swatchNote}</p>
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateTartanPdf(state), "tartan-guide.pdf", "application/pdf"))}>
              {t.downloadGuide}
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(swatch, "tartan-repeat.svg"))}>
              SVG
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(swatch, "tartan-repeat.png"))}>
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
            <legend>{t.threads}</legend>
            <div className={styles.presets}>
              {TARTAN_PRESETS.map((preset) => (
                <button key={preset.id} type="button" className={styles.tab} onClick={() => update({ stripes: preset.stripes })}>
                  {t.presets[preset.id]}
                </button>
              ))}
            </div>
            {state.stripes.map((stripe, i) => (
              <div key={i} className={styles.stripe}>
                <strong>{String.fromCharCode(65 + i)}</strong>
                <input type="color" aria-label={fill(t.stripeColor, { letter: String.fromCharCode(65 + i) })} value={stripe.color} onChange={(e) => setStripe(i, { color: e.target.value })} />
                <select aria-label={fill(t.stripeCount, { letter: String.fromCharCode(65 + i) })} value={stripe.count} onChange={(e) => setStripe(i, { count: Number(e.target.value) })}>
                  {COUNT_OPTIONS.map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </select>
                <button type="button" className={styles.tab} disabled={state.stripes.length <= 2} onClick={() => update({ stripes: state.stripes.filter((_, n) => n !== i) })}>
                  {t.remove}
                </button>
              </div>
            ))}
            <button type="button" className={styles.tab} disabled={state.stripes.length >= MAX_STRIPES} onClick={() => update({ stripes: [...state.stripes, { color: "#888888", count: 4 }] })}>
              {t.add}
            </button>
            <label className={styles.check}>
              <input type="checkbox" checked={state.mirrored} onChange={(e) => update({ mirrored: e.target.checked })} />
              {t.mirrored}
            </label>
            <PalettePicker locale={locale} current={state.stripes.map((stripe) => stripe.color)} onApply={(c) => { const distinct = [...new Set(state.stripes.map((stripe) => stripe.color))]; const next = paletteAccents(c, distinct.length); update({ stripes: state.stripes.map((stripe) => ({ ...stripe, color: next[distinct.indexOf(stripe.color)] })) }); }} />
          </fieldset>

          <fieldset>
            <legend>{t.cloth}</legend>
            <div className={styles.fieldRow}>
              <NumberSelect label={t.width} value={state.width} options={WIDTH_OPTIONS} unit={'"'} onChange={(width) => update({ width })} />
              <NumberSelect label={t.length} value={state.length} options={LENGTH_OPTIONS} unit={'"'} onChange={(length) => update({ length })} />
            </div>
            <NumberSelect label={t.tpi} value={state.threadsPerInch} options={TPI_OPTIONS} onChange={(threadsPerInch) => update({ threadsPerInch })} />
          </fieldset>
        </form>
      </div>

      <p className={styles.notice}>
        <strong>{t.originalTitle}</strong> {t.originalText}
      </p>

      {result ? (
      <div className={styles.results}>
        <section>
          <h2>{t.guide}</h2>
          <ol className={styles.steps}>
            {result.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className={styles.note}>{fill(t.repeatNote, { threads: result.threads, repeat: result.repeat })}</p>
        </section>

        <section>
          <h2>{t.yarn}</h2>
          <table className={styles.yardage}>
            <thead>
              <tr>
                <th scope="col">{t.color}</th>
                <th scope="col">{t.warp}</th>
                <th scope="col">{t.weft}</th>
                <th scope="col" style={{ textAlign: "right" }}>
                  {t.yards}
                </th>
              </tr>
            </thead>
            <tbody>
              {result.colors.map((c) => (
                <tr key={c.letter}>
                  <th scope="row">
                    <span className={styles.swatch} style={{ background: c.color }} aria-hidden />
                    {c.letter}
                  </th>
                  <td style={{ textAlign: "left", fontWeight: 400 }}>{c.warpEnds}</td>
                  <td style={{ textAlign: "left", fontWeight: 400 }}>{c.weftPicks}</td>
                  <td>{c.yards}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={styles.note}>{fill(t.yarnNote, { y: result.totalYards })}</p>
        </section>
      </div>
      ) : null}
    </div>
  );
}
