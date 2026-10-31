"use client";

import { useEffect, useState } from "react";
import { generateTessellation, generateTessellationPdf, type GroupId, type Locale, type TessellationColors, type TessellationMotif, type TessellationOptions, type TessellationRequest, type TessellationResult } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { fill, messages } from "@/lib/i18n";
import { COUNT_OPTIONS, REPEAT_OPTIONS, serializeTessellationState, TESSELLATION_PALETTES } from "@/lib/tessellationState";
import text from "@/i18n/messages/tessellation.json";
import styles from "./BlockBuilder.module.css";

type View = "pattern" | "repeat" | "layout";

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

/** Lattice units shown across the square preview, so a motif looks about the same size in any group. */
const PREVIEW_UNITS = 600;

export function TessellationBuilder({ locale, options, initialState, initialResult }: { locale: Locale; options: TessellationOptions; initialState: TessellationRequest; initialResult: TessellationResult }) {
  const t = text[locale];
  const b = messages(locale).builder;
  const [state, setState] = useState(initialState);
  const [result, setResult] = useState(initialResult);
  const [view, setView] = useState<View>("pattern");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<TessellationRequest>) => setState((s) => ({ ...s, ...patch }));
  const setColor = (role: keyof TessellationColors, color: string) => setState((s) => ({ ...s, colors: { ...s.colors, [role]: color } }));

  useEffect(() => {
    let stale = false;
    generateTessellation(state).then(
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
    const query = serializeTessellationState(state);
    window.history.replaceState(window.history.state, "", query ? `?${query}` : window.location.pathname);
  }, [state]);

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

  const repeat = result.svg.repeat;
  const repeatUnits = Number(/viewBox="0 0 ([\d.]+) /.exec(repeat)?.[1] ?? PREVIEW_UNITS);
  const views: [View, string][] = [["pattern", t.viewPattern], ["repeat", t.viewRepeat], ["layout", t.viewLayout]];
  const families = [...new Set(options.groups.map((g) => g.family))];

  return (
    <div className={styles.builder}>
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
              aria-label={fill(t.patternAlt, { group: state.group })}
            />
          ) : (
            <div className={`${styles.art} ${styles.quiltArt}`} dangerouslySetInnerHTML={{ __html: view === "repeat" ? repeat : result.svg.layout }} />
          )}
          <p className={styles.note}>{view === "layout" ? t.layoutNote : view === "repeat" ? t.repeatNote : t.patternNote}</p>
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateTessellationPdf(state), `tessellation-${state.group}.pdf`, "application/pdf"))}>
              {t.downloadPdf}
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(repeat, `tessellation-${state.group}-repeat.svg`))}>
              {t.svgRepeat}
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(repeat, `tessellation-${state.group}-repeat.png`))}>
              {t.pngRepeat}
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(result.svg.layout, `tessellation-${state.group}-layout.svg`))}>
              {t.svgLayout}
            </button>
            <button type="button" disabled={busy} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(result.svg.layout, `tessellation-${state.group}-layout.png`))}>
              {t.pngLayout}
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
            <legend>{t.design}</legend>
            <label className={styles.field}>
              <span>{t.group}</span>
              <select value={state.group} onChange={(e) => update({ group: e.target.value as GroupId })}>
                {families.map((family) => (
                  <optgroup key={family} label={family}>
                    {options.groups
                      .filter((g) => g.family === family)
                      .map((g) => (
                        <option key={g.id} value={g.id}>{`${g.id}: ${g.description}`}</option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>{t.motif}</span>
              <select value={state.motif} onChange={(e) => update({ motif: e.target.value as TessellationMotif })}>
                {options.motifs.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.check}>
              <input type="checkbox" checked={state.outlines} onChange={(e) => update({ outlines: e.target.checked })} />
              {t.outlines}
            </label>
          </fieldset>

          <fieldset>
            <legend>{t.colors}</legend>
            <div className={styles.palettes}>
              {TESSELLATION_PALETTES.map((palette) => (
                <button key={palette.id} type="button" className={styles.palette} title={t.palettes[palette.id]} aria-label={fill(b.usePalette, { name: t.palettes[palette.id] })} onClick={() => update({ colors: palette.colors })}>
                  {[palette.colors.background, palette.colors.primary, palette.colors.accent].map((color) => (
                    <span key={color} style={{ background: color }} />
                  ))}
                </button>
              ))}
            </div>
            <div className={styles.colors}>
              {(["background", "primary", "accent"] as const).map((role) => (
                <label key={role} className={styles.field}>
                  <span>{t[role]}</span>
                  <input type="color" value={state.colors[role]} onChange={(e) => setColor(role, e.target.value)} />
                </label>
              ))}
            </div>
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
        <strong>{t.originalTitle}</strong> {t.originalText}
      </p>

      <div className={styles.results}>
        <section>
          <h2>{fill(t.groupHeading, { group: result.group.id })}</h2>
          <p>{result.group.description}</p>
          <ul>
            {result.symmetry.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2>{t.guide}</h2>
          <ol className={styles.steps}>
            {result.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className={styles.note}>{fill(t.layoutSize, { across: state.across, down: state.down, w: result.layoutWidth, h: result.layoutHeight })}</p>
        </section>
      </div>
    </div>
  );
}
