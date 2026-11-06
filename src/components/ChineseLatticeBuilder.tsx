"use client";

import { useEffect, useState } from "react";
import { generateChineseLattice, generateChineseLatticePdf, type ChineseLatticeRequest, type LatticeColors, type LatticeEdge, type Locale } from "@/lib/generator";
import { downloadBytes, downloadPng, downloadSvg } from "@/lib/download";
import { useTrackCustomize } from "@/lib/analytics";
import { fill, messages } from "@/lib/i18n";
import { BAR_OPTIONS, COUNT_OPTIONS, DENSITY_OPTIONS, DEPTH_OPTIONS, EDGE_OPTIONS, FRAMEWORK_OPTIONS, MAX_SEED, REPEAT_OPTIONS, serializeChineseLatticeState } from "@/lib/chineseLatticeState";
import text from "@/i18n/messages/chineseLattice.json";
import { ToolLoading } from "./ToolLoading";
import { useLiveResult } from "@/lib/useLiveResult";
import { OptionNav, useOptionNavigation } from "./OptionNav";
import { PalettePicker } from "./PalettePicker";
import { rememberSeed, syncShareLink } from "@/lib/toolOptions";
import styles from "./BlockBuilder.module.css";

type View = "pattern" | "repeat" | "panel";

function NumberSelect({ label, value, options, format = String, onChange }: { label: string; value: number; options: number[]; format?: (value: number) => string; onChange: (value: number) => void }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {options.map((option) => (
          <option key={option} value={option}>
            {format(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

const COLOR_ROLES: (keyof LatticeColors)[] = ["background", "line", "accent"];

export function ChineseLatticeBuilder({ locale, option, labels, initialState }: { locale: Locale; option?: string; labels: Record<string, string>; initialState: ChineseLatticeRequest }) {
  const t = text[locale];
  const b = messages(locale).builder;
  const goToOption = useOptionNavigation("chineseLattice", locale);
  const [state, setState] = useState(initialState);
  useTrackCustomize("chineseLattice", state);
  const [view, setView] = useState<View>("pattern");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<ChineseLatticeRequest>) => setState((s) => ({ ...s, ...patch }));
  const setColor = (role: keyof LatticeColors, color: string) => setState((s) => ({ ...s, colors: { ...s.colors, [role]: color } }));

  const result = useLiveResult(generateChineseLattice, state, setStatus, b.updateError);

  useEffect(() => {
    syncShareLink(serializeChineseLatticeState(state), "chineseLattice", option);
    if (state.framework === "ice-ray") rememberSeed("chineseLattice", state.seed);
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

  const { repeat, panel } = result?.svg ?? { repeat: "", panel: "" };
  const views: [View, string][] = [["pattern", t.viewPattern], ["repeat", t.viewRepeat], ["panel", t.viewPanel]];
  const notes: Record<View, string> = { pattern: t.patternNote, repeat: t.repeatNote, panel: t.panelNote };
  const isIce = state.framework === "ice-ray";
  const file = `chinese-lattice-${state.framework}`;
  // Two repeats across the square preview, so the joins are on show.
  const tileSize = "50% auto";

  return (
    <div className={styles.builder}>
      <OptionNav tool="chineseLattice" locale={locale} current={option} labels={labels} />
      <div className={styles.workspace}>
        <section className={styles.preview} aria-label={b.preview}>
          <div className={`${styles.tabs} no-print`} role="group" aria-label={b.previewType}>
            {views.map(([id, label]) => (
              <button key={id} type="button" aria-pressed={view === id} className={view === id ? styles.tabOn : styles.tab} onClick={() => setView(id)}>
                {label}
              </button>
            ))}
          </div>
          {!result ? (
            <ToolLoading locale={locale} />
          ) : view === "pattern" ? (
            <div className={styles.tile} style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(repeat)}")`, backgroundSize: tileSize }} role="img" aria-label={fill(t.patternAlt, { name: result.name })} />
          ) : (
            <div className={`${styles.art} ${styles.quiltArt}`} dangerouslySetInnerHTML={{ __html: view === "repeat" ? repeat : panel }} />
          )}
          <p className={styles.note}>{notes[view]}</p>
          <div className={`${styles.actions} no-print`}>
            <button type="button" disabled={busy} className={styles.primary} onClick={() => run(b.pdfMaking, b.pdfDone, async () => downloadBytes(await generateChineseLatticePdf(state), `${file}.pdf`, "application/pdf"))}>
              {t.downloadPdf}
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(repeat, `${file}-repeat.svg`))}>
              {t.svgRepeat}
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(repeat, `${file}-repeat.png`))}>
              {t.pngRepeat}
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.saving, b.svgDone, () => downloadSvg(panel, `${file}-panel.svg`))}>
              {t.svgPanel}
            </button>
            <button type="button" disabled={busy || !result} className={styles.secondary} onClick={() => run(b.pngMaking, b.pngDone, () => downloadPng(panel, `${file}-panel.png`))}>
              {t.pngPanel}
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
              <span>{t.framework}</span>
              <select value={state.framework} onChange={(e) => goToOption(e.target.value)}>
                {FRAMEWORK_OPTIONS.map((id) => (
                  <option key={id} value={id}>
                    {t.frameworks[id]}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.fieldRow}>
              <NumberSelect label={t.barWidth} value={state.barWidth} options={BAR_OPTIONS} format={(n) => `${n}%`} onChange={(barWidth) => update({ barWidth })} />
              <NumberSelect label={isIce ? t.densityIce : t.density} value={state.density} options={DENSITY_OPTIONS} onChange={(density) => update({ density })} />
            </div>
            <div className={styles.fieldRow}>
              <NumberSelect label={t.depth} value={state.depth} options={DEPTH_OPTIONS} format={(n) => (n === 0 ? t.depthNone : String(n))} onChange={(depth) => update({ depth })} />
              <label className={styles.field}>
                <span>{t.edge}</span>
                <select value={state.edge} onChange={(e) => update({ edge: e.target.value as LatticeEdge })}>
                  {EDGE_OPTIONS.map((id) => (
                    <option key={id} value={id}>
                      {t.edges[id]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {isIce && (
              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span>{t.seed}</span>
                  <input type="number" min={0} max={MAX_SEED} value={state.seed} onChange={(e) => update({ seed: Math.min(MAX_SEED, Math.max(0, Math.floor(Number(e.target.value)) || 0)) })} />
                </label>
                <button type="button" className={styles.tab} onClick={() => update({ seed: Math.floor(Math.random() * (MAX_SEED + 1)) })}>
                  {t.shuffle}
                </button>
              </div>
            )}
          </fieldset>

          <fieldset>
            <legend>{t.colors}</legend>
            <div className={styles.colors}>
              {COLOR_ROLES.map((role) => (
                <label key={role} className={styles.field}>
                  <span>{t[role]}</span>
                  <input type="color" value={state.colors[role]} onChange={(e) => setColor(role, e.target.value)} />
                </label>
              ))}
            </div>
            <p className={styles.note}>{t.paletteNote}</p>
            <PalettePicker locale={locale} current={[state.colors.background, state.colors.line, state.colors.accent]} onApply={(c) => update({ colors: { background: c[0], line: c[1], accent: c[2] ?? c[1] } })} />
          </fieldset>

          <fieldset>
            <legend>{t.size}</legend>
            <NumberSelect label={t.repeatWidth} value={state.repeatWidth} options={REPEAT_OPTIONS} format={(n) => `${n}"`} onChange={(repeatWidth) => update({ repeatWidth })} />
            <div className={styles.fieldRow}>
              <NumberSelect label={t.across} value={state.across} options={COUNT_OPTIONS} onChange={(across) => update({ across })} />
              <NumberSelect label={t.down} value={state.down} options={COUNT_OPTIONS} onChange={(down) => update({ down })} />
            </div>
          </fieldset>
        </form>
      </div>

      <p className={styles.notice}>
        <strong>{t.aboutTitle}</strong> {t.about} {isIce ? t.aboutIce : ""}
      </p>

      {result ? (
        <div className={styles.results}>
          <section>
            <h2>{t.details}</h2>
            <p>{result.name}</p>
            <p className={styles.note}>{fill(t.stats, { openings: result.openings, frames: result.frames, bar: result.barWidth, feet: result.barFeet })}</p>
            <ul>
              {result.notes.map((line) => (
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
            <p className={styles.note}>{fill(t.panelSize, { across: state.across, down: state.down, w: result.panelWidth, h: result.panelHeight })}</p>
          </section>
        </div>
      ) : null}
    </div>
  );
}
