"use client";

import { ColorInput } from "./ColorInput";
import { useEffect, useState, type ReactNode } from "react";
import { generateWeavingPdf, generateWeaving, type Locale, type WeavingStripe } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { useTrackCustomize } from "@/lib/analytics";
import { fill, messages } from "@/lib/i18n";
import copy from "@/i18n/messages/weaving.json";
import { COUNT_OPTIONS, MAX_STRIPES, normalizeWeaving, serializeWeavingState, shaftOptions, STRUCTURE_OPTIONS, STRUCTURES, tieUpOptions, VIEW_OPTIONS, weavingRequest, type WeavingState } from "@/lib/weavingState";
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

const ROW = { display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.4rem" } as const;

/** A color order: one row per stripe, its color and how many threads. */
function Stripes({ label, stripes, t, onChange, extra }: { label: string; stripes: WeavingStripe[]; t: (typeof copy)["en"]; onChange: (stripes: WeavingStripe[]) => void; extra?: ReactNode }) {
  const set = (i: number, patch: Partial<WeavingStripe>) => onChange(stripes.map((s, n) => (n === i ? { ...s, ...patch } : s)));
  return (
    <div style={{ marginTop: "0.6rem" }}>
      <strong>{label}</strong>
      {stripes.map((stripe, i) => (
        <div key={i} style={ROW}>
          <ColorInput aria-label={fill(t.stripeColor, { n: i + 1 })} value={stripe.color} onChange={(picked) => set(i, { color: picked })} />
          <select aria-label={fill(t.stripeCount, { n: i + 1 })} value={stripe.count} onChange={(e) => set(i, { count: Number(e.target.value) })}>
            {COUNT_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
          {stripes.length > 1 ? (
            <button type="button" className={styles.tab} aria-label={fill(t.removeStripe, { n: i + 1 })} onClick={() => onChange(stripes.filter((_, n) => n !== i))}>
              ×
            </button>
          ) : null}
        </div>
      ))}
      <div style={ROW}>
        {stripes.length < MAX_STRIPES ? (
          <button type="button" className={styles.tab} onClick={() => onChange([...stripes, { ...stripes[stripes.length - 1], count: stripes[stripes.length - 1].count }])}>
            {t.addStripe}
          </button>
        ) : null}
        {extra}
      </div>
    </div>
  );
}

export function WeavingBuilder({ locale, option, labels, initialState }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: WeavingState }) {
  const t = copy[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("weaving", locale);
  const [state, setState] = useState(initialState);
  useTrackCustomize("weaving", state);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<WeavingState>) => setState((s) => normalizeWeaving({ ...s, ...patch }));
  /** A structure setting replaces a named draft with the structure's own. */
  const updateStructure = (patch: Partial<WeavingState>) => setState((s) => normalizeWeaving({ ...s, ...patch, draft: undefined }));

  const result = useLiveResult(generateWeaving, weavingRequest(state), setStatus, b.updateError);

  useEffect(() => {
    syncShareLink(serializeWeavingState(state), "weaving", option);
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

  const picture = result?.svg[state.view] ?? "";
  const fileName = `weaving-${state.draft ?? state.structure}`;
  const options = STRUCTURES[state.structure];
  const draftName = state.draft ? (t.drafts as Record<string, string>)[state.draft] : undefined;
  // Palettes recolor the threads in order, ground (weft) first.
  const colors = [...new Set([...state.weft, ...state.warp].map((s) => s.color))];
  const recolor = (palette: string[]) => {
    const map = new Map(colors.map((c, i) => [c, palette[i % palette.length]]));
    update({ warp: state.warp.map((s) => ({ ...s, color: map.get(s.color)! })), weft: state.weft.map((s) => ({ ...s, color: map.get(s.color)! })) });
  };

  return (
    <div className={styles.builder}>
      <OptionNav tool="weaving" locale={locale} current={option} labels={labels} />
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          {/* The draft has no inch size, so it fills the column rather than sizing to the SVG as quilts do. */}
          {result ? <div className={styles.art} role="img" aria-label={state.view === "draft" ? t.draftAlt : t.clothAlt} dangerouslySetInnerHTML={{ __html: picture }} /> : <ToolLoading locale={locale} />}
          {result ? <p className={styles.note}>{fill(t.repeatNote, { ends: result.ends, picks: result.picks, repeatEnds: result.repeatEnds, repeatPicks: result.repeatPicks })}</p> : null}
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateWeavingPdf(weavingRequest(state)), `${fileName}-draft.pdf`, "application/pdf"))}>
              {t.downloadGuide}
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(state.view === "cloth" ? result!.svg.tile : picture, `${fileName}.svg`))}>
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
            <legend>{t.structure}</legend>
            <div className={styles.presets}>
              {STRUCTURE_OPTIONS.map((structure) => (
                <button key={structure} type="button" className={state.structure === structure ? styles.tabOn : styles.tab} aria-pressed={state.structure === structure} onClick={() => goToOption(slugFor("weaving", structure)!)}>
                  {t.structures[structure]}
                </button>
              ))}
            </div>
            <p className={styles.note}>{t.structureHelp[state.structure]}</p>
            {draftName ? (
              <p className={styles.note}>
                <strong>{fill(t.namedDraft, { name: draftName })}</strong>{" "}
                <button type="button" className={styles.tab} onClick={() => updateStructure({})}>
                  {t.clearDraft}
                </button>
              </p>
            ) : (
              <div className={styles.fieldRow}>
                {shaftOptions(state.structure).length > 1 ? <Select label={t.shafts} value={state.shafts} options={shaftOptions(state.structure).map((n) => ({ value: n, label: String(n) }))} onChange={(shafts) => updateStructure({ shafts })} /> : null}
                {tieUpOptions(state.structure, state.shafts).length > 1 ? <Select label={t.tieUp} value={state.tieUp} options={tieUpOptions(state.structure, state.shafts).map((v) => ({ value: v, label: v }))} onChange={(tieUp) => updateStructure({ tieUp })} /> : null}
                {options.sizes.length > 1 ? <Select label={t.size} value={state.size} options={options.sizes.map((n) => ({ value: n, label: String(n) }))} onChange={(size) => updateStructure({ size })} /> : null}
              </div>
            )}
            <Select label={t.view} value={state.view} options={VIEW_OPTIONS.map((v) => ({ value: v, label: t.views[v] }))} onChange={(view) => update({ view })} />
          </fieldset>

          <fieldset>
            <legend>{t.colors}</legend>
            <p className={styles.note}>{t.stripesHelp}</p>
            <Stripes label={t.warp} stripes={state.warp} t={t} onChange={(warp) => update({ warp })} />
            <Stripes
              label={t.weft}
              stripes={state.weft}
              t={t}
              onChange={(weft) => update({ weft })}
              extra={
                <button type="button" className={styles.tab} onClick={() => update({ weft: state.warp })}>
                  {t.sameAsWarp}
                </button>
              }
            />
            <PalettePicker locale={locale} current={colors} onApply={recolor} />
          </fieldset>
        </form>
      </div>

      {result && !result.seamless ? <p className={styles.notice}>{t.notSeamless}</p> : null}

      <p className={styles.notice}>
        <strong>{t.readTitle}</strong> {t.readText}
      </p>

      {result ? (
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
              <li>{fill(t.loom, { shafts: result.shafts, treadles: result.treadles })}</li>
              <li>{fill(t.floats, { warp: result.floats.warp, weft: result.floats.weft })}</li>
              <li>
                <strong>{t.threading}:</strong> {result.threading.join(" ")}
              </li>
              <li>
                <strong>{t.tieUp}:</strong> {result.tieUp.map((shafts, i) => fill(t.treadle, { t: i + 1, shafts: shafts.join(", ") })).join("; ")}
              </li>
              <li>
                <strong>{t.treadling}:</strong> {result.treadling.join(" ")}
              </li>
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  );
}
