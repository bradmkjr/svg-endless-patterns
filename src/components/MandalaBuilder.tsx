"use client";

import { useEffect, useState } from "react";
import { generateMandala, generateMandalaPdf, type Locale, type MandalaMotif, type MandalaRequest, type MandalaResult } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { fill, messages } from "@/lib/i18n";
import mandalaText from "@/i18n/messages/mandala.json";
import { LINE_OPTIONS, MAX_COLORS, MAX_SEED, MOTIF_OPTIONS, RING_OPTIONS, serializeMandalaState, SYMMETRY_OPTIONS } from "@/lib/mandalaState";
import styles from "./BlockBuilder.module.css";

type View = keyof MandalaResult["svg"];
const VIEWS: View[] = ["art", "coloring"];

function NumberSelect({ label, value, options, onChange }: { label: string; value: number; options: number[]; onChange: (value: number) => void }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MandalaBuilder({ locale, initialState, initialResult }: { locale: Locale; initialState: MandalaRequest; initialResult: MandalaResult }) {
  const b = messages(locale).builder;
  const t = mandalaText[locale];
  const [state, setState] = useState(initialState);
  const [result, setResult] = useState(initialResult);
  const [view, setView] = useState<View>("art");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<MandalaRequest>) => setState((s) => ({ ...s, ...patch }));
  const setColor = (i: number, color: string) => setState((s) => ({ ...s, colors: s.colors.map((c, n) => (n === i ? color : c)) }));
  // Kept in catalog order, so a share link has one spelling of each set.
  const toggleMotif = (motif: MandalaMotif, on: boolean) => update({ motifs: MOTIF_OPTIONS.filter((m) => (m === motif ? on : state.motifs.includes(m))) });

  useEffect(() => {
    let stale = false;
    generateMandala(state).then(
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
    const query = serializeMandalaState(state);
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

  const svg = result.svg[view];

  return (
    <div className={styles.builder}>
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          <div className={`${styles.tabs} no-print`}>
            {VIEWS.map((name) => (
              <button key={name} type="button" className={view === name ? styles.tabOn : styles.tab} aria-pressed={view === name} onClick={() => setView(name)}>
                {t.views[name]}
              </button>
            ))}
          </div>
          <div className={`art ${styles.art}`} role="img" aria-label={t.artAlt} dangerouslySetInnerHTML={{ __html: svg }} />
          <p className={styles.note}>{t.viewNotes[view]}</p>
          <p className={styles.note}>{fill(t.stats, { n: result.symmetry, rings: result.rings.length, shapes: result.shapes })}</p>
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateMandalaPdf(state), "mandala.pdf", "application/pdf"))}>
              {t.downloadPdf}
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(svg, `mandala-${view}.svg`))}>
              SVG
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(svg, `mandala-${view}.png`))}>
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
            <div className={styles.fieldRow}>
              <NumberSelect label={t.symmetry} value={state.symmetry} options={SYMMETRY_OPTIONS} onChange={(symmetry) => update({ symmetry })} />
              <NumberSelect label={t.rings} value={state.rings} options={RING_OPTIONS} onChange={(rings) => update({ rings })} />
            </div>
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
          </fieldset>

          <fieldset>
            <legend>{t.motifs}</legend>
            {MOTIF_OPTIONS.map((motif) => {
              const on = state.motifs.includes(motif);
              return (
                <label key={motif} className={styles.check}>
                  <input type="checkbox" checked={on} disabled={on && state.motifs.length === 1} onChange={(e) => toggleMotif(motif, e.target.checked)} />
                  {t.motifNames[motif]}
                </label>
              );
            })}
            <p className={styles.note}>{t.motifNote}</p>
          </fieldset>

          <fieldset>
            <legend>{t.lines}</legend>
            <NumberSelect label={t.lineWeight} value={state.lineWeight} options={LINE_OPTIONS} onChange={(lineWeight) => update({ lineWeight })} />
          </fieldset>

          <fieldset>
            <legend>{t.colors}</legend>
            <div className={styles.colors}>
              {state.colors.map((color, i) => (
                <label key={i} className={styles.color}>
                  <input type="color" value={color} onChange={(e) => setColor(i, e.target.value)} />
                  {fill(t.color, { n: i + 1 })}
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
          </fieldset>
        </form>
      </div>

      <p className={styles.notice}>
        <strong>{t.originalTitle}</strong> {t.originalText}
      </p>

      <div className={styles.results}>
        <section>
          <h2>{t.ringList}</h2>
          <table className={styles.yardage}>
            <thead>
              <tr>
                <th scope="col">{t.ring}</th>
                <th scope="col">{t.motif}</th>
                <th scope="col" style={{ textAlign: "right" }}>
                  {t.copies}
                </th>
              </tr>
            </thead>
            <tbody>
              {result.rings.map((ring) => (
                <tr key={ring.index}>
                  <th scope="row">
                    <span className={styles.swatch} style={{ background: ring.color }} aria-hidden />
                    {ring.index}
                  </th>
                  <td style={{ textAlign: "left", fontWeight: 400 }}>{t.motifNames[ring.motif]}</td>
                  <td>{ring.copies}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
