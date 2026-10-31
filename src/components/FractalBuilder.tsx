"use client";

import { useEffect, useState } from "react";
import { generateFractal, generateFractalPdf, type FractalColors, type FractalRequest, type FractalResult, type Locale } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { fill, messages } from "@/lib/i18n";
import copy from "@/i18n/messages/fractal.json";
import { ANGLE_OPTIONS, ANGLED_TYPES, depthOptions, serializeFractalState, TYPE_OPTIONS, WEIGHT_OPTIONS } from "@/lib/fractalState";
import { syncShareLink } from "@/lib/toolOptions";
import { OptionNav, useOptionNavigation } from "./OptionNav";
import { PalettePicker } from "./PalettePicker";
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

type View = keyof FractalResult["svg"];
const VIEWS: View[] = ["art", "outline"];
const COLOR_KEYS: (keyof FractalColors)[] = ["background", "primary", "accent"];

export function FractalBuilder({ locale, option, labels, initialState }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: FractalRequest }) {
  const t = copy[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("fractal", locale);
  const [state, setState] = useState(initialState);
  const [generated, setGenerated] = useState<{ key: string; result: FractalResult } | null>(null);
  const [view, setView] = useState<View>("art");
  const [status, setStatus] = useState(t.loading);
  const [busy, setBusy] = useState(false);

  const requestKey = JSON.stringify(state);
  const result = generated?.key === requestKey ? generated.result : undefined;

  const update = (patch: Partial<FractalRequest>) => {
    setStatus(t.loading);
    setState((s) => ({ ...s, ...patch }));
  };

  useEffect(() => {
    let stale = false;
    generateFractal(state).then(
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
    syncShareLink(serializeFractalState(state), "fractal", option);
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
      <OptionNav tool="fractal" locale={locale} current={option} labels={labels} />
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          <div className={`${styles.tabs} no-print`}>
            {VIEWS.map((name) => (
              <button key={name} type="button" className={view === name ? styles.tabOn : styles.tab} aria-pressed={view === name} onClick={() => setView(name)}>
                {t.views[name]}
              </button>
            ))}
          </div>
          {result ? <div className={`art ${styles.art}`} role="img" aria-label={t.views[view]} dangerouslySetInnerHTML={{ __html: svg }} /> : <div className={`art ${styles.art}`} style={{ aspectRatio: "1" }} aria-busy="true" />}
          <p className={styles.note}>{t.notes[state.type]}</p>
          {result && <p className={styles.note}>{fill(t.stats, { depth: state.depth, pieces: result.pieces })}</p>}
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy || !result} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateFractalPdf(state), `${state.type}.pdf`, "application/pdf"))}>
              {t.downloadPdf}
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(svg, `${state.type}-${view}.svg`))}>
              SVG
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(svg, `${state.type}-${view}.png`))}>
              PNG
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.copying, b.copied, () => navigator.clipboard.writeText(window.location.href))}>
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
              <span>{t.type}</span>
              <select value={state.type} onChange={(e) => goToOption(e.target.value)}>
                {TYPE_OPTIONS.map((id) => (
                  <option key={id} value={id}>
                    {t.types[id]}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.fieldRow}>
              <NumberSelect label={t.depth} value={state.depth} options={depthOptions(state.type)} onChange={(depth) => update({ depth })} />
              <NumberSelect label={t.weight} value={state.weight} options={WEIGHT_OPTIONS} onChange={(weight) => update({ weight })} />
            </div>
            {ANGLED_TYPES.includes(state.type) && <NumberSelect label={t.angle} value={state.angle} options={ANGLE_OPTIONS} unit="°" onChange={(angle) => update({ angle })} />}
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
