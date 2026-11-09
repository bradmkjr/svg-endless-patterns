"use client";

import { ColorInput } from "./ColorInput";
import { useEffect, useState } from "react";
import { generateQuilt, generateQuiltPdf, type Locale, type QuiltCutMapLine, type QuiltFinish, type QuiltResult, type Setting } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { useTrackCustomize } from "@/lib/analytics";
import { fill, messages } from "@/lib/i18n";
import copy from "@/i18n/messages/quilt.json";
import { ARRANGEMENTS, BATTING_OPTIONS, followsDesign, MAX_PALETTE, MAX_SAMPLER_BLOCKS, MAX_SEED, MIN_PALETTE, NOISE_OPTIONS, PLAIN, QUILTING_OPTIONS, quiltRequest, quiltWithUnits, serializeQuiltState, type QuiltState } from "@/lib/quiltState";
import { COUNT_OPTIONS, SETTINGS } from "@/lib/state";
import { formatLength as formatMeasure, MEASURES, UNIT_OPTIONS, type Units } from "@/lib/units";
import { rememberSeed, syncShareLink } from "@/lib/toolOptions";
import { useLiveResult } from "@/lib/useLiveResult";
import { FavoriteButton } from "./FavoriteButton";
import { OptionNav, useOptionNavigation } from "./OptionNav";
import { PalettePicker } from "./PalettePicker";
import { ScrapBaskets } from "./ScrapBaskets";
import { ToolLoading } from "./ToolLoading";
import styles from "./BlockBuilder.module.css";
import q from "./Quilt.module.css";

type View = "quilt" | "detail";
type Copy = (typeof copy)["en"];

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

const number = (locale: Locale, value: number, digits = 0) => value.toLocaleString(locale === "pt" ? "pt-BR" : locale, { maximumFractionDigits: digits, minimumFractionDigits: digits });

/** Grams as pounds and ounces and as kilograms, in the order the language reads them. */
function formatWeight(t: Copy, locale: Locale, grams: number): string {
  const ounces = Math.round(grams / 28.349523);
  return fill(t.weightValue, { lb: Math.floor(ounces / 16), oz: ounces % 16, kg: number(locale, grams / 1000, 1) });
}

const formatLength = (t: Copy, locale: Locale, meters: number) => fill(t.lengthValue, { m: number(locale, meters), yd: number(locale, meters / 0.9144) });

/** A cut's shape at one scale for every cut, so a 2" square looks smaller than a 6" one. */
const PX_PER_INCH = 5.5;

function CutLine({ line, label }: { line: QuiltCutMapLine; label: string }) {
  const [done, setDone] = useState(false);
  const width = Number(/data-width="([\d.]+)"/.exec(line.svg)?.[1] ?? 1) * PX_PER_INCH;
  return (
    <li className={`${q.cut} ${done ? q.cutDone : ""}`}>
      <span className={q.shape}>
        <span style={{ display: "block", width }} dangerouslySetInnerHTML={{ __html: line.svg }} />
      </span>
      <label>
        <input type="checkbox" checked={done} onChange={(e) => setDone(e.target.checked)} aria-label={`${label}: ${line.text}`} />
        <span className={q.cutText}>{line.text}</span>
      </label>
    </li>
  );
}

