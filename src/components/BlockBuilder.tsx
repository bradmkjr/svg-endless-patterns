"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { generatePattern, generatePdf, type BlockInfo, type CutLine, type PatternRequest, type PatternResult } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { BORDER_OPTIONS, COUNT_OPTIONS, paletteColors, PALETTES, SASHING_OPTIONS, serializeState, SETTINGS, SIZE_OPTIONS, WOF_OPTIONS } from "@/lib/state";
import styles from "./BlockBuilder.module.css";

type View = "block" | "quilt" | "tile";

const VIEWS: { id: View; label: string }[] = [
  { id: "block", label: "Block" },
  { id: "quilt", label: "Quilt" },
  { id: "tile", label: "Seamless repeat" },
];

function NumberSelect({ label, value, options, unit = "", onChange }: { label: string; value: number; options: number[]; unit?: string; onChange: (value: number) => void }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option === 0 ? "None" : `${option}${unit}`}
          </option>
        ))}
      </select>
    </label>
  );
}

function CutTable({ cuts, labelOf, colors }: { cuts: CutLine[]; labelOf: (id: string) => string; colors: Record<string, string> }) {
  const fabrics = [...new Set(cuts.map((c) => c.fabric))];
  return (
    <div className={styles.cutGroups}>
      {fabrics.map((fabric) => (
        <div key={fabric}>
          <h4 className={styles.fabricName}>
            <span className={styles.swatch} style={{ background: colors[fabric] }} aria-hidden />
            {labelOf(fabric)}
          </h4>
          <ul className={styles.cutList}>
            {cuts
              .filter((c) => c.fabric === fabric)
              .map((c) => (
                <li key={c.description}>
                  {c.description}
                  {c.rounded && <span className={styles.rounded}> rounded up</span>}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function BlockBuilder({ block, initialState, initialResult }: { block: BlockInfo; initialState: PatternRequest; initialResult: PatternResult }) {
  const [state, setState] = useState(initialState);
  const [result, setResult] = useState(initialResult);
  const [view, setView] = useState<View>("block");
  const [scope, setScope] = useState<"block" | "quilt">("quilt");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<PatternRequest>) => setState((s) => ({ ...s, ...patch }));
  const setColor = (id: string, color: string) => setState((s) => ({ ...s, colors: { ...s.colors, [id]: color } }));

  // Regenerate on every change, dropping any answer a newer change has overtaken.
  useEffect(() => {
    let stale = false;
    generatePattern(block.slug, state).then(
      (next) => {
        if (!stale) setResult(next);
      },
      () => {
        if (!stale) setStatus("Couldn't update the design. Please try again.");
      },
    );
    return () => {
      stale = true;
    };
  }, [block.slug, state]);

  // Keep the address a share link for the current design.
  useEffect(() => {
    const query = serializeState(block, state);
    window.history.replaceState(window.history.state, "", query ? `?${query}` : window.location.pathname);
  }, [block, state]);

  const labelOf = (id: string) => (id === "sashing" ? "Sashing" : id === "border" ? "Border" : (block.fabrics.find((f) => f.id === id)?.label ?? id));
  const currentSvg = result.svg[view];
  const fileBase = `${block.slug}-${state.size}in-${view}`;
  const tileUrl = `data:image/svg+xml,${encodeURIComponent(result.svg.tile)}`;
  const tileStyle: CSSProperties = { backgroundImage: `url("${tileUrl}")` };

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

  const hasFrame = state.sashing > 0 || state.border > 0;

  return (
    <div className={styles.builder}>
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label="Preview">
          <div className={`${styles.tabs} no-print`} role="group" aria-label="Preview type">
            {VIEWS.map(({ id, label }) => (
              <button key={id} type="button" aria-pressed={view === id} className={view === id ? styles.tabOn : styles.tab} onClick={() => setView(id)}>
                {label}
              </button>
            ))}
          </div>
          {view === "tile" ? (
            <div className={styles.tile} style={tileStyle} role="img" aria-label={`${block.name} seamless repeat`} />
          ) : (
            <div className={`${styles.art} ${view === "quilt" ? styles.quiltArt : ""}`} dangerouslySetInnerHTML={{ __html: currentSvg }} />
          )}
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run("Making your PDF…", "PDF downloaded.", async () => downloadBytes(await generatePdf(block.slug, state), `${block.slug}-${state.size}in-pattern.pdf`, "application/pdf"))}>
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
            <legend>Fabrics</legend>
            <div className={styles.palettes}>
              {PALETTES.map((palette) => (
                <button key={palette.name} type="button" title={palette.name} aria-label={`Use the ${palette.name} palette`} className={styles.palette} onClick={() => update({ colors: paletteColors(block, palette) })}>
                  {palette.colors.map((color) => (
                    <span key={color} style={{ background: color }} />
                  ))}
                </button>
              ))}
            </div>
            <div className={styles.colors}>
              {block.fabrics.map((fabric) => (
                <label key={fabric.id} className={styles.color}>
                  <input type="color" value={state.colors[fabric.id]} onChange={(e) => setColor(fabric.id, e.target.value)} />
                  {fabric.label}
                </label>
              ))}
              {state.sashing > 0 && (
                <label className={styles.color}>
                  <input type="color" value={state.colors.sashing} onChange={(e) => setColor("sashing", e.target.value)} />
                  Sashing
                </label>
              )}
              {state.border > 0 && (
                <label className={styles.color}>
                  <input type="color" value={state.colors.border} onChange={(e) => setColor("border", e.target.value)} />
                  Border
                </label>
              )}
            </div>
            <label className={styles.check}>
              <input type="checkbox" checked={state.seams} onChange={(e) => update({ seams: e.target.checked })} />
              Show seam lines
            </label>
          </fieldset>

          <fieldset>
            <legend>Block</legend>
            <NumberSelect label="Finished size" value={state.size} options={SIZE_OPTIONS} unit={'"'} onChange={(size) => update({ size })} />
          </fieldset>

          <fieldset>
            <legend>Quilt layout</legend>
            <div className={styles.fieldRow}>
              <NumberSelect label="Across" value={state.cols} options={COUNT_OPTIONS} onChange={(cols) => update({ cols })} />
              <NumberSelect label="Down" value={state.rows} options={COUNT_OPTIONS} onChange={(rows) => update({ rows })} />
              <NumberSelect label="Sashing" value={state.sashing} options={SASHING_OPTIONS} unit={'"'} onChange={(sashing) => update({ sashing })} />
              <NumberSelect label="Border" value={state.border} options={BORDER_OPTIONS} unit={'"'} onChange={(border) => update({ border })} />
            </div>
            <label className={styles.field}>
              <span>Block direction</span>
              <select value={state.setting} onChange={(e) => update({ setting: e.target.value as PatternRequest["setting"] })}>
                {SETTINGS.map(({ id, label }) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <NumberSelect label="Usable fabric width" value={state.wof} options={WOF_OPTIONS} unit={'"'} onChange={(wof) => update({ wof })} />
          </fieldset>
        </form>
      </div>

      {result.hasRoundedCuts && (
        <p className={styles.notice}>
          <strong>Some cuts are rounded up.</strong> At {state.size}&quot;, this block&apos;s pieces fall between ruler marks, so cut as listed and trim each unit, or use the PDF templates.
          {result.suggestedSizes.length > 0 && (
            <>
              {" "}
              Sizes that divide evenly:{" "}
              {result.suggestedSizes.map((size, i) => (
                <span key={size}>
                  {i > 0 && " or "}
                  <button type="button" className={styles.linkButton} onClick={() => update({ size })}>
                    {size}&quot;
                  </button>
                </span>
              ))}
              .
            </>
          )}
        </p>
      )}

      <div className={styles.results}>
        <section>
          <div className={styles.resultHead}>
            <h2>Cutting list</h2>
            <div className={`${styles.tabs} no-print`} role="group" aria-label="Cutting list scope">
              <button type="button" aria-pressed={scope === "quilt"} className={scope === "quilt" ? styles.tabOn : styles.tab} onClick={() => setScope("quilt")}>
                Whole quilt
              </button>
              <button type="button" aria-pressed={scope === "block"} className={scope === "block" ? styles.tabOn : styles.tab} onClick={() => setScope("block")}>
                One block
              </button>
            </div>
          </div>
          <CutTable cuts={scope === "quilt" ? result.quiltCuts : result.blockCuts} labelOf={labelOf} colors={state.colors} />
        </section>

        <section>
          <h2>Fabric to buy</h2>
          <p className={styles.quiltSize}>
            Quilt top: <strong>{result.quilt.widthLabel}&quot; x {result.quilt.heightLabel}&quot;</strong>, {result.quilt.blocks} block{result.quilt.blocks === 1 ? "" : "s"}
            {hasFrame ? " with sashing and border as set" : ""}
          </p>
          <table className={styles.yardage}>
            <tbody>
              {result.yardage.map(({ fabric, label, yards }) => (
                <tr key={fabric}>
                  <th scope="row">
                    <span className={styles.swatch} style={{ background: state.colors[fabric] }} aria-hidden />
                    {label}
                  </th>
                  <td>{yards} yd</td>
                </tr>
              ))}
              <tr>
                <th scope="row">Backing ({result.backing.panels} panel{result.backing.panels === 1 ? "" : "s"})</th>
                <td>{result.backing.yards} yd</td>
              </tr>
              <tr>
                <th scope="row">Binding ({result.binding.strips} strips at {result.binding.stripWidth}&quot;)</th>
                <td>{result.binding.yards} yd</td>
              </tr>
              <tr>
                <th scope="row">Batting</th>
                <td>{result.backing.width}&quot; x {result.backing.height}&quot;</td>
              </tr>
            </tbody>
          </table>
          <p className={styles.note}>Includes a 10% allowance. Check the figures before you buy.</p>
        </section>

        <section className={styles.steps}>
          <h2>How to piece it</h2>
          <ol>
            {result.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
