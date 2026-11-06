"use client";

import { useEffect, useState } from "react";
import { generateWaves, generateWavesPdf, type Locale, type WaveColors, type WavesRequest } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { useTrackCustomize } from "@/lib/analytics";
import { fill, messages } from "@/lib/i18n";
import copy from "@/i18n/messages/waves.json";
import {
  AMPLITUDE_OPTIONS,
  DRIFT_OPTIONS,
  FILL_OPTIONS,
  FREQUENCY_OPTIONS,
  LINE_OPTIONS,
  MIX_AMPLITUDE_OPTIONS,
  MIX_FREQUENCY_OPTIONS,
  MIX_OPTIONS,
  PHASE_OPTIONS,
  REPEAT_OPTIONS,
  serializeWavesState,
  WAVE_OPTIONS,
  WEIGHT_OPTIONS,
} from "@/lib/wavesState";
import { ToolLoading } from "./ToolLoading";
import { useLiveResult } from "@/lib/useLiveResult";
import { OptionNav, useOptionNavigation } from "./OptionNav";
import { PalettePicker } from "./PalettePicker";
import { syncShareLink } from "@/lib/toolOptions";
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

const COLOR_KEYS: (keyof WaveColors)[] = ["background", "line", "accent"];

export function WavesBuilder({ locale, option, labels, initialState }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: WavesRequest }) {
  const t = copy[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("waves", locale);
  const [state, setState] = useState(initialState);
  useTrackCustomize("waves", state);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<WavesRequest>) => setState((s) => ({ ...s, ...patch }));

  const result = useLiveResult(generateWaves, state, setStatus, b.updateError);

  useEffect(() => {
    syncShareLink(serializeWavesState(state), "waves", option);
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
  const figures = state.wave === "lissajous";
  const percent = (n: number) => `${n}%`;

  return (
    <div className={styles.builder}>
      <OptionNav tool="waves" locale={locale} current={option} labels={labels} />
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          {/* Two repeats across, so the join is on show. */}
          {result ? (
            <>
              <div className={styles.tile} style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(repeat)}")`, backgroundSize: "50% auto" }} role="img" aria-label={t.previewAlt} />
              <p className={styles.note}>{fill(t.previewNote, { summary: result.summary })}</p>
            </>
          ) : (
            <ToolLoading locale={locale} />
          )}
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateWavesPdf(state), "wave-pattern.pdf", "application/pdf"))}>
              {t.downloadPdf}
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(repeat, "wave-repeat.svg"))}>
              SVG
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(repeat, "wave-repeat.png"))}>
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
            <legend>{t.shape}</legend>
            <label className={styles.field}>
              <span>{t.wave}</span>
              <select value={state.wave} onChange={(e) => goToOption(e.target.value)}>
                {WAVE_OPTIONS.map((id) => (
                  <option key={id} value={id}>
                    {t.waves[id]}
                  </option>
                ))}
              </select>
            </label>
            {state.wave === "tangent" && <p className={styles.note}>{t.tangentNote}</p>}
            {figures && <p className={styles.note}>{t.lissajousNote}</p>}
            <div className={styles.fieldRow}>
              {figures ? (
                <NumberSelect label={t.ratio} value={state.frequency} options={FREQUENCY_OPTIONS} format={(n) => `${n}:${n + 1}`} onChange={(frequency) => update({ frequency })} />
              ) : (
                <NumberSelect label={t.frequency} value={state.frequency} options={FREQUENCY_OPTIONS} format={String} onChange={(frequency) => update({ frequency })} />
              )}
              <NumberSelect label={t.amplitude} value={state.amplitude} options={AMPLITUDE_OPTIONS} format={percent} onChange={(amplitude) => update({ amplitude })} />
            </div>
            <div className={styles.fieldRow}>
              <NumberSelect label={t.phase} value={state.phase} options={PHASE_OPTIONS} format={(n) => `${n}°`} onChange={(phase) => update({ phase })} />
              <NumberSelect label={t.drift} value={state.drift} options={DRIFT_OPTIONS} format={(n) => (n === 0 ? t.driftNone : String(n))} onChange={(drift) => update({ drift })} />
            </div>
            <div className={styles.fieldRow}>
              {figures ? (
                <NumberSelect label={t.figures} value={state.lines} options={LINE_OPTIONS} format={(n) => `${n / 4} × ${n / 4}`} onChange={(lines) => update({ lines })} />
              ) : (
                <NumberSelect label={t.lines} value={state.lines} options={LINE_OPTIONS} format={String} onChange={(lines) => update({ lines })} />
              )}
              <NumberSelect label={t.weight} value={state.weight} options={WEIGHT_OPTIONS} format={percent} onChange={(weight) => update({ weight })} />
            </div>
            <label className={styles.field}>
              <span>{t.fill}</span>
              <select value={state.fill} onChange={(e) => update({ fill: e.target.value as WavesRequest["fill"] })}>
                {FILL_OPTIONS.map((id) => (
                  <option key={id} value={id}>
                    {t.fills[id]}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>

          {!figures && (
            <fieldset>
              <legend>{t.mixLegend}</legend>
              <label className={styles.field}>
                <span>{t.mix}</span>
                <select value={state.mix} onChange={(e) => update({ mix: e.target.value as WavesRequest["mix"] })}>
                  {MIX_OPTIONS.map((id) => (
                    <option key={id} value={id}>
                      {t.mixes[id]}
                    </option>
                  ))}
                </select>
              </label>
              {state.mix !== "none" && (
                <div className={styles.fieldRow}>
                  <NumberSelect label={t.mixFrequency} value={state.mixFrequency} options={MIX_FREQUENCY_OPTIONS} format={String} onChange={(mixFrequency) => update({ mixFrequency })} />
                  <NumberSelect label={t.mixAmplitude} value={state.mixAmplitude} options={MIX_AMPLITUDE_OPTIONS} format={percent} onChange={(mixAmplitude) => update({ mixAmplitude })} />
                </div>
              )}
              <p className={styles.note}>{t.mixNote}</p>
            </fieldset>
          )}

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
            <p className={styles.note}>{t.accentNote}</p>
            <PalettePicker locale={locale} current={[state.colors.background, state.colors.line, state.colors.accent]} onApply={(c) => update({ colors: { background: c[0], line: c[1], accent: c[2] ?? c[1] } })} />
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
