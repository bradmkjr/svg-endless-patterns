"use client";

import { useEffect, useState } from "react";
import { generateStitchPattern, generateStitchPdf, type StitchInfo, type StitchRequest, type StitchResult } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { LENGTH_OPTIONS, PROJECTS, ROW_GAUGE_OPTIONS, serializeStitchState, startingGauge, STITCH_GAUGE_OPTIONS, WIDTH_OPTIONS, YARN_WEIGHTS } from "@/lib/stitchState";
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

export function StitchBuilder({ stitch, initialState, initialResult }: { stitch: StitchInfo; initialState: StitchRequest; initialResult: StitchResult }) {
  const [state, setState] = useState(initialState);
  const [result, setResult] = useState(initialResult);
  const [view, setView] = useState<View>("swatch");
  const [weightId, setWeightId] = useState("worsted");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<StitchRequest>) => setState((s) => ({ ...s, ...patch }));
  const weight = YARN_WEIGHTS.find((w) => w.id === weightId) ?? YARN_WEIGHTS[2];

  useEffect(() => {
    let stale = false;
    generateStitchPattern(stitch.slug, state).then(
      (next) => {
        if (!stale) setResult(next);
      },
      () => {
        if (!stale) setStatus("Couldn't update the pattern. Please try again.");
      },
    );
    return () => {
      stale = true;
    };
  }, [stitch.slug, state]);

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
      setStatus("That didn't work. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const currentSvg = result.svg[view];
  const fileBase = `${stitch.slug}-${view}`;
  const swatchUrl = `data:image/svg+xml,${encodeURIComponent(result.svg.swatch)}`;
  const swatchWidth = Number(/viewBox="0 0 ([\d.]+) /.exec(result.svg.swatch)?.[1] ?? 4);
  const tool = stitch.craft === "knit" ? `Needles: ${weight.needle}` : `Hook: ${weight.hook}`;

  return (
    <div className={styles.builder}>
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label="Preview">
          <div className={`${styles.tabs} no-print`} role="group" aria-label="Preview type">
            <button type="button" aria-pressed={view === "swatch"} className={view === "swatch" ? styles.tabOn : styles.tab} onClick={() => setView("swatch")}>
              Swatch
            </button>
            <button type="button" aria-pressed={view === "chart"} className={view === "chart" ? styles.tabOn : styles.tab} onClick={() => setView("chart")}>
              Chart
            </button>
          </div>
          {view === "swatch" ? (
            <div
              className={styles.tile}
              style={{ backgroundImage: `url("${swatchUrl}")`, backgroundSize: `${(swatchWidth / 4) * 100}% auto` }}
              role="img"
              aria-label={`Illustration of 4 inches of ${stitch.name}`}
            />
          ) : (
            <div className={styles.chart} dangerouslySetInnerHTML={{ __html: currentSvg }} />
          )}
          <p className={styles.note}>
            {view === "swatch" ? 'An illustration of the texture, showing 4" of fabric at your gauge. It isn\'t a photo of real yarn.' : stitch.craft === "knit" ? "Each square is one stitch, seen from the right side. Blank = knit, dash = purl. Start at row 1, at the bottom." : "Symbols show the first rows at a small width, in US terms. Start at row 1, at the bottom. X = sc, T = hdc, crossed T = dc, oval = ch."}
          </p>
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run("Making your PDF…", "PDF downloaded.", async () => downloadBytes(await generateStitchPdf(stitch.slug, state), `${stitch.slug}-pattern.pdf`, "application/pdf"))}>
              Download PDF pattern
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run("Saving…", "SVG downloaded.", () => downloadSvg(currentSvg, `${fileBase}.svg`))}>
              SVG
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run("Making your PNG…", "PNG downloaded.", () => downloadPng(currentSvg, `${fileBase}.png`))}>
              PNG
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run("Copying…", "Link copied.", () => navigator.clipboard.writeText(window.location.href))}>
              Copy share link
            </button>
          </div>
          <p className={styles.status} role="status">
            {status}
          </p>
        </section>

        <form className={`${styles.controls} no-print`} onSubmit={(e) => e.preventDefault()}>
          <fieldset>
            <legend>Project size</legend>
            <div className={styles.presets}>
              {PROJECTS.map((project) => (
                <button key={project.label} type="button" className={styles.tab} onClick={() => update({ width: project.width, length: project.length })}>
                  {project.label}
                </button>
              ))}
            </div>
            <div className={styles.fieldRow}>
              <NumberSelect label="Width" value={state.width} options={WIDTH_OPTIONS} unit={'"'} onChange={(width) => update({ width })} />
              <NumberSelect label="Length" value={state.length} options={LENGTH_OPTIONS} unit={'"'} onChange={(length) => update({ length })} />
            </div>
          </fieldset>

          <fieldset>
            <legend>Yarn and gauge</legend>
            <label className={styles.field}>
              <span>Yarn weight (sets a starting gauge)</span>
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
                    {w.label}
                  </option>
                ))}
              </select>
            </label>
            <p className={styles.note}>{tool}. These are typical sizes, so use whichever gets you your gauge.</p>
            <div className={styles.fieldRow}>
              <NumberSelect label={'Stitches per 4"'} value={state.stitchGauge} options={STITCH_GAUGE_OPTIONS} onChange={(stitchGauge) => update({ stitchGauge })} />
              <NumberSelect label={'Rows per 4"'} value={state.rowGauge} options={ROW_GAUGE_OPTIONS} onChange={(rowGauge) => update({ rowGauge })} />
            </div>
            <label className={styles.color} style={{ marginTop: "0.8rem" }}>
              <input type="color" value={state.color} onChange={(e) => update({ color: e.target.value })} />
              Yarn color
            </label>
          </fieldset>
        </form>
      </div>

      <p className={styles.notice}>
        <strong>Swatch first.</strong> These numbers are only right at your gauge, and the starting values above are typical figures rather than yours. Work a 4&quot; swatch, measure it, and enter what you get.
      </p>

      <div className={styles.results}>
        <section>
          <h2>Instructions</h2>
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
        </section>

        <section>
          <h2>Your project</h2>
          <table className={styles.yardage}>
            <tbody>
              <tr>
                <th scope="row">{result.startLabel}</th>
                <td>{result.startCount}</td>
              </tr>
              <tr>
                <th scope="row">Stitches per row</th>
                <td>{result.stitchesPerRow}</td>
              </tr>
              <tr>
                <th scope="row">Rows</th>
                <td>{result.rows}</td>
              </tr>
              <tr>
                <th scope="row">Finished size</th>
                <td>
                  {result.width}&quot; x {result.length}&quot;
                </td>
              </tr>
              <tr>
                <th scope="row">Yarn (rough estimate)</th>
                <td>about {result.yards} yd</td>
              </tr>
            </tbody>
          </table>
          <p className={styles.note}>Size is rounded to whole pattern repeats. Real yarn use varies a lot with fiber and tension, so buy extra.</p>
        </section>
      </div>
    </div>
  );
}
