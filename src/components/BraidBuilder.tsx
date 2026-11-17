"use client";

import { ColorInput } from "./ColorInput";
import { useEffect, useState } from "react";
import { generateBraid, generateBraidPdf, type Locale } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { useTrackCustomize } from "@/lib/analytics";
import { fill, messages } from "@/lib/i18n";
import copy from "@/i18n/messages/braid.json";
import { braidRequest, FAMILY_OPTIONS, normalizeBraid, PATTERN_OPTIONS, PATTERNS, REPEAT_OPTIONS, serializeBraidState, strandOptions, VIEW_OPTIONS, type BraidState } from "@/lib/braidState";
import { ToolLoading } from "./ToolLoading";
import { useLiveResult } from "@/lib/useLiveResult";
import { OptionNav, useOptionNavigation } from "./OptionNav";
import { PalettePicker } from "./PalettePicker";
import { slugFor, syncShareLink } from "@/lib/toolOptions";
import styles from "./BlockBuilder.module.css";

function Select<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select value={String(value)} onChange={(e) => onChange(options.find((o) => String(o.value) === e.target.value)!.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const ROW = { display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.4rem", flexWrap: "wrap" } as const;

export function BraidBuilder({ locale, option, labels, initialState }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: BraidState }) {
  const t = copy[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("braid", locale);
  const [state, setState] = useState(initialState);
  useTrackCustomize("braid", state);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<BraidState>) => setState((s) => normalizeBraid({ ...s, ...patch }));
  const result = useLiveResult(generateBraid, braidRequest(state), setStatus, b.updateError);

  useEffect(() => {
    syncShareLink(serializeBraidState(state), "braid", option);
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

  const info = PATTERNS[state.pattern];
  const picture = result?.svg[state.view] ?? "";
  const fileName = `braid-${state.pattern}`;
  const twelve = state.pattern === "diamond" || state.pattern === "heart";
  const setColor = (i: number, color: string) => update({ colors: state.colors.map((c, n) => (n === i ? color : c)) });

  return (
    <div className={styles.builder}>
      <OptionNav tool="braid" locale={locale} current={option} labels={labels} />
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          {result ? <div className={styles.art} role="img" aria-label={state.view === "chart" ? t.chartAlt : t.braidAlt} dangerouslySetInnerHTML={{ __html: picture }} /> : <ToolLoading locale={locale} />}
          {result && result.family !== "falls" ? <p className={styles.note}>{fill(result.family === "knotted" ? t.repeatKnotted : t.repeatFlat, { rows: result.rows, repeat: result.repeatRows })}</p> : null}
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateBraidPdf(braidRequest(state)), `${fileName}.pdf`, "application/pdf"))}>
              {t.downloadPdf}
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(picture, `${fileName}.svg`))}>
              SVG
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(picture, `${fileName}.png`))}>
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
            {FAMILY_OPTIONS.map((family) => (
              <div key={family} style={{ marginBottom: "0.5rem" }}>
                <strong>{t.families[family]}</strong>
                <div className={styles.presets}>
                  {PATTERN_OPTIONS.filter((p) => PATTERNS[p].family === family).map((pattern) => (
                    <button key={pattern} type="button" className={state.pattern === pattern ? styles.tabOn : styles.tab} aria-pressed={state.pattern === pattern} onClick={() => goToOption(slugFor("braid", pattern)!)}>
                      {t.patterns[pattern]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <p className={styles.note}>{t.patternNotes[state.pattern]}</p>
            <div className={styles.fieldRow}>
              {info.strands.length > 1 ? <Select label={t.strands} value={state.strands} options={strandOptions(state.pattern).map((n) => ({ value: n, label: String(n) }))} onChange={(strands) => update({ strands })} /> : null}
              <Select label={t.repeats} value={state.repeats} options={REPEAT_OPTIONS.map((n) => ({ value: n, label: fill(t.repeatsValue, { n }) }))} onChange={(repeats) => update({ repeats })} />
              <Select label={t.view} value={state.view} options={VIEW_OPTIONS.map((v) => ({ value: v, label: t.views[v] }))} onChange={(view) => update({ view })} />
            </div>
          </fieldset>

          <fieldset>
            <legend>{t.colors}</legend>
            <p className={styles.note}>{twelve ? t.twelveHelp : t.colorsHelp[info.family]}</p>
            <div style={ROW}>
              {state.colors.map((color, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                  <ColorInput aria-label={fill(t.color, { n: i + 1 })} value={color} onChange={(picked) => setColor(i, picked)} />
                  {state.colors.length > 1 && !twelve && info.family !== "falls" ? (
                    <button type="button" className={styles.tab} aria-label={fill(t.removeColor, { n: i + 1 })} onClick={() => update({ colors: state.colors.filter((_, n) => n !== i) })}>
                      ×
                    </button>
                  ) : null}
                </span>
              ))}
            </div>
            {state.colors.length < info.colors ? (
              <div style={ROW}>
                <button type="button" className={styles.tab} onClick={() => update({ colors: [...state.colors, state.colors[state.colors.length % 2]] })}>
                  {t.addColor}
                </button>
              </div>
            ) : null}
            <PalettePicker locale={locale} current={state.colors} onApply={(palette) => update({ colors: state.colors.map((_, i) => palette[i % palette.length]) })} />
          </fieldset>
        </form>
      </div>

      <p className={styles.notice}>
        <strong>{t.readTitle}</strong> {info.family === "knotted" ? t.readKnotted : info.family === "flat" ? t.readFlat : t.readFalls}
      </p>

      {result ? (
        <div className={styles.results}>
          <section>
            <h2>{t.guide}</h2>
            <p className={styles.note}>{fill(t.order, { order: result.order })}</p>
            <ol className={styles.steps}>
              {result.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </section>
        </div>
      ) : null}
    </div>
  );
}
