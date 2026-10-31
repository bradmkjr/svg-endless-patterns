"use client";

import { useEffect, useState } from "react";
import { generateGirih, generateGirihPdf, type GirihColors, type GirihRequest, type GirihResult, type GirihStar, type GirihSymmetry, type Locale } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { fill, messages } from "@/lib/i18n";
import { COUNT_OPTIONS, GIRIH_PALETTES, REPEAT_OPTIONS, serializeGirihState, STARS_FOR, SYMMETRY_OPTIONS, WEIGHT_OPTIONS } from "@/lib/girihState";
import text from "@/i18n/messages/girih.json";
import { OptionNav, useOptionNavigation } from "./OptionNav";
import { PalettePicker } from "./PalettePicker";
import { slugFor, syncShareLink } from "@/lib/toolOptions";
import styles from "./BlockBuilder.module.css";

type View = "pattern" | "repeat" | "panel" | "stencil";

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

/** SVG units shown across the square preview, so a star looks about the same size in any option. */
const PREVIEW_UNITS = 900;
const COLOR_ROLES = ["background", "primary", "accent", "line"] as const;

export function GirihBuilder({ locale, option, labels, initialState, initialResult }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: GirihRequest; initialResult: GirihResult }) {
  const t = text[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("girih", locale);
  const [state, setState] = useState(initialState);
  const [result, setResult] = useState(initialResult);
  const [view, setView] = useState<View>("pattern");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<GirihRequest>) => setState((s) => ({ ...s, ...patch }));
  const setColor = (role: keyof GirihColors, color: string) => setState((s) => ({ ...s, colors: { ...s.colors, [role]: color } }));

  useEffect(() => {
    let stale = false;
    generateGirih(state).then(
      (next) => {
        if (!stale) setResult(next);
      },
      () => {
        if (!stale) setStatus(b.updateError);
      },
    );
    return () => {
      stale = true;
    };
  }, [state, b.updateError]);

  useEffect(() => {
    const query = serializeGirihState(state);
    syncShareLink(query, "girih", option);
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

  const { repeat, panel, stencil } = result.svg;
  const repeatUnits = Number(/viewBox="0 0 ([\d.]+) /.exec(repeat)?.[1] ?? PREVIEW_UNITS);
  const views: [View, string][] = [["pattern", t.viewPattern], ["repeat", t.viewRepeat], ["panel", t.viewPanel], ["stencil", t.viewStencil]];
  const notes: Record<View, string> = { pattern: t.patternNote, repeat: t.repeatNote, panel: t.panelNote, stencil: t.stencilNote };
  const shown = view === "repeat" ? repeat : view === "panel" ? panel : stencil;
  const file = `${result.isGirih ? "girih" : `star-pattern-${state.symmetry}`}-${state.star}`;
  const downloads: [string, string, string][] = [
    [t.svgRepeat, t.pngRepeat, repeat],
    [t.svgPanel, t.pngPanel, panel],
    [t.svgStencil, t.pngStencil, stencil],
  ];
  const suffixes = ["repeat", "panel", "stencil"];

  return (
    <div className={styles.builder}>
      <OptionNav tool="girih" locale={locale} current={option} labels={labels} />
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          <div className={`${styles.tabs} no-print`} role="group" aria-label={b.previewType}>
            {views.map(([id, label]) => (
              <button key={id} type="button" aria-pressed={view === id} className={view === id ? styles.tabOn : styles.tab} onClick={() => setView(id)}>
                {label}
              </button>
            ))}
          </div>
          {view === "pattern" ? (
            <div
              className={styles.tile}
              style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(repeat)}")`, backgroundSize: `${(repeatUnits / PREVIEW_UNITS) * 100}% auto` }}
              role="img"
              aria-label={fill(t.patternAlt, { name: result.name })}
            />
          ) : (
            <div className={`${styles.art} ${styles.quiltArt}`} dangerouslySetInnerHTML={{ __html: shown }} />
          )}
          <p className={styles.note}>{notes[view]}</p>
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateGirihPdf(state), `${file}.pdf`, "application/pdf"))}>
              {t.downloadPdf}
            </button>
            {downloads.flatMap(([svgLabel, pngLabel, svg], i) => [
              <button key={svgLabel} type="button" disabled={busy} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(svg, `${file}-${suffixes[i]}.svg`))}>
                {svgLabel}
              </button>,
              <button key={pngLabel} type="button" disabled={busy} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(svg, `${file}-${suffixes[i]}.png`))}>
                {pngLabel}
              </button>,
            ])}
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
            <legend>{t.design}</legend>
            <label className={styles.field}>
              <span>{t.symmetry}</span>
              <select value={state.symmetry} onChange={(e) => goToOption(slugFor("girih", e.target.value)!)}>
                {SYMMETRY_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n === 10 ? t.symmetryGirih : fill(t.symmetryStar, { n })}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>{t.star}</span>
              <select value={state.star} onChange={(e) => update({ star: e.target.value as GirihStar })}>
                {STARS_FOR[state.symmetry].map((star) => (
                  <option key={star} value={star}>
                    {t.stars[star]}
                  </option>
                ))}
              </select>
            </label>
            <NumberSelect label={t.lineWeight} value={state.lineWeight} options={WEIGHT_OPTIONS} onChange={(lineWeight) => update({ lineWeight })} />
            <label className={styles.check}>
              <input type="checkbox" checked={state.showTiles} onChange={(e) => update({ showTiles: e.target.checked })} />
              {t.showTiles}
            </label>
          </fieldset>

          <fieldset>
            <legend>{t.colors}</legend>
            <div className={styles.palettes}>
              {GIRIH_PALETTES.map((palette) => (
                <button key={palette.id} type="button" className={styles.palette} title={t.palettes[palette.id]} aria-label={fill(b.usePalette, { name: t.palettes[palette.id] })} onClick={() => update({ colors: palette.colors })}>
                  {COLOR_ROLES.map((role) => (
                    <span key={role} style={{ background: palette.colors[role] }} />
                  ))}
                </button>
              ))}
            </div>
            <div className={styles.colors}>
              {COLOR_ROLES.map((role) => (
                <label key={role} className={styles.field}>
                  <span>{t[role]}</span>
                  <input type="color" value={state.colors[role]} onChange={(e) => setColor(role, e.target.value)} />
                </label>
              ))}
            </div>
            <PalettePicker locale={locale} current={[state.colors.background, state.colors.primary, state.colors.accent, state.colors.line]} onApply={(c) => update({ colors: { background: c[0], primary: c[1], accent: c[2] ?? c[1], line: c[3] ?? c[1] } })} />
          </fieldset>

          <fieldset>
            <legend>{t.size}</legend>
            <NumberSelect label={t.repeatWidth} value={state.repeatWidth} options={REPEAT_OPTIONS} unit={'"'} onChange={(repeatWidth) => update({ repeatWidth })} />
            <div className={styles.fieldRow}>
              <NumberSelect label={t.across} value={state.across} options={COUNT_OPTIONS} onChange={(across) => update({ across })} />
              <NumberSelect label={t.down} value={state.down} options={COUNT_OPTIONS} onChange={(down) => update({ down })} />
            </div>
          </fieldset>
        </form>
      </div>

      <p className={styles.notice}>
        <strong>{t.aboutTitle}</strong> {result.isGirih ? t.aboutGirih : t.aboutStar}
      </p>

      <div className={styles.results}>
        <section>
          <h2>{t.details}</h2>
          <p>{result.name}</p>
          <ul>
            {result.notes.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <h2>{t.parts}</h2>
          <table className={styles.yardage}>
            <thead>
              <tr>
                <th scope="col">{t.partHeader}</th>
                <th scope="col" style={{ textAlign: "right" }}>
                  {t.countHeader}
                </th>
              </tr>
            </thead>
            <tbody>
              {result.parts.map((part) => (
                <tr key={part.id}>
                  <th scope="row">{part.name}</th>
                  <td>{part.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2>{t.guide}</h2>
          <ol className={styles.steps}>
            {result.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className={styles.note}>{fill(t.panelSize, { across: state.across, down: state.down, w: result.panelWidth, h: result.panelHeight })}</p>
        </section>
      </div>
    </div>
  );
}
