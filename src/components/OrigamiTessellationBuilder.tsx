"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ColorInput } from "./ColorInput";
import { generateOrigamiTessellation, generateOrigamiTessellationPdf, type CreaseColors, type Locale, type OrigamiTessellationRequest } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { useTrackCustomize } from "@/lib/analytics";
import { fill, localePath, messages } from "@/lib/i18n";
import copy from "@/i18n/messages/origamiTessellation.json";
import { angleOptions, GRID_MAX, GRID_MIN, PATTERN_OPTIONS, serializeOrigamiTessellationState, WIDTH_OPTIONS } from "@/lib/origamiTessellationState";
import { ToolLoading } from "./ToolLoading";
import { useLiveResult } from "@/lib/useLiveResult";
import { OptionNav, useOptionNavigation } from "./OptionNav";
import { PalettePicker } from "./PalettePicker";
import { syncShareLink } from "@/lib/toolOptions";
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

const GRID_OPTIONS = Array.from({ length: GRID_MAX - GRID_MIN + 1 }, (_, i) => GRID_MIN + i);
const COLOR_KEYS: (keyof CreaseColors)[] = ["paper", "mountain", "valley"];

export function OrigamiTessellationBuilder({ locale, option, labels, initialState }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: OrigamiTessellationRequest }) {
  const t = copy[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("origamiTessellation", locale);
  const [state, setState] = useState(initialState);
  useTrackCustomize("origamiTessellation", state);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<OrigamiTessellationRequest>) => setState((s) => ({ ...s, ...patch }));
  const result = useLiveResult(generateOrigamiTessellation, state, setStatus, b.updateError);

  useEffect(() => {
    syncShareLink(serializeOrigamiTessellationState(state), "origamiTessellation", option);
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

  const pattern = result?.svg.pattern ?? "";
  const fileName = `origami-${state.pattern}`;
  const colorLabel = { paper: t.paper, mountain: t.mountain, valley: t.valley };

  return (
    <div className={styles.builder}>
      <OptionNav tool="origamiTessellation" locale={locale} current={option} labels={labels} />
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          {result ? (
            <>
              <div className={styles.art} role="img" aria-label={t.previewAlt} dangerouslySetInnerHTML={{ __html: pattern }} />
              <p className={styles.note}>{fill(t.previewNote, { w: result.width, h: result.height, m: result.mountains, v: result.valleys })}</p>
            </>
          ) : (
            <ToolLoading locale={locale} />
          )}
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateOrigamiTessellationPdf(state), `${fileName}.pdf`, "application/pdf"))}>
              {t.downloadPdf}
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(pattern, `${fileName}.svg`))}>
              SVG
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(pattern, `${fileName}.png`))}>
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
            <div className={styles.presets}>
              {PATTERN_OPTIONS.map((id) => (
                <button key={id} type="button" className={state.pattern === id ? styles.tabOn : styles.tab} aria-pressed={state.pattern === id} onClick={() => goToOption(id)}>
                  {t.patterns[id]}
                </button>
              ))}
            </div>
            <p className={styles.note}>{t.patternNotes[state.pattern]}</p>
            <Select label={t.angle} value={state.angle} options={angleOptions(state.pattern)} format={(n) => `${n}°`} onChange={(angle) => update({ angle })} />
            <p className={styles.note}>{t.angleHelp[state.pattern]}</p>
          </fieldset>

          <fieldset>
            <legend>{t.grid}</legend>
            <div className={styles.fieldRow}>
              <Select label={t.cols} value={state.cols} options={GRID_OPTIONS} format={String} onChange={(cols) => update({ cols })} />
              <Select label={t.rows} value={state.rows} options={GRID_OPTIONS} format={String} onChange={(rows) => update({ rows })} />
            </div>
            <Select label={t.width} value={state.width} options={WIDTH_OPTIONS} format={(n) => `${n}"`} onChange={(width) => update({ width })} />
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
            <PalettePicker locale={locale} current={[state.colors.paper, state.colors.mountain, state.colors.valley]} onApply={(c) => update({ colors: { paper: c[0], mountain: c[1], valley: c[2] ?? c[1] } })} />
          </fieldset>
        </form>
      </div>

      {result ? (
        <div className={styles.results}>
          <section className={styles.steps}>
            <h2>{t.howTitle}</h2>
            <p className={styles.note}>{t.legend}</p>
            <ol>
              {result.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
        </div>
      ) : null}

      <p className={`${styles.note} no-print`} style={{ marginTop: "1.5rem" }}>
        <Link href={localePath(locale, "/origami/")}>{t.modelsLink}</Link>
      </p>
    </div>
  );
}
