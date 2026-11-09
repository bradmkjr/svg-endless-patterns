"use client";

import { ColorInput } from "./ColorInput";
import { useEffect, useState } from "react";
import { generateKolam, generateKolamPdf, type KolamColors, type KolamRequest, type Locale } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { useTrackCustomize } from "@/lib/analytics";
import { fill, messages } from "@/lib/i18n";
import copy from "@/i18n/messages/kolam.json";
import { FORM_OPTIONS, GRID_OPTIONS, LINE_OPTIONS, MAX_SEED, REPEAT_OPTIONS, RULE_OPTIONS, serializeKolamState, SIZE_OPTIONS, WEIGHT_OPTIONS } from "@/lib/kolamState";
import { ToolLoading } from "./ToolLoading";
import { useLiveResult } from "@/lib/useLiveResult";
import { OptionNav, useOptionNavigation } from "./OptionNav";
import { PalettePicker } from "./PalettePicker";
import { rememberSeed, syncShareLink } from "@/lib/toolOptions";
import styles from "./BlockBuilder.module.css";

function Select<T extends string | number>({ label, value, options, format, onChange }: { label: string; value: T; options: readonly T[]; format: (value: T) => string; onChange: (value: T) => void }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(options.find((o) => String(o) === e.target.value)!)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {format(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

const COLOR_KEYS: (keyof KolamColors)[] = ["background", "line", "accent"];

export function KolamBuilder({ locale, option, labels, initialState }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: KolamRequest }) {
  const t = copy[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("kolam", locale);
  const [state, setState] = useState(initialState);
  useTrackCustomize("kolam", state);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<KolamRequest>) => setState((s) => ({ ...s, ...patch }));

  const result = useLiveResult(generateKolam, state, setStatus, b.updateError);

  useEffect(() => {
    syncShareLink(serializeKolamState(state), "kolam", option);
    rememberSeed("kolam", state.seed);
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
  const colorLabel = { background: t.background, line: t.lineColor, accent: t.accent };

  return (
    <div className={styles.builder}>
      <OptionNav tool="kolam" locale={locale} current={option} labels={labels} />
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          {/* Two repeats across, so the join is on show. */}
          {result ? (
            <>
              <div
                className={styles.tile}
                style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(repeat)}")`, backgroundSize: "50% auto" }}
                role="img"
                aria-label={t.previewAlt}
              />
              <p className={styles.note}>
                {fill(t.previewNote, { dots: result.dots, width: result.repeat, height: result.height })}
                {result.loops !== null && ` ${fill(t.loopsNote, { loops: result.loops })}`}
              </p>
            </>
          ) : (
            <ToolLoading locale={locale} />
          )}
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateKolamPdf(state), "kolam.pdf", "application/pdf"))}>
              {t.downloadPdf}
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(repeat, "kolam-repeat.svg"))}>
              SVG
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(repeat, "kolam-repeat.png"))}>
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
            <legend>{t.tiles}</legend>
            <Select label={t.form} value={state.form} options={FORM_OPTIONS} format={(id) => t.forms[id]} onChange={goToOption} />
            <p className={styles.note}>{t.formNotes[state.form]}</p>
            <div className={styles.fieldRow}>
              <Select label={t.grid} value={state.grid} options={GRID_OPTIONS} format={(id) => t.grids[id]} onChange={(grid) => update({ grid })} />
              <Select label={t.size} value={state.size} options={SIZE_OPTIONS} format={String} onChange={(size) => update({ size })} />
            </div>
            <Select label={t.rule} value={state.rule} options={RULE_OPTIONS} format={(id) => t.rules[id]} onChange={(rule) => update({ rule })} />
            <p className={styles.note}>{t.ruleNote}</p>
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
            <legend>{t.line}</legend>
            <div className={styles.fieldRow}>
              <Select label={t.line} value={state.line} options={LINE_OPTIONS} format={(id) => t.lines[id]} onChange={(line) => update({ line })} />
              <Select label={t.weight} value={state.weight} options={WEIGHT_OPTIONS} format={(n) => `${n}%`} onChange={(weight) => update({ weight })} />
            </div>
            <label className={styles.check}>
              <input type="checkbox" checked={state.dots} onChange={(e) => update({ dots: e.target.checked })} />
              {t.showDots}
            </label>
          </fieldset>

          <fieldset>
            <legend>{t.colors}</legend>
            <div className={styles.fieldRow}>
              {COLOR_KEYS.map((key) => (
                <label key={key} className={styles.field}>
                  <span>{colorLabel[key]}</span>
                  <ColorInput value={state.colors[key]} onChange={(picked) => update({ colors: { ...state.colors, [key]: picked } })} />
                </label>
              ))}
            </div>
            <p className={styles.note}>{t.accentNote}</p>
            <PalettePicker locale={locale} current={[state.colors.background, state.colors.line, state.colors.accent]} onApply={(c) => update({ colors: { background: c[0], line: c[1], accent: c[2] ?? c[1] } })} />
          </fieldset>

          <fieldset>
            <legend>{t.print}</legend>
            <Select label={t.repeatWidth} value={state.repeatWidth} options={REPEAT_OPTIONS} format={(n) => `${n}"`} onChange={(repeatWidth) => update({ repeatWidth })} />
          </fieldset>
        </form>
      </div>
    </div>
  );
}
