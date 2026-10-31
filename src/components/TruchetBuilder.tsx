"use client";

import { useEffect, useState } from "react";
import { generateTruchet, generateTruchetPdf, type Locale, type TruchetColors, type TruchetRequest, type TruchetResult } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { fill, messages } from "@/lib/i18n";
import copy from "@/i18n/messages/truchet.json";
import { ARRANGEMENT_OPTIONS, GRID_OPTIONS, MAX_SEED, REPEAT_OPTIONS, serializeTruchetState, STYLE_OPTIONS, WEIGHT_OPTIONS } from "@/lib/truchetState";
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

const COLOR_KEYS: (keyof TruchetColors)[] = ["background", "line", "accent"];

export function TruchetBuilder({ locale, option, labels, initialState, initialResult }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: TruchetRequest; initialResult: TruchetResult }) {
  const t = copy[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("truchet", locale);
  const [state, setState] = useState(initialState);
  const [result, setResult] = useState(initialResult);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<TruchetRequest>) => setState((s) => ({ ...s, ...patch }));

  useEffect(() => {
    let stale = false;
    generateTruchet(state).then(
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
    const query = serializeTruchetState(state);
    syncShareLink(query, "truchet", option);
    rememberSeed("truchet", state.seed);
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

  const repeat = result.svg.repeat;
  const seeded = state.arrangement === "random" || state.arrangement === "mirror";

  return (
    <div className={styles.builder}>
      <OptionNav tool="truchet" locale={locale} current={option} labels={labels} />
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          {/* Two repeats across, so the join is on show. */}
          <div className={styles.tile} style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(repeat)}")`, backgroundSize: "50% auto" }} role="img" aria-label={t.previewAlt} />
          <p className={styles.note}>{fill(t.previewNote, { grid: state.grid, tiles: result.tiles, repeat: result.repeat })}</p>
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateTruchetPdf(state), "truchet-tiles.pdf", "application/pdf"))}>
              {t.downloadPdf}
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(repeat, "truchet-repeat.svg"))}>
              SVG
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(repeat, "truchet-repeat.png"))}>
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
            <label className={styles.field}>
              <span>{t.style}</span>
              <select value={state.style} onChange={(e) => goToOption(e.target.value)}>
                {STYLE_OPTIONS.map((id) => (
                  <option key={id} value={id}>
                    {t.styles[id]}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.fieldRow}>
              <NumberSelect label={t.grid} value={state.grid} options={GRID_OPTIONS} format={(n) => `${n} × ${n}`} onChange={(grid) => update({ grid })} />
              {state.style !== "triangles" && <NumberSelect label={t.weight} value={state.weight} options={WEIGHT_OPTIONS} format={(n) => `${n}%`} onChange={(weight) => update({ weight })} />}
            </div>
          </fieldset>

          <fieldset>
            <legend>{t.arrangement}</legend>
            <label className={styles.field}>
              <span>{t.layout}</span>
              <select value={state.arrangement} onChange={(e) => update({ arrangement: e.target.value as TruchetRequest["arrangement"] })}>
                {ARRANGEMENT_OPTIONS.map((id) => (
                  <option key={id} value={id}>
                    {t.arrangements[id]}
                  </option>
                ))}
              </select>
            </label>
            {seeded && (
              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span>{t.seed}</span>
                  <input
                    type="number"
                    min={0}
                    max={MAX_SEED}
                    value={state.seed}
                    onChange={(e) => update({ seed: Math.min(MAX_SEED, Math.max(0, Math.floor(Number(e.target.value)) || 0)) })}
                  />
                </label>
                <button type="button" className={styles.tab} onClick={() => update({ seed: Math.floor(Math.random() * (MAX_SEED + 1)) })}>
                  {t.shuffle}
                </button>
              </div>
            )}
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
