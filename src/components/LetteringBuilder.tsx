"use client";

import { useEffect, useState } from "react";
import copy from "@/i18n/messages/lettering.json";
import { useTrackCustomize } from "@/lib/analytics";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { generateLettering, generateLetteringPdf, LetteringProblemError, type LetteringProblem, type LetteringRequest, type LetteringResult, type Locale } from "@/lib/generator";
import { fill, messages } from "@/lib/i18n";
import {
  ALIGN_OPTIONS,
  BORDER_OPTIONS,
  FINE_FONTS,
  FONT_OPTIONS,
  HEIGHT_RANGE,
  LAYOUT_OPTIONS,
  letteringRequest,
  LINE_GAP_OPTIONS,
  MARGIN_RANGE,
  MESSAGE_LIMITS,
  messageCounts,
  PRESETS,
  serializeLetteringState,
  SPACING_OPTIONS,
  SQUARE_OPTIONS,
  TECHNIQUE_OPTIONS,
  TECHNIQUE_SLUGS,
  WEIGHT_OPTIONS,
  withPreset,
} from "@/lib/letteringState";
import { syncShareLink } from "@/lib/toolOptions";
import { ColorInput } from "./ColorInput";
import { OptionNav, useOptionNavigation } from "./OptionNav";
import { PalettePicker } from "./PalettePicker";
import { ToolLoading } from "./ToolLoading";
import styles from "./BlockBuilder.module.css";
import own from "./Lettering.module.css";

type View = keyof LetteringResult["svg"];
const VIEWS: View[] = ["picture", "chart"];
const ROLES = ["ground", "letters", "border"] as const;
/** Typing sends one request when a word is finished, not one for every letter. */
const SETTLE_MS = 350;

const range = (min: number, max: number) => Array.from({ length: max - min + 1 }, (_, i) => min + i);

function NumberSelect({ label, value, options, onChange, auto }: { label: string; value: number | undefined; options: number[]; onChange: (value: number | undefined) => void; auto?: string }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}>
        {auto !== undefined && <option value="">{auto}</option>}
        {options.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );
}