/** Every cut by color, drawn to scale, to print and tick off. */
function CutMap({ result, t, locale, units, colorName }: { result: QuiltResult; t: Copy; locale: Locale; units: Units; colorName: (id: string) => string }) {
  const print = () => {
    document.documentElement.dataset.print = "cut-map";
    const clear = () => {
      delete document.documentElement.dataset.print;
      window.removeEventListener("afterprint", clear);
    };
    window.addEventListener("afterprint", clear);
    window.print();
  };
  return (
    <section className={q.cutMap} aria-labelledby="cut-map">
      <div className={q.cutMapHead}>
        <h2 id="cut-map">{t.cutMapTitle}</h2>
        <button type="button" className={`${styles.secondary} no-print`} onClick={print}>
          {t.printCutMap}
        </button>
      </div>
      <p className={styles.note}>
        {t.cutMapIntro} {fill(t.cutMapScale, { max: units === "in" ? '12"' : "30 cm" })}
      </p>
      {result.cutMap.map((group) => {
        const name = group.id.startsWith("scraps-") ? fill(t.scrapsGroup, { label: group.label ?? group.id.slice("scraps-".length) }) : colorName(group.id);
        return (
          <div key={`${locale}-${group.id}`} className={q.cutGroup}>
            <h3>
              {group.color && <span className={q.chip} style={{ background: group.color }} aria-hidden />}
              {name}
            </h3>
            <ul className={q.cuts}>
              {group.cuts.map((line) => (
                <CutLine key={`${line.method}-${line.w}-${line.h}-${line.text}`} line={line} label={name} />
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

export function QuiltBuilder({ locale, option, labels, blockNames, initialState }: { locale: Locale; option?: string; labels: Record<string, string>; blockNames: Record<string, string>; initialState: QuiltState }) {
  const t = copy[locale];
  const b = messages(locale).builder;
  const goToDesign = useOptionNavigation("quilt", locale);
  const [state, setState] = useState(initialState);
  useTrackCustomize("quilt", state);
  const [view, setView] = useState<View>("quilt");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  // How SVG and PNG downloads are drawn. The preview is always cloth.
  const [finish, setFinish] = useState<QuiltFinish>("cloth");

  const update = (patch: Partial<QuiltState>) => setState((s) => ({ ...s, ...patch }));
  const units: Units = state.units ?? "in";
  const measures = MEASURES[units];
  const len = (value: number) => formatMeasure(value, units, locale);
  const result = useLiveResult(generateQuilt, quiltRequest(state), setStatus, b.updateError);

  const query = serializeQuiltState(state);
  useEffect(() => {
    syncShareLink(query, "quilt", option);
    rememberSeed("quilt", state.seed);
  }, [query, option, state.seed]);

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

  const blockName = (slug: string) => (slug === PLAIN ? t.plain : (blockNames[slug] ?? slug));
  const blockOptions = Object.keys(blockNames);
  const choices = [PLAIN, ...blockOptions];
  const shownBlocks = state.arrangement === "repeat" ? 1 : state.arrangement === "alternate" ? 2 : state.blocks.length;
  const setBlock = (i: number, slug: string) => {
    const blocks = [...state.blocks];
    blocks[i] = slug;
    update({ blocks });
  };
  const setArrangement = (arrangement: QuiltState["arrangement"]) => {
    // Two blocks to alternate: keep the second if there is one, else set them off with plain squares.
    const blocks = arrangement === "alternate" && state.blocks.length < 2 ? [state.blocks[0]!, PLAIN] : state.blocks;
    update({ arrangement, blocks });
  };
  const colorName = (id: string) => (id === "sashing" ? b.sashing : id === "border" ? b.border : fill(t.colorN, { n: Number(id.slice("palette-".length)) + 1 }));
  const setPalette = (palette: string[]) => update({ palette: palette.slice(0, MAX_PALETTE) });
  // Once its blocks change, a quilt is no longer its design, so it's named for its blocks.
  const ownDesign = !followsDesign(state);
  const name = ownDesign ? state.blocks.slice(0, shownBlocks).map(blockName).join(" + ") : (labels[state.design] ?? t.h1);
  const favoriteQuery = new URLSearchParams(query);
  favoriteQuery.delete("d");
  favoriteQuery.set("seed", String(state.seed));

  const svg = result?.svg[view] ?? "";
  const fileBase = `quilt-${state.design}-${view}${finish === "plain" ? "-plain" : ""}`;
  const downloadText = async () => (finish === "plain" ? (await generateQuilt({ ...quiltRequest(state), finish })).svg[view] : svg);

  return (
    <div className={styles.builder}>
      <div className={q.hideForCutMap}>
        <OptionNav tool="quilt" locale={locale} current={option} labels={labels} />
        <div className={styles.workspace}>
          <section className={styles.preview} aria-label={b.preview}>
            <div className={`${styles.tabs} no-print`} role="group" aria-label={b.previewType}>
              {(["quilt", "detail"] as const).map((id) => (
                <button key={id} type="button" aria-pressed={view === id} className={view === id ? styles.tabOn : styles.tab} onClick={() => setView(id)}>
                  {id === "quilt" ? t.viewQuilt : t.viewDetail}
                </button>
              ))}
            </div>
            {result ? (
              <div className={`${styles.art} ${view === "quilt" ? styles.quiltArt : ""}`} role="img" aria-label={fill(t.previewAlt, { name })} dangerouslySetInnerHTML={{ __html: svg }} />
            ) : (
              <ToolLoading locale={locale} />
            )}
            <div className={`${styles.actions} no-print`}>
              <button type="button" disabled={busy || !result} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateQuiltPdf({ ...quiltRequest(state), finish }), `quilt-${state.design}-pattern.pdf`, "application/pdf"))}>
                {b.downloadPdf}
              </button>
              <FavoriteButton kind="quilt" slug={state.design} name={name} query={favoriteQuery.toString()} colors={[...state.palette, state.borderColor]} locale={locale} onStatus={setStatus} />
              <label className={styles.finish}>
                <span>{b.downloadStyle}</span>
                <select value={finish} disabled={busy} onChange={(e) => setFinish(e.target.value as QuiltFinish)}>
                  <option value="cloth">{b.styleCloth}</option>
                  <option value="plain">{b.stylePlain}</option>
                </select>
              </label>
              <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, async () => downloadSvg(await downloadText(), `${fileBase}.svg`))}>
                {t.downloadSvg}
              </button>
              <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, async () => downloadPng(await downloadText(), `${fileBase}.png`))}>
                {t.downloadPng}
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
              <legend>{t.blocksHeading}</legend>
              <label className={styles.field}>
                <span>{t.design}</span>
                <select value={ownDesign ? "" : state.design} onChange={(e) => e.target.value && goToDesign(e.target.value)}>
                  {ownDesign && <option value="">{t.customDesign}</option>}
                  {Object.keys(labels).map((id) => (
                    <option key={id} value={id}>
                      {labels[id]}
                    </option>
                  ))}
                </select>
              </label>
              {!ownDesign && <p className={styles.note}>{t.designNotes[state.design as keyof Copy["designNotes"]]}</p>}
              <Select label={t.arrangement} value={state.arrangement} options={ARRANGEMENTS} format={(id) => t.arrangements[id]} onChange={setArrangement} />
              {state.blocks.slice(0, shownBlocks).map((slug, i) => (
                <div key={i} className={q.blockRow}>
                  <Select
                    label={state.arrangement === "sampler" ? fill(t.samplerBlock, { n: i + 1 }) : i === 0 ? t.firstBlock : t.secondBlock}
                    value={slug}
                    options={choices}
                    format={blockName}
                    onChange={(next) => setBlock(i, next)}
                  />
                  {state.arrangement === "sampler" && state.blocks.length > 1 && (
                    <button type="button" className={q.iconButton} aria-label={fill(t.removeBlock, { n: i + 1 })} title={fill(t.removeBlock, { n: i + 1 })} onClick={() => update({ blocks: state.blocks.filter((_, j) => j !== i) })}>
                      ×
                    </button>
                  )}
                </div>
              ))}
              {state.arrangement === "sampler" && state.blocks.length < MAX_SAMPLER_BLOCKS && (
                <button type="button" className={styles.tab} onClick={() => update({ blocks: [...state.blocks, blockOptions[state.blocks.length % blockOptions.length]!] })}>
                  {t.addBlock}
                </button>
              )}
            </fieldset>

            <fieldset>
              <legend>{t.fabricsHeading}</legend>
              <div className={q.paletteRow}>
                {state.palette.map((color, i) => (
                  <label key={i} className={q.colorField}>
                    <span>{fill(t.colorN, { n: i + 1 })}</span>
                    <ColorInput value={color} onChange={(picked) => setPalette(state.palette.map((c, j) => (j === i ? picked : c)))} />
                  </label>
                ))}
                {state.palette.length < MAX_PALETTE && (
                  <button type="button" className={q.iconButton} aria-label={t.addColor} title={t.addColor} onClick={() => setPalette([...state.palette, state.palette[state.palette.length % 2]!])}>
                    +
                  </button>
                )}
                {state.palette.length > MIN_PALETTE && (
                  <button type="button" className={q.iconButton} aria-label={t.removeColor} title={t.removeColor} onClick={() => setPalette(state.palette.slice(0, -1))}>
                    −
                  </button>
                )}
              </div>
              <p className={styles.note}>{t.paletteNote}</p>
              <div className={q.paletteRow}>
                {state.sashing > 0 && (
                  <label className={q.colorField}>
                    <span>{b.sashing}</span>
                    <ColorInput value={state.sashingColor} onChange={(picked) => update({ sashingColor: picked })} />
                  </label>
                )}
                {state.border > 0 && (
                  <label className={q.colorField}>
                    <span>{b.border}</span>
                    <ColorInput value={state.borderColor} onChange={(picked) => update({ borderColor: picked })} />
                  </label>
                )}
              </div>
              <ScrapBaskets locale={locale} onApply={(basket) => update({ palette: [...basket.colors], sashingColor: basket.colors[0]!, borderColor: basket.border })} />
              <PalettePicker locale={locale} current={state.palette} onApply={(c) => (c.length >= MIN_PALETTE ? update({ palette: c.slice(0, MAX_PALETTE), sashingColor: c[0]!, borderColor: c[1]! }) : undefined)} />
              <Select label={t.noise} value={state.noise} options={NOISE_OPTIONS} format={(n) => `${n}%`} onChange={(noise) => update({ noise })} />
              <p className={styles.note}>{t.noiseNote}</p>
              <label className={styles.check}>
                <input type="checkbox" checked={state.scrappy} onChange={(e) => update({ scrappy: e.target.checked })} />
                {t.scrappy}
              </label>
              {(state.noise > 0 || state.scrappy) && (
                <button type="button" className={styles.tab} onClick={() => update({ seed: Math.floor(Math.random() * (MAX_SEED + 1)) })}>
                  {t.reshuffle}
                </button>
              )}
            </fieldset>

            <fieldset>
              <legend>{b.layout}</legend>
              <Select label={b.units} value={units} options={UNIT_OPTIONS} format={(id: Units) => (id === "in" ? b.unitsIn : b.unitsCm)} onChange={(next) => setState((s) => quiltWithUnits(s, next))} />
              <div className={styles.fieldRow}>
                <Select label={b.finishedSize} value={state.size} options={measures.size} format={len} onChange={(size) => update({ size })} />
                <Select label={b.across} value={state.cols} options={COUNT_OPTIONS} format={String} onChange={(cols) => update({ cols })} />
                <Select label={b.down} value={state.rows} options={COUNT_OPTIONS} format={String} onChange={(rows) => update({ rows })} />
              </div>
              <div className={styles.fieldRow}>
                <Select label={b.sashing} value={state.sashing} options={measures.sashing} format={(n) => (n === 0 ? b.none : len(n))} onChange={(sashing) => update({ sashing })} />
                <Select label={b.border} value={state.border} options={measures.border} format={(n) => (n === 0 ? b.none : len(n))} onChange={(border) => update({ border })} />
              </div>
              <Select label={b.direction} value={state.setting} options={SETTINGS} format={(id: Setting) => messages(locale).settings[id]} onChange={(setting) => update({ setting })} />
              <Select label={b.wof} value={state.wof} options={measures.wof} format={len} onChange={(wof) => update({ wof })} />
            </fieldset>

            <fieldset>
              <legend>{t.quiltingHeading}</legend>
              <Select label={t.quiltingDesign} value={state.quilting} options={QUILTING_OPTIONS} format={(id) => t.quiltings[id]} onChange={(quilting) => update({ quilting })} />
              <p className={styles.note}>{t.quiltingNotes[state.quilting]}</p>
              <label className={styles.check}>
                <input type="checkbox" checked={state.showQuilting} onChange={(e) => update({ showQuilting: e.target.checked })} />
                {t.showQuilting}
              </label>
              <div className={styles.fieldRow}>
                <label className={q.colorField}>
                  <span>{t.thread}</span>
                  <ColorInput value={state.thread} onChange={(picked) => update({ thread: picked })} />
                </label>
                <Select label={t.battingLabel} value={state.batting} options={BATTING_OPTIONS} format={(id) => t.battings[id]} onChange={(batting) => update({ batting })} />
              </div>
            </fieldset>
          </form>
        </div>

        {result && (
          <div className={styles.results}>
            <section>
              <h2>{b.fabricBuy}</h2>
              <p className={styles.quiltSize}>
                {b.quiltTop} <strong>{result.quilt.widthLabel} x {result.quilt.heightLabel}</strong>, {fill(result.quilt.blocks === 1 ? b.blocksOne : b.blocksMany, { n: result.quilt.blocks })}
              </p>
              <ul className={q.counts}>
                {result.blocks.map(({ slug, count }) => (
                  <li key={slug}>{fill(t.blockCount, { n: count, name: blockName(slug) })}</li>
                ))}
              </ul>
              <table className={styles.yardage}>
                <tbody>
                  {result.yardage.map(({ id, color, yards }) => (
                    <tr key={id}>
                      <th scope="row">
                        <span className={styles.swatch} style={{ background: color }} aria-hidden />
                        {colorName(id)}
                      </th>
                      <td>{yards}</td>
                    </tr>
                  ))}
                  <tr>
                    <th scope="row">{fill(result.backing.panels === 1 ? b.backingOne : b.backingMany, { n: result.backing.panels })}</th>
                    <td>{result.backing.yards}</td>
                  </tr>
                  <tr>
                    <th scope="row">{fill(b.binding, { n: result.binding.strips, w: result.binding.stripWidth })}</th>
                    <td>{result.binding.yards}</td>
                  </tr>
                  <tr>
                    <th scope="row">{b.batting}</th>
                    <td>
                      {result.batting.width} x {result.batting.height}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className={styles.note}>
                {b.allowance} {result.yardageEstimated && t.yardageEstimate}
              </p>
            </section>

            <section>
              <h2>{t.weightTitle}</h2>
              <p className={styles.note}>{t.weightIntro}</p>
              <table className={q.weight}>
                <tbody>
                  {result.weight.parts
                    .filter((part) => part.grams > 0)
                    .map((part) => (
                      <tr key={part.id}>
                        <th scope="row">{t.weightParts[part.id]}</th>
                        <td>{fill(t.gramsValue, { g: number(locale, part.grams) })}</td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">{t.weightTotal}</th>
                    <td>{formatWeight(t, locale, result.weight.grams)}</td>
                  </tr>
                </tfoot>
              </table>
              {result.stitching.inches > 0 && <p className={styles.note}>{fill(t.stitchingNote, { length: formatLength(t, locale, result.stitching.inches * 0.0254), thread: formatLength(t, locale, result.stitching.threadMeters) })}</p>}
              <p className={styles.note}>{t.weightNote}</p>
            </section>
          </div>
        )}
      </div>

      {result && <CutMap result={result} t={t} locale={locale} units={units} colorName={colorName} />}
    </div>
  );
}
