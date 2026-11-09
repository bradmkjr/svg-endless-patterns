"use client";

import { ColorInput } from "./ColorInput";
import { useEffect, useState } from "react";
import { generateReactionDiffusion, generateReactionDiffusionPdf, type Locale, type RdColors, type RdRequest } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { useTrackCustomize } from "@/lib/analytics";
import { fill, messages } from "@/lib/i18n";
import copy from "@/i18n/messages/reactionDiffusion.json";
import { DIRECTION_OPTIONS, ITERATION_OPTIONS, MAX_SEED, PRESET_OPTIONS, REPEAT_OPTIONS, SCALE_OPTIONS, serializeRdState, STYLE_OPTIONS, THRESHOLD_OPTIONS, WEIGHT_OPTIONS } from "@/lib/reactionDiffusionState";
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

const COLOR_KEYS: (keyof RdColors)[] = ["background", "primary", "accent"];

export function ReactionDiffusionBuilder({ locale, option, labels, initialState }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: RdRequest }) {
  const t = copy[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("reactionDiffusion", locale);
  const [state, setState] = useState(initialState);
  useTrackCustomize("reactionDiffusion", state);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<RdRequest>) => setState((s) => ({ ...s, ...patch }));

  const result = useLiveResult(generateReactionDiffusion, state, setStatus, b.updateError);

  useEffect(() => {
    syncShareLink(serializeRdState(state), "reactionDiffusion", option);
    rememberSeed("reactionDiffusion", state.seed);
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

  return (
    <div className={styles.builder}>
      <OptionNav tool="reactionDiffusion" locale={locale} current={option} labels={labels} />
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          {/* Two repeats across, so the join is on show. */}
          {result ? (
            <>
              <div className={styles.tile} style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(repeat)}")`, backgroundSize: "50% auto" }} role="img" aria-label={t.previewAlt} />
              <p className={styles.note}>{fill(t.previewNote, { cells: result.cells, steps: result.steps, coverage: result.coverage, feed: result.feed, kill: result.kill })}</p>
            </>
          ) : (
            <ToolLoading locale={locale} />
          )}
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateReactionDiffusionPdf(state), "turing-pattern.pdf", "application/pdf"))}>
              {t.downloadPdf}
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(repeat, "turing-pattern-repeat.svg"))}>
              SVG
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(repeat, "turing-pattern-repeat.png"))}>
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
            <legend>{t.pattern}</legend>
            <label className={styles.field}>
              <span>{t.preset}</span>
              <select value={state.preset} onChange={(e) => goToOption(e.target.value)}>
                {PRESET_OPTIONS.map((id) => (
                  <option key={id} value={id}>
                    {t.presets[id]}
                  </option>
                ))}
              </select>
            </label>
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
            <legend>{t.growth}</legend>
            <div className={styles.fieldRow}>
              <NumberSelect label={t.scale} value={state.scale} options={SCALE_OPTIONS} format={(n) => fill(t.cells, { n })} onChange={(scale) => update({ scale })} />
              <NumberSelect label={t.iterations} value={state.iterations} options={ITERATION_OPTIONS} format={(n) => fill(t.steps, { n: n.toLocaleString(locale) })} onChange={(iterations) => update({ iterations })} />
            </div>
            <label className={styles.field}>
              <span>{t.direction}</span>
              <select value={state.direction} onChange={(e) => update({ direction: e.target.value as RdRequest["direction"] })}>
                {DIRECTION_OPTIONS.map((id) => (
                  <option key={id} value={id}>
                    {t.directions[id]}
                  </option>
                ))}
              </select>
            </label>
            <p className={styles.note}>{t.growthNote}</p>
          </fieldset>

          <fieldset>
            <legend>{t.look}</legend>
            <div className={styles.fieldRow}>
              <label className={styles.field}>
                <span>{t.style}</span>
                <select value={state.style} onChange={(e) => update({ style: e.target.value as RdRequest["style"] })}>
                  {STYLE_OPTIONS.map((id) => (
                    <option key={id} value={id}>
                      {t.styles[id]}
                    </option>
                  ))}
                </select>
              </label>
              <NumberSelect label={t.threshold} value={state.threshold} options={THRESHOLD_OPTIONS} format={(n) => `${n}%`} onChange={(threshold) => update({ threshold })} />
              {state.style === "outline" && <NumberSelect label={t.weight} value={state.weight} options={WEIGHT_OPTIONS} format={String} onChange={(weight) => update({ weight })} />}
            </div>
            <p className={styles.note}>{t.thresholdNote}</p>
          </fieldset>

          <fieldset>
            <legend>{t.colors}</legend>
            <div className={styles.fieldRow}>
              {COLOR_KEYS.map((key) => (
                <label key={key} className={styles.field}>
                  <span>{t[key]}</span>
                  <ColorInput value={state.colors[key]} onChange={(picked) => update({ colors: { ...state.colors, [key]: picked } })} />
                </label>
              ))}
            </div>
            <p className={styles.note}>{t.accentNote}</p>
            <PalettePicker locale={locale} current={[state.colors.background, state.colors.primary, state.colors.accent]} onApply={(c) => update({ colors: { background: c[0], primary: c[1], accent: c[2] ?? c[1] } })} />
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