export function LetteringBuilder({ locale, option, labels, initialState }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: LetteringRequest }) {
  const t = copy[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("lettering", locale);
  const [state, setState] = useState(initialState);
  useTrackCustomize("lettering", state);
  const [generated, setGenerated] = useState<{ key: string; result: LetteringResult } | null>(null);
  const [problem, setProblem] = useState<{ key: string; problem: LetteringProblem } | null>(null);
  const [view, setView] = useState<View>("picture");
  const [status, setStatus] = useState(t.loading);
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<LetteringRequest>) => setState((s) => ({ ...s, ...patch }));
  const request = letteringRequest(state);
  const requestKey = JSON.stringify(request);
  const result = generated?.result;
  const current = problem?.key === requestKey ? problem.problem : null;
  const hasResult = generated !== null;

  useEffect(() => {
    let stale = false;
    const timer = setTimeout(
      () => {
        generateLettering(JSON.parse(requestKey) as LetteringRequest).then(
          (next) => {
            if (stale) return;
            setGenerated({ key: requestKey, result: next });
            setProblem(null);
            setStatus("");
          },
          (error: unknown) => {
            if (stale) return;
            if (error instanceof LetteringProblemError) {
              setProblem({ key: requestKey, problem: error.problem });
              setStatus("");
            } else setStatus(b.updateError);
          },
        );
      },
      hasResult ? SETTLE_MS : 0,
    );
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [requestKey, hasResult, b.updateError]);

  useEffect(() => {
    syncShareLink(serializeLetteringState(state), "lettering", option);
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
  const file = `lettering-${state.technique}`;
  const unit = t.units[state.technique];
  const counts = messageCounts(state.message);
  const over = counts.characters > MESSAGE_LIMITS.characters || counts.lines > MESSAGE_LIMITS.lines;
  const fine = FINE_FONTS[state.font];
  const crochet = state.technique !== "quilt";
  const lines = counts.lines;
  const ready = Boolean(result) && !current;

  const problemText = (p: LetteringProblem) => {
    if (p.kind === "unsupported") return fill(t.problems.unsupported, { font: t.fonts[state.font], chars: p.chars.map((c) => `“${c}”`).join(" ") });
    if (p.kind === "tooBig") return fill(t.problems.tooBig, { w: p.width, h: p.height, most: p.most });
    if (p.kind === "tooLong") return fill(t.problems.tooLong, { maxC: MESSAGE_LIMITS.characters, maxL: MESSAGE_LIMITS.lines });
    return t.problems.empty;
  };

  return (
    <div className={styles.builder}>
      <OptionNav tool="lettering" locale={locale} current={option} labels={labels} />
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          <div className={`${styles.tabs} no-print`}>
            {VIEWS.map((name) => (
              <button key={name} type="button" className={view === name ? styles.tabOn : styles.tab} aria-pressed={view === name} onClick={() => setView(name)}>
                {t.views[name]}
              </button>
            ))}
          </div>
          {current && (
            <p className={own.problem} role="alert">
              {problemText(current)}
            </p>
          )}
          {result ? (
            <div className={`art ${styles.art}`} role="img" aria-label={t.views[view]} style={current ? { opacity: 0.35 } : undefined} dangerouslySetInnerHTML={{ __html: svg }} />
          ) : current ? null : (
            <ToolLoading locale={locale} />
          )}
          {result && <p className={styles.note}>{view === "chart" ? result.chartHelp : fill(t.pictureNote, { w: inchesText(result.finished.width), h: inchesText(result.finished.height) })}</p>}
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy || !ready} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateLetteringPdf(request), `${file}.pdf`, "application/pdf"))}>
              {t.downloadPdf}
            </button>
            <button type="button" disabled={busy || !ready} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(svg, `${file}-${view}.svg`))}>
              SVG
            </button>
            <button type="button" disabled={busy || !ready} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(svg, `${file}-${view}.png`))}>
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
            <legend>{t.words}</legend>
            <textarea className={own.words} value={state.message} rows={3} maxLength={200} aria-label={t.words} aria-describedby="lettering-hint" onChange={(e) => update({ message: e.target.value })} />
            <p className={over ? own.counterOver : own.counter}>{fill(t.counter, { c: counts.characters, maxC: MESSAGE_LIMITS.characters, l: counts.lines, maxL: MESSAGE_LIMITS.lines })}</p>
            <p id="lettering-hint" className={own.hint}>
              {t.wordsHint}
            </p>
            <p className={own.tryLabel}>{t.tryLabel}</p>
            <div className={styles.presets}>
              {PRESETS.map((preset) => (
                <button key={preset.id} type="button" className={styles.tab} onClick={() => setState((s) => withPreset(s, preset, locale))}>
                  {t.presets[preset.id].name}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>{t.technique}</legend>
            <div className={styles.presets}>
              {TECHNIQUE_OPTIONS.map((technique) => (
                <button key={technique} type="button" className={state.technique === technique ? styles.tabOn : styles.tab} aria-pressed={state.technique === technique} onClick={() => goToOption(TECHNIQUE_SLUGS[technique])}>
                  {t.techniques[technique]}
                </button>
              ))}
            </div>
            <p className={styles.note}>{t.techniqueNotes[state.technique]}</p>
            {crochet ? (
              <label className={styles.field}>
                <span>{t.weight}</span>
                <select value={state.weight} onChange={(e) => update({ weight: e.target.value as LetteringRequest["weight"] })}>
                  {WEIGHT_OPTIONS.map((weight) => (
                    <option key={weight} value={weight}>
                      {t.weights[weight]}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className={styles.field}>
                <span>{t.square}</span>
                <select value={state.square} onChange={(e) => update({ square: Number(e.target.value) })}>
                  {SQUARE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {fill(t.inches, { n: inchesText(n) })}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </fieldset>

          <fieldset>
            <legend>{t.type}</legend>
            <label className={styles.field}>
              <span>{t.font}</span>
              <select value={state.font} onChange={(e) => update({ font: e.target.value as LetteringRequest["font"] })}>
                {FONT_OPTIONS.map((font) => (
                  <option key={font} value={font}>
                    {t.fonts[font]}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.fieldRow}>
              <NumberSelect label={fill(t.heightLabel, { unit })} value={state.height} options={range(HEIGHT_RANGE.min, HEIGHT_RANGE.max)} onChange={(height) => update({ height: height ?? state.height, height2: state.height2 === height ? undefined : state.height2 })} />
              {lines > 1 && <NumberSelect label={fill(t.height2Label, { unit })} value={state.height2} auto={t.sameHeight} options={range(HEIGHT_RANGE.min, HEIGHT_RANGE.max)} onChange={(height2) => update({ height2: height2 === state.height ? undefined : height2 })} />}
            </div>
            {state.font === "pixel" && result && <p className={own.hint}>{fill(t.pixelNote, { n: result.capHeights[0] })}</p>}
            {fine && state.height < fine && <p className={own.hint}>{fill(t.fineNote, { n: fine })}</p>}
            <div className={styles.fieldRow}>
              {state.font !== "script" && <NumberSelect label={t.spacing} value={state.spacing} auto={t.auto} options={SPACING_OPTIONS} onChange={(spacing) => update({ spacing })} />}
              {lines > 1 && <NumberSelect label={t.lineGap} value={state.lineGap} auto={t.auto} options={LINE_GAP_OPTIONS} onChange={(lineGap) => update({ lineGap })} />}
            </div>
          </fieldset>

          <fieldset>
            <legend>{t.layout}</legend>
            <label className={styles.field}>
              <span>{t.layout}</span>
              <select value={state.layout} onChange={(e) => update({ layout: e.target.value as LetteringRequest["layout"] })}>
                {LAYOUT_OPTIONS.map((layout) => (
                  <option key={layout} value={layout}>
                    {t.layouts[layout]}
                  </option>
                ))}
              </select>
            </label>
            {lines > 1 && state.layout !== "squares" && (
              <label className={styles.field}>
                <span>{t.align}</span>
                <select value={state.align ?? "center"} onChange={(e) => update({ align: e.target.value === "center" ? undefined : (e.target.value as LetteringRequest["align"]) })}>
                  {ALIGN_OPTIONS.map((align) => (
                    <option key={align} value={align}>
                      {t.aligns[align]}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className={styles.fieldRow}>
              <NumberSelect label={t.margin} value={state.margin} options={range(MARGIN_RANGE.min, MARGIN_RANGE.max)} onChange={(margin) => update({ margin: margin ?? state.margin })} />
              <NumberSelect label={t.border} value={state.border} options={BORDER_OPTIONS} onChange={(border) => update({ border: border ?? state.border })} />
            </div>
          </fieldset>

          <fieldset>
            <legend>{t.colors}</legend>
            <div className={styles.colors}>
              {ROLES.map((role, i) => (
                <label key={role} className={styles.color}>
                  <ColorInput value={state.colors[i]} onChange={(picked) => update({ colors: state.colors.map((c, n) => (n === i ? picked : c)) as LetteringRequest["colors"] })} />
                  {t.colorRoles[role]}
                </label>
              ))}
            </div>
            <PalettePicker locale={locale} current={state.colors} onApply={(c) => update({ colors: [c[0], c[1] ?? c[0], c[2] ?? c[1] ?? c[0]] })} />
          </fieldset>
        </form>
      </div>

      {result && !current && (
        <div className={styles.results}>
          <section>
            <h2>{result.summary.heading}</h2>
            <ul className={styles.written}>
              {result.summary.lines.map((line, i) => (
                <li key={i}>
                  {line.label && <strong>{line.label}: </strong>}
                  {line.text}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2>{t.amounts[result.technique]}</h2>
            <table className={styles.yardage}>
              <thead>
                <tr>
                  <th scope="col">{t.colorColumn}</th>
                  <th scope="col">{t.countColumn[result.technique]}</th>
                  <th scope="col">{t.amountColumn[result.technique]}</th>
                  {result.technique === "c2c" && <th scope="col">{t.bobbinsColumn}</th>}
                </tr>
              </thead>
              <tbody>
                {result.colors.map((c) => (
                  <tr key={c.letter}>
                    <th scope="row">
                      <span className={styles.swatch} style={{ background: c.color }} aria-hidden />
                      {c.letter}: {t.colorRoles[c.role].replace(/ \(.\)$/, "")}
                    </th>
                    <td>{c.units.toLocaleString(locale === "pt" ? "pt-BR" : locale)}</td>
                    <td>{c.amount}</td>
                    {result.technique === "c2c" && <td>{c.bobbins}</td>}
                  </tr>
                ))}
                {result.technique !== "quilt" && (
                  <tr>
                    <th scope="row">{t.totalRow}</th>
                    <td>{result.colors.reduce((sum, c) => sum + c.units, 0).toLocaleString(locale === "pt" ? "pt-BR" : locale)}</td>
                    <td>{result.totalYards}</td>
                    {result.technique === "c2c" && <td>{result.colors.reduce((sum, c) => sum + (c.bobbins ?? 0), 0)}</td>}
                  </tr>
                )}
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

/** Inches as the API writes them: whole numbers, or halves as 1 1/2. */
function inchesText(value: number): string {
  const eighths = Math.round(value * 8);
  const whole = Math.floor(eighths / 8);
  const rest = eighths % 8;
  if (!rest) return String(whole);
  const d = rest % 4 === 0 ? 2 : rest % 2 === 0 ? 4 : 8;
  const fraction = `${rest / (8 / d)}/${d}`;
  return whole ? `${whole} ${fraction}` : fraction;
}
