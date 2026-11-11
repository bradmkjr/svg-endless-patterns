"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ColorInput } from "./ColorInput";
import { generateOrigami, generateOrigamiPdf, type Locale, type OrigamiColors, type OrigamiRequest } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { useTrackCustomize } from "@/lib/analytics";
import { fill, localePath, messages } from "@/lib/i18n";
import copy from "@/i18n/messages/origami.json";
import { COLOR_PRESETS, GUIDE_OPTIONS, MODEL_OPTIONS, PAPER_OPTIONS, PRINT_OPTIONS, serializeOrigamiState } from "@/lib/origamiState";
import { ToolLoading } from "./ToolLoading";
import { useLiveResult } from "@/lib/useLiveResult";
import { OptionNav, useOptionNavigation } from "./OptionNav";
import { PalettePicker } from "./PalettePicker";
import { syncShareLink } from "@/lib/toolOptions";
import styles from "./BlockBuilder.module.css";
import own from "./Origami.module.css";

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

const COLOR_KEYS: (keyof OrigamiColors)[] = ["front", "back", "accent"];

export function OrigamiBuilder({ locale, option, labels, initialState }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: OrigamiRequest }) {
  const t = copy[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("origami", locale);
  const [state, setState] = useState(initialState);
  useTrackCustomize("origami", state);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<OrigamiRequest>) => setState((s) => ({ ...s, ...patch }));
  const result = useLiveResult(generateOrigami, state, setStatus, b.updateError);

  useEffect(() => {
    syncShareLink(serializeOrigamiState(state), "origami", option);
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

  const name = t.models[state.model];
  const finished = result?.svg.steps.at(-1) ?? "";
  const sheet = result?.svg.sheet ?? "";
  const fileName = `origami-${state.model}`;
  const colorLabel = { front: t.front, back: t.back, accent: t.accent };

  return (
    <div className={styles.builder}>
      <OptionNav tool="origami" locale={locale} current={option} labels={labels} />
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          {result ? (
            <>
              <div className={own.finished} role="img" aria-label={fill(t.finishedAlt, { model: name })} dangerouslySetInnerHTML={{ __html: finished }} />
              <p className={styles.note}>{fill(t.facts, { difficulty: result.difficultyLabel, steps: result.steps.length - 1, paper: result.paper })}</p>
            </>
          ) : (
            <ToolLoading locale={locale} />
          )}
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateOrigamiPdf(state), `${fileName}.pdf`, "application/pdf"))}>
              {t.downloadPdf}
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(sheet, `${fileName}-paper.svg`))}>
              {t.sheetSvg}
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(sheet, `${fileName}-paper.png`))}>
              {t.sheetPng}
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
            <legend>{t.model}</legend>
            <div className={styles.presets}>
              {MODEL_OPTIONS.map((model) => (
                <button key={model} type="button" className={state.model === model ? styles.tabOn : styles.tab} aria-pressed={state.model === model} onClick={() => goToOption(model)}>
                  {t.models[model]}
                </button>
              ))}
            </div>
            <p className={styles.note}>{t.modelNotes[state.model]}</p>
          </fieldset>

          <fieldset>
            <legend>{t.paper}</legend>
            <Select label={t.print} value={state.print} options={PRINT_OPTIONS} format={(id) => t.prints[id]} onChange={(print) => update({ print })} />
            <div className={styles.fieldRow}>
              <Select label={t.paperSize} value={state.paperSize} options={PAPER_OPTIONS} format={(n) => `${n}"`} onChange={(paperSize) => update({ paperSize })} />
              <Select label={t.guide} value={state.guide} options={GUIDE_OPTIONS} format={(id) => t.guides[id]} onChange={(guide) => update({ guide })} />
            </div>
            {state.guide === "back" ? <p className={styles.note}>{t.guideNote}</p> : null}
          </fieldset>

          <fieldset>
            <legend>{t.colors}</legend>
            <div className={styles.presets}>
              {COLOR_PRESETS.map(({ id, ...colors }) => (
                <button key={id} type="button" className={styles.tab} onClick={() => update({ colors })}>
                  {t.presets[id]}
                </button>
              ))}
            </div>
            <div className={styles.fieldRow} style={{ marginTop: "0.6rem" }}>
              {COLOR_KEYS.map((key) => (
                <label key={key} className={styles.field}>
                  <span>{colorLabel[key]}</span>
                  <ColorInput value={state.colors[key]} onChange={(picked) => update({ colors: { ...state.colors, [key]: picked } })} />
                </label>
              ))}
            </div>
            {/* A palette's ground is the plain side, its main color the patterned side. */}
            <PalettePicker locale={locale} current={[state.colors.back, state.colors.front, state.colors.accent]} onApply={(c) => update({ colors: { back: c[0], front: c[1], accent: c[2] ?? c[0] } })} />
          </fieldset>
        </form>
      </div>

      <p className={styles.notice}>
        <strong>{t.tipTitle}</strong> {t.tip}
      </p>

      {result ? (
        <>
          <section className={own.section}>
            <h2>{t.diagramsTitle}</h2>
            <p className={styles.note}>{t.symbols}</p>
            <ol className={own.diagrams}>
              {result.svg.steps.map((svg, i) => (
                <li key={i} className={own.diagram}>
                  <figure>
                    <div role="img" aria-label={fill(t.stepAlt, { n: i + 1 })} dangerouslySetInnerHTML={{ __html: svg }} />
                    <figcaption>{result.steps[i]}</figcaption>
                  </figure>
                </li>
              ))}
            </ol>
          </section>

          <section className={own.section}>
            <h2>{t.sheetTitle}</h2>
            <p className={styles.note}>{result.paper}</p>
            <div className={own.sheets}>
              <figure className={own.sheet}>
                <div role="img" aria-label={t.sheetAlt} dangerouslySetInnerHTML={{ __html: sheet }} />
                <figcaption>{t.sheetFront}</figcaption>
              </figure>
              {state.guide === "back" ? (
                <figure className={own.sheet}>
                  <div role="img" aria-label={t.backAlt} dangerouslySetInnerHTML={{ __html: result.svg.back }} />
                  <figcaption>{t.sheetBack}</figcaption>
                </figure>
              ) : null}
            </div>
          </section>
        </>
      ) : null}

      <p className={`${styles.note} no-print`} style={{ marginTop: "1.5rem" }}>
        <Link href={localePath(locale, "/origami-tessellations/")}>{t.tessellationsLink}</Link>
      </p>
    </div>
  );
}
