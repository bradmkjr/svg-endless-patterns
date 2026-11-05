"use client";

import { useEffect, useState } from "react";
import { generateNature, generateNaturePdf, type Locale, type NatureColors, type NatureRequest } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { useTrackCustomize } from "@/lib/analytics";
import { fill, messages } from "@/lib/i18n";
import copy from "@/i18n/messages/nature.json";
import { DENSITY_OPTIONS, LAYOUT_OPTIONS, MAX_SEED, MOTIF_OPTIONS, PACKING_OPTIONS, REPEAT_OPTIONS, ROTATION_OPTIONS, SCALE_OPTIONS, serializeNatureState, STYLE_OPTIONS, VARIATION_OPTIONS } from "@/lib/natureState";
import { ToolLoading } from "./ToolLoading";
import { useLiveResult } from "@/lib/useLiveResult";
import { OptionNav, useOptionNavigation } from "./OptionNav";
import { PalettePicker } from "./PalettePicker";
import { rememberSeed, syncShareLink } from "@/lib/toolOptions";
import styles from "./BlockBuilder.module.css";

function NumberSelect({ label, value, options, format, onChange }: { label: string; value: number; options: number[]; format: (value: number) => string; onChange: (value: number) => void }) {
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

function TextSelect<T extends string>({ label, value, options, names, onChange }: { label: string; value: T; options: T[]; names: Record<T, string>; onChange: (value: T) => void }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((id) => (
          <option key={id} value={id}>
            {names[id]}
          </option>
        ))}
      </select>
    </label>
  );
}

const COLOR_KEYS: (keyof NatureColors)[] = ["background", "primary", "secondary", "accent"];

export function NatureBuilder({ locale, option, labels, initialState }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: NatureRequest }) {
  const t = copy[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("nature", locale);
  const [state, setState] = useState(initialState);
  useTrackCustomize("nature", state);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<NatureRequest>) => setState((s) => ({ ...s, ...patch }));

  const result = useLiveResult(generateNature, state, setStatus, b.updateError);

  useEffect(() => {
    syncShareLink(serializeNatureState(state), "nature", option);
    rememberSeed("nature", state.seed);
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

  const repeat = result?.svg.repeat ?? "";
  const turn = (n: number) => (n === 0 ? t.rotationNone : n === 180 ? t.rotationAny : `±${n}°`);

  return (
    <div className={styles.builder}>
      <OptionNav tool="nature" locale={locale} current={option} labels={labels} />
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          {/* Two repeats across, so the join is on show. */}
          {result ? (
            <>
              <div className={styles.tile} style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(repeat)}")`, backgroundSize: "50% auto" }} role="img" aria-label={t.previewAlt} />
              <p className={styles.note}>{fill(t.previewNote, { count: result.count, repeat: result.repeat })}</p>
            </>
          ) : (
            <ToolLoading locale={locale} />
          )}
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateNaturePdf(state), `nature-${state.motif}.pdf`, "application/pdf"))}>
              {t.downloadPdf}
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(repeat, `nature-${state.motif}-repeat.svg`))}>
              SVG
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(repeat, `nature-${state.motif}-repeat.png`))}>
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
            <legend>{t.motifHeading}</legend>
            <div className={styles.fieldRow}>
              <TextSelect label={t.motif} value={state.motif} options={MOTIF_OPTIONS} names={t.motifs} onChange={(motif) => goToOption(motif)} />
              <TextSelect label={t.style} value={state.style} options={STYLE_OPTIONS} names={t.styles} onChange={(style) => update({ style })} />
            </div>
            <div className={styles.fieldRow}>
              <NumberSelect label={t.scale} value={state.scale} options={SCALE_OPTIONS} format={(n) => `${n}%`} onChange={(scale) => update({ scale })} />
              <NumberSelect label={t.variation} value={state.variation} options={VARIATION_OPTIONS} format={(n) => `±${n}%`} onChange={(variation) => update({ variation })} />
              <NumberSelect label={t.rotation} value={state.rotation} options={ROTATION_OPTIONS} format={turn} onChange={(rotation) => update({ rotation })} />
            </div>
          </fieldset>

          <fieldset>
            <legend>{t.arrangement}</legend>
            <div className={styles.fieldRow}>
              <TextSelect label={t.layout} value={state.layout} options={LAYOUT_OPTIONS} names={t.layouts} onChange={(layout) => update({ layout })} />
              <NumberSelect label={t.density} value={state.density} options={DENSITY_OPTIONS} format={(n) => t.densities[String(n) as keyof typeof t.densities]} onChange={(density) => update({ density })} />
              {state.layout === "scatter" && <TextSelect label={t.packing} value={state.packing} options={PACKING_OPTIONS} names={t.packings} onChange={(packing) => update({ packing })} />}
            </div>
            <div className={styles.fieldRow}>
              <label className={styles.field}>
                <span>{t.seed}</span>
                <input type="number" min={0} max={MAX_SEED} value={state.seed} onChange={(e) => update({ seed: Math.min(MAX_SEED, Math.max(0, Math.floor(Number(e.target.value)) || 0)) })} />
              </label>
              <button type="button" className={styles.tab} onClick={() => update({ seed: Math.floor(Math.random() * (MAX_SEED + 1)) })}>
                {t.shuffle}
              </button>
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
            <PalettePicker
              locale={locale}
              current={[state.colors.background, state.colors.primary, state.colors.secondary, state.colors.accent]}
              onApply={(c) => update({ colors: { background: c[0], primary: c[1], secondary: c[2] ?? c[1], accent: c[3] ?? c[2] ?? c[1] } })}
            />
          </fieldset>

          <fieldset>
            <legend>{t.print}</legend>
            <NumberSelect label={t.repeatWidth} value={state.repeatWidth} options={REPEAT_OPTIONS} format={(n) => `${n}"`} onChange={(repeatWidth) => update({ repeatWidth })} />
          </fieldset>
        </form>
      </div>
    </div>
  );
}
