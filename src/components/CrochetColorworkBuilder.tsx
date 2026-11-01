"use client";

import { useEffect, useState } from "react";
import copy from "@/i18n/messages/crochetColorwork.json";
import { COLORWORK_DESIGNS, COLORWORK_REPEAT_OPTIONS, COLORWORK_WEIGHT_OPTIONS, serializeCrochetColorworkState } from "@/lib/crochetColorworkState";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { generateCrochetColorwork, generateCrochetColorworkPdf, type CrochetColorworkRequest, type CrochetColorworkResult, type Locale } from "@/lib/generator";
import { fill, messages } from "@/lib/i18n";
import { paletteAccents } from "@/lib/palettes";
import { syncShareLink } from "@/lib/toolOptions";
import { OptionNav, useOptionNavigation } from "./OptionNav";
import { PalettePicker } from "./PalettePicker";
import { ToolLoading } from "./ToolLoading";
import styles from "./BlockBuilder.module.css";

type View = keyof CrochetColorworkResult["svg"];
const VIEWS: View[] = ["square", "chart"];
const LETTERS = "ABCD";

export function CrochetColorworkBuilder({ locale, option, labels, initialState }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: CrochetColorworkRequest }) {
  const t = copy[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("crochetColorwork", locale);
  const [state, setState] = useState(initialState);
  const [generated, setGenerated] = useState<{ key: string; result: CrochetColorworkResult } | null>(null);
  const [view, setView] = useState<View>("square");
  const [status, setStatus] = useState(t.loading);
  const [busy, setBusy] = useState(false);
  const contrast = state.contrast ?? [];

  const update = (patch: Partial<CrochetColorworkRequest>) => setState((s) => ({ ...s, ...patch }));

  const requestKey = JSON.stringify(state);
  const result = generated?.key === requestKey ? generated.result : undefined;

  useEffect(() => {
    let stale = false;
    generateCrochetColorwork(state).then(
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
    syncShareLink(serializeCrochetColorworkState(state), "crochetColorwork", option);
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
  const file = `crochet-${state.design}`;

  return (
    <div className={styles.builder}>
      <OptionNav tool="crochetColorwork" locale={locale} current={option} labels={labels} />
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          <div className={`${styles.tabs} no-print`}>
            {VIEWS.map((name) => (
              <button key={name} type="button" className={view === name ? styles.tabOn : styles.tab} aria-pressed={view === name} onClick={() => setView(name)}>
                {t.views[name]}
              </button>
            ))}
          </div>
          {result ? <div className={`art ${styles.art}`} role="img" aria-label={t.views[view]} dangerouslySetInnerHTML={{ __html: svg }} /> : <ToolLoading locale={locale} />}
          <p className={styles.note}>{view === "chart" ? (result?.chartHelp ?? "") : t.squareNote}</p>
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy || !result} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateCrochetColorworkPdf(state), `${file}.pdf`, "application/pdf"))}>
              {t.downloadPdf}
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(svg, `${file}-${view}.svg`))}>
              SVG
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(svg, `${file}-${view}.png`))}>
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
              <span>{t.design}</span>
              <select value={state.design} onChange={(e) => goToOption(e.target.value)}>
                {COLORWORK_DESIGNS.map(({ id, technique }) => (
                  <option key={id} value={id}>
                    {t.techniques[technique]}: {labels[id]}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>{t.weight}</span>
              <select value={state.weight} onChange={(e) => update({ weight: e.target.value as CrochetColorworkRequest["weight"] })}>
                {COLORWORK_WEIGHT_OPTIONS.map((weight) => (
                  <option key={weight} value={weight}>
                    {t.weights[weight]}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>{result?.technique === "granny" ? t.repeatsGranny : t.repeatsChart}</span>
              <select value={state.repeats} onChange={(e) => update({ repeats: Number(e.target.value) })}>
                {COLORWORK_REPEAT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>

          <fieldset>
            <legend>{t.colors}</legend>
            <div className={styles.colors}>
              <label className={styles.color}>
                <input type="color" value={state.color} onChange={(e) => update({ color: e.target.value })} />
                {fill(t.mainColor, { letter: "A" })}
              </label>
              {contrast.map((color, i) => (
                <label key={i} className={styles.color}>
                  <input type="color" value={color} onChange={(e) => update({ contrast: contrast.map((c, n) => (n === i ? e.target.value : c)) })} />
                  {fill(t.contrastColor, { letter: LETTERS[i + 1] })}
                </label>
              ))}
            </div>
            <PalettePicker locale={locale} current={[state.color, ...contrast]} onApply={(c) => update({ color: c[0], contrast: paletteAccents(c, contrast.length) })} />
          </fieldset>
        </form>
      </div>

      {result && (
      <div className={styles.results}>
        <section>
          <h2>{t.yarnHeading}</h2>
          <table className={styles.yardage}>
            <thead>
              <tr>
                <th scope="col">{t.colorColumn}</th>
                <th scope="col">{t.yardsColumn}</th>
                {result.technique === "c2c" && <th scope="col">{t.bobbinsColumn}</th>}
              </tr>
            </thead>
            <tbody>
              {result.colors.map((c) => (
                <tr key={c.letter}>
                  <th scope="row">
                    <span className={styles.swatch} style={{ background: c.color }} aria-hidden />
                    {c.letter}
                  </th>
                  <td>{c.yards}</td>
                  {result.technique === "c2c" && <td>{c.bobbins}</td>}
                </tr>
              ))}
              <tr>
                <th scope="row">{t.totalRow}</th>
                <td>{result.totalYards}</td>
                {result.technique === "c2c" && <td>{result.colors.reduce((sum, c) => sum + (c.bobbins ?? 0), 0)}</td>}
              </tr>
            </tbody>
          </table>
        </section>
        {[result.materials, ...result.sections].map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            <ul className={styles.written}>
              {section.lines.map((line, i) => (
                <li key={i}>
                  {line.label && <strong>{line.label}: </strong>}
                  {line.text}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      )}
    </div>
  );
}
