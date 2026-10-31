"use client";

import { useEffect, useState } from "react";
import copy from "@/i18n/messages/knitColorwork.json";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { generateKnitColorwork, generateKnitColorworkPdf, type KnitColorworkRequest, type KnitColorworkResult, type Locale } from "@/lib/generator";
import { fill, messages } from "@/lib/i18n";
import { KNIT_COLORWORK_SIZES, DESIGN_IDS, ROW_GAUGE_OPTIONS, serializeKnitColorworkState, STITCH_GAUGE_OPTIONS } from "@/lib/knitColorworkState";
import { paletteAccents } from "@/lib/palettes";
import { syncShareLink } from "@/lib/toolOptions";
import { OptionNav, useOptionNavigation } from "./OptionNav";
import { PalettePicker } from "./PalettePicker";
import styles from "./BlockBuilder.module.css";

function NumberSelect({ label, value, options, onChange }: { label: string; value: number; options: number[]; onChange: (value: number) => void }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

type View = keyof KnitColorworkResult["svg"];
const VIEWS: View[] = ["square", "chart"];

export function KnitColorworkBuilder({ locale, option, labels, initialState }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: KnitColorworkRequest }) {
  const t = copy[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("knitColorwork", locale);
  const [state, setState] = useState(initialState);
  const [generated, setGenerated] = useState<{ key: string; result: KnitColorworkResult } | null>(null);
  const [view, setView] = useState<View>("square");
  const [status, setStatus] = useState(t.loading);
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<KnitColorworkRequest>) => setState((s) => ({ ...s, ...patch }));
  const contrast = state.contrast ?? [];

  const requestKey = JSON.stringify(state);
  const result = generated?.key === requestKey ? generated.result : undefined;

  useEffect(() => {
    let stale = false;
    generateKnitColorwork(state).then(
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
    syncShareLink(serializeKnitColorworkState(state), "knitColorwork", option);
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
  const fileName = `knit-colorwork-${state.design}`;

  return (
    <div className={styles.builder}>
      <OptionNav tool="knitColorwork" locale={locale} current={option} labels={labels} />
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          <div className={`${styles.tabs} no-print`}>
            {VIEWS.map((name) => (
              <button key={name} type="button" className={view === name ? styles.tabOn : styles.tab} aria-pressed={view === name} onClick={() => setView(name)}>
                {t.views[name]}
              </button>
            ))}
          </div>
          {result ? <div className={`art ${styles.art}`} role="img" aria-label={t.views[view]} dangerouslySetInnerHTML={{ __html: svg }} /> : <div className={`art ${styles.art}`} style={{ aspectRatio: "1" }} aria-busy="true" />}
          <p className={styles.note}>{t.viewNotes[view]}</p>
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy || !result} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateKnitColorworkPdf(state), `${fileName}.pdf`, "application/pdf"))}>
              {t.downloadPdf}
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(svg, `${fileName}-${view}.svg`))}>
              SVG
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(svg, `${fileName}-${view}.png`))}>
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
              <span>{t.pattern}</span>
              <select value={state.design} onChange={(e) => goToOption(e.target.value)}>
                {DESIGN_IDS.map((id) => (
                  <option key={id} value={id}>
                    {labels[id]}
                  </option>
                ))}
              </select>
            </label>
            <p className={styles.note}>{result ? t.techniques[result.technique] : ""}</p>
            <NumberSelect label={t.size} value={state.squareSize} options={KNIT_COLORWORK_SIZES} onChange={(squareSize) => update({ squareSize })} />
          </fieldset>

          <fieldset>
            <legend>{t.gauge}</legend>
            <div className={styles.fieldRow}>
              <NumberSelect label={t.stitchGauge} value={state.stitchGauge} options={STITCH_GAUGE_OPTIONS} onChange={(stitchGauge) => update({ stitchGauge })} />
              <NumberSelect label={t.rowGauge} value={state.rowGauge} options={ROW_GAUGE_OPTIONS} onChange={(rowGauge) => update({ rowGauge })} />
            </div>
            <p className={styles.note}>{t.gaugeNote}</p>
          </fieldset>

          <fieldset>
            <legend>{t.colors}</legend>
            <div className={styles.colors}>
              <label className={styles.color}>
                <input type="color" value={state.color} onChange={(e) => update({ color: e.target.value })} />
                {fill(t.yarn, { letter: "A" })}
              </label>
              {contrast.map((color, i) => (
                <label key={i} className={styles.color}>
                  <input type="color" value={color} onChange={(e) => update({ contrast: contrast.map((c, n) => (n === i ? e.target.value : c)) })} />
                  {fill(t.yarn, { letter: String.fromCharCode(66 + i) })}
                </label>
              ))}
            </div>
            <PalettePicker locale={locale} current={[state.color, ...contrast]} onApply={(c) => update({ color: c[0], contrast: paletteAccents(c, contrast.length) })} />
          </fieldset>
        </form>
      </div>

      {result && result.flags.length > 0 && (
        <p className={styles.notice} role="alert">
          <strong>{t.flagTitle}</strong> {fill(t.flagText, { rows: result.flags.map((flag) => flag.row).join(", "), limit: result.floatLimit })}
        </p>
      )}

      {result && (
      <div className={styles.results}>
        <section>
          <h2>{t.yarnHeading}</h2>
          <table className={styles.yardage}>
            <thead>
              <tr>
                <th scope="col">{t.yarnColumn}</th>
                <th scope="col">{t.yardsColumn}</th>
                {result.technique === "intarsia" && <th scope="col">{t.bobbinsColumn}</th>}
              </tr>
            </thead>
            <tbody>
              {result.yarn.map((row) => (
                <tr key={row.letter}>
                  <th scope="row">
                    <span className={styles.swatch} style={{ background: row.color }} aria-hidden />
                    {row.letter}
                  </th>
                  <td>{row.yards}</td>
                  {result.technique === "intarsia" && <td>{row.bobbins}</td>}
                </tr>
              ))}
              <tr>
                <th scope="row">{t.total}</th>
                <td>{result.totalYards}</td>
                {result.technique === "intarsia" && <td />}
              </tr>
            </tbody>
          </table>
        </section>
        <section className={styles.knitSquare}>
          <h2>{result.title}</h2>
          <p className={styles.note}>{t.patternLede}</p>
          {result.sections.map((section) => (
            <div key={section.heading}>
              <h3>{section.heading}</h3>
              <ul className={styles.written}>
                {section.items.map((item, i) => (
                  <li key={i}>
                    {item.label && <strong>{item.label}: </strong>}
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </div>
      )}
    </div>
  );
}
