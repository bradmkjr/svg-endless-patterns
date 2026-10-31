"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { generatePattern, generatePdf, type BlockInfo, type CutLine, type Locale, type PatternRequest, type PatternResult } from "@/lib/generator";
import { fill, messages } from "@/lib/i18n";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { BORDER_OPTIONS, COUNT_OPTIONS, paletteColors, palettesFor, SASHING_OPTIONS, serializeState, SETTINGS, SIZE_OPTIONS, WOF_OPTIONS } from "@/lib/state";
import { PalettePicker } from "./PalettePicker";
import styles from "./BlockBuilder.module.css";

type View = "block" | "quilt" | "tile";

const VIEWS: { id: View; label: "viewBlock" | "viewQuilt" | "viewTile" }[] = [
  { id: "block", label: "viewBlock" },
  { id: "quilt", label: "viewQuilt" },
  { id: "tile", label: "viewTile" },
];

function NumberSelect({ label, value, options, unit = "", none, onChange }: { label: string; value: number; options: number[]; unit?: string; none: string; onChange: (value: number) => void }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option === 0 ? none : `${option}${unit}`}
          </option>
        ))}
      </select>
    </label>
  );
}

function CutTable({ cuts, labelOf, colors, roundedUp }: { cuts: CutLine[]; labelOf: (id: string) => string; colors: Record<string, string>; roundedUp: string }) {
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
                  {c.rounded && <span className={styles.rounded}> {roundedUp}</span>}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function BlockBuilder({ block, locale, initialState, initialResult }: { block: BlockInfo; locale: Locale; initialState: PatternRequest; initialResult: PatternResult }) {
  const all = messages(locale);
  const t = all.builder;
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
        if (!stale) setStatus(t.updateError);
      },
    );
    return () => {
      stale = true;
    };
  }, [block.slug, state, t.updateError]);

  // Keep the address a share link for the current design.
  useEffect(() => {
    const query = serializeState(block, state);
    window.history.replaceState(window.history.state, "", query ? `?${query}` : window.location.pathname);
  }, [block, state]);

  const labelOf = (id: string) => (id === "sashing" ? t.sashing : id === "border" ? t.border : (block.fabrics.find((f) => f.id === id)?.label ?? id));
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
      setStatus(t.actionError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.builder}>
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={t.preview}>
          <div className={`${styles.tabs} no-print`} role="group" aria-label={t.previewType}>
            {VIEWS.map(({ id, label }) => (
              <button key={id} type="button" aria-pressed={view === id} className={view === id ? styles.tabOn : styles.tab} onClick={() => setView(id)}>
                {t[label]}
              </button>
            ))}
          </div>
          {view === "tile" ? (
            <div className={styles.tile} style={tileStyle} role="img" aria-label={fill(t.tileAlt, { name: block.name })} />
          ) : (
            <div className={`${styles.art} ${view === "quilt" ? styles.quiltArt : ""}`} dangerouslySetInnerHTML={{ __html: currentSvg }} />
          )}
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run(t.pdfMaking, t.pdfDone, async () => downloadBytes(await generatePdf(block.slug, state), `${block.slug}-${state.size}in-pattern.pdf`, "application/pdf"))}>
              {t.downloadPdf}
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run(t.saving, t.svgDone, () => downloadSvg(currentSvg, `${fileBase}.svg`))}>
              SVG
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run(t.pngMaking, t.pngDone, () => downloadPng(currentSvg, `${fileBase}.png`))}>
              PNG
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run(t.copying, t.copied, () => navigator.clipboard.writeText(window.location.href))}>
              {t.copyLink}
            </button>
          </div>
          <p className={styles.status} role="status">
            {status}
          </p>
        </section>

        <form className={`${styles.controls} no-print`} onSubmit={(e) => e.preventDefault()}>
          <fieldset>
            <legend>{t.fabrics}</legend>
            <div className={styles.palettes}>
              {palettesFor(locale).map((palette) => (
                <button key={palette.id} type="button" title={all.palettes[palette.id]} aria-label={fill(t.usePalette, { name: all.palettes[palette.id] })} className={styles.palette} onClick={() => update({ colors: paletteColors(block, palette) })}>
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
                  {t.sashing}
                </label>
              )}
              {state.border > 0 && (
                <label className={styles.color}>
                  <input type="color" value={state.colors.border} onChange={(e) => setColor("border", e.target.value)} />
                  {t.border}
                </label>
              )}
            </div>
            <label className={styles.check}>
              <input type="checkbox" checked={state.seams} onChange={(e) => update({ seams: e.target.checked })} />
              {t.showSeams}
            </label>
            <PalettePicker locale={locale} current={block.fabrics.map((f) => state.colors[f.id])} onApply={(c) => update({ colors: paletteColors(block, { id: "flag", colors: c, sashing: c[0], border: c[1] }) })} />
          </fieldset>

          <fieldset>
            <legend>{t.block}</legend>
            <NumberSelect none={t.none} label={t.finishedSize} value={state.size} options={SIZE_OPTIONS} unit={'"'} onChange={(size) => update({ size })} />
          </fieldset>

          <fieldset>
            <legend>{t.layout}</legend>
            <div className={styles.fieldRow}>
              <NumberSelect none={t.none} label={t.across} value={state.cols} options={COUNT_OPTIONS} onChange={(cols) => update({ cols })} />
              <NumberSelect none={t.none} label={t.down} value={state.rows} options={COUNT_OPTIONS} onChange={(rows) => update({ rows })} />
              <NumberSelect none={t.none} label={t.sashing} value={state.sashing} options={SASHING_OPTIONS} unit={'"'} onChange={(sashing) => update({ sashing })} />
              <NumberSelect none={t.none} label={t.border} value={state.border} options={BORDER_OPTIONS} unit={'"'} onChange={(border) => update({ border })} />
            </div>
            <label className={styles.field}>
              <span>{t.direction}</span>
              <select value={state.setting} onChange={(e) => update({ setting: e.target.value as PatternRequest["setting"] })}>
                {SETTINGS.map((id) => (
                  <option key={id} value={id}>
                    {all.settings[id]}
                  </option>
                ))}
              </select>
            </label>
            <NumberSelect none={t.none} label={t.wof} value={state.wof} options={WOF_OPTIONS} unit={'"'} onChange={(wof) => update({ wof })} />
          </fieldset>
        </form>
      </div>

      {result.hasRoundedCuts && (
        <p className={styles.notice}>
          <strong>{t.roundedTitle}</strong> {fill(t.roundedText, { size: state.size })}
          {result.suggestedSizes.length > 0 && (
            <>
              {" "}
              {t.evenSizes}{" "}
              {result.suggestedSizes.map((size, i) => (
                <span key={size}>
                  {i > 0 && ` ${t.or} `}
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
            <h2>{t.cuttingList}</h2>
            <div className={`${styles.tabs} no-print`} role="group" aria-label={t.cuttingScope}>
              <button type="button" aria-pressed={scope === "quilt"} className={scope === "quilt" ? styles.tabOn : styles.tab} onClick={() => setScope("quilt")}>
                {t.wholeQuilt}
              </button>
              <button type="button" aria-pressed={scope === "block"} className={scope === "block" ? styles.tabOn : styles.tab} onClick={() => setScope("block")}>
                {t.oneBlock}
              </button>
            </div>
          </div>
          <CutTable cuts={scope === "quilt" ? result.quiltCuts : result.blockCuts} labelOf={labelOf} colors={state.colors} roundedUp={t.roundedUp} />
        </section>

        <section>
          <h2>{t.fabricBuy}</h2>
          <p className={styles.quiltSize}>
            {t.quiltTop} <strong>{result.quilt.widthLabel}&quot; x {result.quilt.heightLabel}&quot;</strong>, {fill(result.quilt.blocks === 1 ? t.blocksOne : t.blocksMany, { n: result.quilt.blocks })}
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
                <th scope="row">{fill(result.backing.panels === 1 ? t.backingOne : t.backingMany, { n: result.backing.panels })}</th>
                <td>{result.backing.yards} yd</td>
              </tr>
              <tr>
                <th scope="row">{fill(t.binding, { n: result.binding.strips, w: result.binding.stripWidth })}</th>
                <td>{result.binding.yards} yd</td>
              </tr>
              <tr>
                <th scope="row">{t.batting}</th>
                <td>{result.backing.width}&quot; x {result.backing.height}&quot;</td>
              </tr>
            </tbody>
          </table>
          <p className={styles.note}>{t.allowance}</p>
        </section>

        <section className={styles.steps}>
          <h2>{t.howTo}</h2>
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
