"use client";

import { useCallback, useEffect, useState } from "react";
import { generateStitchPattern, generateStitchPdf, type Locale, type StitchInfo, type StitchRequest } from "@/lib/generator";
import { fill, messages } from "@/lib/i18n";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { LENGTH_OPTIONS, PROJECTS, ROW_GAUGE_OPTIONS, serializeStitchState, SQUARE_SIZES, startingGauge, STITCH_GAUGE_OPTIONS, WIDTH_OPTIONS, YARN_WEIGHTS } from "@/lib/stitchState";
import { PalettePicker } from "./PalettePicker";
import { DEFAULT_KNIT_SQUARE, KNIT_SQUARE_SIZES } from "@/lib/generator";
import { KnitSquarePattern, squareCopy } from "./KnitSquarePattern";
import { useLiveResult } from "@/lib/useLiveResult";
import { ToolLoading } from "./ToolLoading";
import styles from "./BlockBuilder.module.css";

type View = "swatch" | "chart";

function NumberSelect({ label, value, options, unit = "", onChange }: { label: string; value: number; options: number[]; unit?: string; onChange: (value: number) => void }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {options.map((option) => (
          <option key={option} value={option}>{`${option}${unit}`}</option>
        ))}
      </select>
    </label>
  );
}

export function StitchBuilder({ stitch, locale, initialState }: { stitch: StitchInfo; locale: Locale; initialState: StitchRequest }) {
  const all = messages(locale);
  const t = all.stitchBuilder;
  const b = all.builder;
  const [state, setState] = useState(initialState);
  const [view, setView] = useState<View>("swatch");
  const [weightId, setWeightId] = useState("worsted");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<StitchRequest>) => setState((s) => ({ ...s, ...patch }));
  const weight = YARN_WEIGHTS.find((w) => w.id === weightId) ?? YARN_WEIGHTS[2];

  const generate = useCallback((request: StitchRequest) => generateStitchPattern(stitch.slug, request), [stitch.slug]);
  const result = useLiveResult(generate, state, setStatus, t.updateError);

  useEffect(() => {
    const query = serializeStitchState(stitch, state);
    window.history.replaceState(window.history.state, "", query ? `?${query}` : window.location.pathname);
  }, [stitch, state]);

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

  const currentSvg = result?.svg[view] ?? "";
  const fileBase = `${stitch.slug}-${view}`;
  const swatchUrl = `data:image/svg+xml,${encodeURIComponent(result?.svg.swatch ?? "")}`;
  const swatchWidth = Number(/viewBox="0 0 ([\d.]+) /.exec(result?.svg.swatch ?? "")?.[1] ?? 4);
  const tool = stitch.craft === "knit" ? fill(t.needles, { tool: weight.needle }) : fill(t.hook, { tool: weight.hook });

  return (
    <div className={styles.builder}>
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          <div className={`${styles.tabs} no-print`} role="group" aria-label={b.previewType}>
            <button type="button" aria-pressed={view === "swatch"} className={view === "swatch" ? styles.tabOn : styles.tab} onClick={() => setView("swatch")}>
              {t.swatch}
            </button>
            <button type="button" aria-pressed={view === "chart"} className={view === "chart" ? styles.tabOn : styles.tab} onClick={() => setView("chart")}>
              {t.chart}
            </button>
          </div>
          {!result ? (
            <ToolLoading locale={locale} />
          ) : view === "swatch" ? (
            <div
              className={styles.tile}
              style={{ backgroundImage: `url("${swatchUrl}")`, backgroundSize: `${(swatchWidth / 4) * 100}% auto` }}
              role="img"
              aria-label={fill(t.swatchAlt, { name: stitch.name })}
            />
          ) : (
            <div className={styles.chart} dangerouslySetInnerHTML={{ __html: currentSvg }} />
          )}
          <p className={styles.note}>
            {view === "swatch" ? t.swatchNote : stitch.craft === "knit" ? t.chartKnit : t.chartCrochet}
          </p>
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateStitchPdf(stitch.slug, state), `${stitch.slug}-pattern.pdf`, "application/pdf"))}>
              {b.downloadPdf}
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(currentSvg, `${fileBase}.svg`))}>
              SVG
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(currentSvg, `${fileBase}.png`))}>
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
          {stitch.craft === "knit" && (
            <fieldset>
              <legend>{squareCopy(locale).size}</legend>
              <NumberSelect label={squareCopy(locale).sizeLabel} value={state.squareSize ?? DEFAULT_KNIT_SQUARE} options={KNIT_SQUARE_SIZES} unit={'"'} onChange={(squareSize) => update({ squareSize })} />
            </fieldset>
          )}

          <fieldset>
            <legend>{t.projectSize}</legend>
            <div className={styles.presets}>
              {PROJECTS.map((project) => (
                <button key={project.label} type="button" className={styles.tab} onClick={() => update({ width: project.width, length: project.length })}>
                  {all.projects[project.label]}
                </button>
              ))}
            </div>
            {stitch.craft === "crochet" && (
              <div className={styles.presets}>
                {SQUARE_SIZES.map((size) => (
                  <button key={size} type="button" className={styles.tab} aria-pressed={state.width === size && state.length === size} onClick={() => update({ width: size, length: size })}>
                    {fill(t.squarePreset, { n: size })}
                  </button>
                ))}
              </div>
            )}
            <div className={styles.fieldRow}>
              <NumberSelect label={t.width} value={state.width} options={WIDTH_OPTIONS} unit={'"'} onChange={(width) => update({ width })} />
              <NumberSelect label={t.length} value={state.length} options={LENGTH_OPTIONS} unit={'"'} onChange={(length) => update({ length })} />
            </div>
          </fieldset>

          <fieldset>
            <legend>{t.yarnGauge}</legend>
            <label className={styles.field}>
              <span>{t.yarnWeight}</span>
              <select
                value={weightId}
                onChange={(e) => {
                  const next = YARN_WEIGHTS.find((w) => w.id === e.target.value) ?? YARN_WEIGHTS[2];
                  setWeightId(next.id);
                  update(startingGauge(stitch, next));
                }}
              >
                {YARN_WEIGHTS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {all.weights[w.label]}
                  </option>
                ))}
              </select>
            </label>
            <p className={styles.note}>{tool}. {t.toolNote}</p>
            <div className={styles.fieldRow}>
              <NumberSelect label={t.stitchesPer} value={state.stitchGauge} options={STITCH_GAUGE_OPTIONS} onChange={(stitchGauge) => update({ stitchGauge })} />
              <NumberSelect label={t.rowsPer} value={state.rowGauge} options={ROW_GAUGE_OPTIONS} onChange={(rowGauge) => update({ rowGauge })} />
            </div>
            <label className={styles.color} style={{ marginTop: "0.8rem" }}>
              <input type="color" value={state.color} onChange={(e) => update({ color: e.target.value })} />
              {t.yarnColor}
            </label>
            <PalettePicker locale={locale} current={[state.color]} onApply={(c) => update({ color: c[1] })} />
          </fieldset>
        </form>
      </div>

      <p className={styles.notice}>
        <strong>{t.swatchFirstTitle}</strong> {t.swatchFirstText}
      </p>

      {result && (
      <>
      {result.square && <KnitSquarePattern square={result.square} locale={locale} />}

      <div className={styles.results}>
        <section>
          {result.crochet ? (
            <>
              <h2>{result.crochet.materialsHeading}</h2>
              <ul className={styles.written}>
                {result.crochet.materials.map((item) => (
                  <li key={item.label}>
                    <strong>{item.label}:</strong> {item.text}
                  </li>
                ))}
              </ul>
              {result.crochet.sections.map((section) => (
                <div key={section.heading}>
                  <h2>{section.heading}</h2>
                  <ul className={styles.written}>
                    {section.lines.map((line, i) => (
                      <li key={i}>
                        {line.label && <strong>{line.label}: </strong>}
                        {line.text}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </>
          ) : (
            <>
          <h2>{t.instructions}</h2>
          {result.square && <p className={styles.note}>{squareCopy(locale).rectangleNote}</p>}
          <ul className={styles.written}>
            {result.setup.map((line) => (
              <li key={line}>{line}</li>
            ))}
            {result.pattern.map((row) => (
              <li key={row.label}>
                <strong>{row.label}:</strong> {row.text}
              </li>
            ))}
            <li>{result.repeatNote}</li>
            {result.finish.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className={styles.note}>{result.abbreviations.join(" · ")}</p>
            </>
          )}
        </section>

        <section>
          <h2>{t.yourProject}</h2>
          <table className={styles.yardage}>
            <tbody>
              <tr>
                <th scope="row">{result.startLabel}</th>
                <td>{result.startCount}</td>
              </tr>
              <tr>
                <th scope="row">{t.stitchesPerRow}</th>
                <td>{result.stitchesPerRow}</td>
              </tr>
              <tr>
                <th scope="row">{t.rows}</th>
                <td>{result.rows}</td>
              </tr>
              <tr>
                <th scope="row">{t.finishedSize}</th>
                <td>
                  {result.width}&quot; x {result.length}&quot;
                </td>
              </tr>
              <tr>
                <th scope="row">{t.yarnEstimate}</th>
                <td>{fill(t.about, { y: result.yards })}</td>
              </tr>
            </tbody>
          </table>
          <p className={styles.note}>{t.roundNote}</p>
        </section>
      </div>
      </>
      )}
    </div>
  );
}
