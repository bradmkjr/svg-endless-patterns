"use client";

import { useEffect, useState } from "react";
import { generateSashiko, generateSashikoPdf, type Locale, type SashikoRequest, type SashikoResult } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { fill, messages } from "@/lib/i18n";
import copy from "@/i18n/messages/sashiko.json";
import { COLOR_PRESETS, MOTIF_OPTIONS, PANEL_OPTIONS, serializeSashikoState, SPACING_OPTIONS, STITCH_OPTIONS } from "@/lib/sashikoState";
import { OptionNav, useOptionNavigation } from "./OptionNav";
import { PalettePicker } from "./PalettePicker";
import { syncShareLink } from "@/lib/toolOptions";
import styles from "./BlockBuilder.module.css";

function NumberSelect({ label, value, options, onChange }: { label: string; value: number; options: { value: number; label: string }[]; onChange: (value: number) => void }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const inchOptions = (values: number[]) => values.map((value) => ({ value, label: `${value}"` }));

export function SashikoBuilder({ locale, option, labels, initialState, initialResult }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: SashikoRequest; initialResult: SashikoResult }) {
  const t = copy[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("sashiko", locale);
  const [state, setState] = useState(initialState);
  const [result, setResult] = useState(initialResult);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<SashikoRequest>) => setState((s) => ({ ...s, ...patch }));

  useEffect(() => {
    let stale = false;
    generateSashiko(state).then(
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
    const query = serializeSashikoState(state);
    syncShareLink(query, "sashiko", option);
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

  const panel = result.svg.panel;
  const fileName = `sashiko-${state.motif}`;

  return (
    <div className={styles.builder}>
      <OptionNav tool="sashiko" locale={locale} current={option} labels={labels} />
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          <div className={`${styles.art} ${styles.quiltArt}`} role="img" aria-label={t.panelAlt} dangerouslySetInnerHTML={{ __html: panel }} />
          <p className={styles.note}>{fill(t.previewNote, { w: result.width, h: result.height })}</p>
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateSashikoPdf(state), `${fileName}-guide.pdf`, "application/pdf"))}>
              {t.downloadGuide}
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(panel, `${fileName}.svg`))}>
              SVG
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(panel, `${fileName}.png`))}>
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
            <legend>{t.motif}</legend>
            <div className={styles.presets}>
              {MOTIF_OPTIONS.map((motif) => (
                <button key={motif} type="button" className={state.motif === motif ? styles.tabOn : styles.tab} aria-pressed={state.motif === motif} onClick={() => goToOption(motif)}>
                  {t.motifs[motif]}
                </button>
              ))}
            </div>
            <NumberSelect label={t.spacing} value={state.spacing} options={inchOptions(SPACING_OPTIONS)} onChange={(spacing) => update({ spacing })} />
            <p className={styles.note}>{t.spacingHelp[state.motif]}</p>
            <NumberSelect label={t.stitchLength} value={state.stitch} options={STITCH_OPTIONS} onChange={(stitch) => update({ stitch })} />
          </fieldset>

          <fieldset>
            <legend>{t.panel}</legend>
            <div className={styles.fieldRow}>
              <NumberSelect label={t.width} value={state.width} options={inchOptions(PANEL_OPTIONS)} onChange={(width) => update({ width })} />
              <NumberSelect label={t.height} value={state.height} options={inchOptions(PANEL_OPTIONS)} onChange={(height) => update({ height })} />
            </div>
          </fieldset>

          <fieldset>
            <legend>{t.colors}</legend>
            <div className={styles.presets}>
              {COLOR_PRESETS.map((preset) => (
                <button key={preset.id} type="button" className={styles.tab} onClick={() => update({ cloth: preset.cloth, thread: preset.thread })}>
                  {t.presets[preset.id]}
                </button>
              ))}
            </div>
            <div className={styles.colors} style={{ marginTop: "0.6rem" }}>
              <label className={styles.color}>
                <input type="color" value={state.cloth} onChange={(e) => update({ cloth: e.target.value })} />
                {t.cloth}
              </label>
              <label className={styles.color}>
                <input type="color" value={state.thread} onChange={(e) => update({ thread: e.target.value })} />
                {t.thread}
              </label>
            </div>
            <PalettePicker locale={locale} current={[state.thread, state.cloth]} onApply={(c) => update({ cloth: c[1], thread: c[0] })} />
          </fieldset>
        </form>
      </div>

      {result.tight ? <p className={styles.notice}>{t.tight}</p> : null}

      <p className={styles.notice}>
        <strong>{t.craftTitle}</strong> {t.craftText}
      </p>

      <div className={styles.results}>
        <section>
          <h2>{t.guide}</h2>
          <ol className={styles.steps}>
            {result.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section>
          <h2>{t.numbers}</h2>
          <ul className={styles.written}>
            <li>{fill(t.stitchGap, { stitch: result.stitch, gap: result.gap })}</li>
            <li>{fill(t.stitches, { n: result.stitches })}</li>
            <li>{fill(t.yards, { y: result.threadYards })}</li>
            <li>{fill(t.sheets, { n: result.sheets })}</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
