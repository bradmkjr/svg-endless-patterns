"use client";

import { useEffect, useState } from "react";
import { getMandalaMotifThumbs, type Locale, type MandalaMotif, type MandalaRingSpec } from "@/lib/generator";
import { fill } from "@/lib/i18n";
import { MAX_PLAN_RINGS, MIN_PLAN_RINGS, MOTIF_OPTIONS, moveRing, newRing, REPEAT_OPTIONS, SIZE_OPTIONS } from "@/lib/mandalaState";
import mandalaText from "@/i18n/messages/mandala.json";
import styles from "./BlockBuilder.module.css";
import css from "./MandalaRings.module.css";

/** What's being dragged. Native drag and drop doesn't reach touch screens, so every action also has a control. */
type Drag = { kind: "ring"; index: number } | { kind: "motif"; motif: MandalaMotif };

function ColorChoice({ label, value, colors, none, onChange }: { label: string; value: number | null; colors: string[]; none?: { label: string; color: string }; onChange: (value: number | null) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className={css.choice}>
      <span>{label}</span>
      {none && <button type="button" role="radio" aria-checked={value === null} aria-label={none.label} title={none.label} className={value === null ? css.dotOn : css.dot} style={{ background: none.color }} onClick={() => onChange(null)} />}
      {colors.map((color, i) => {
        const on = value !== null && value % colors.length === i;
        return <button key={i} type="button" role="radio" aria-checked={on} aria-label={`${label} ${i + 1}`} className={on ? css.dotOn : css.dot} style={{ background: color }} onClick={() => onChange(i)} />;
      })}
    </div>
  );
}

export function MandalaRings({ locale, plan, colors, background, onChange }: { locale: Locale; plan: MandalaRingSpec[]; colors: string[]; background: string; onChange: (plan: MandalaRingSpec[]) => void }) {
  const t = mandalaText[locale];
  const [thumbs, setThumbs] = useState<Partial<Record<MandalaMotif, string>>>({});
  const [drag, setDrag] = useState<Drag | null>(null);
  const [over, setOver] = useState<number | null>(null);

  useEffect(() => {
    let stale = false;
    getMandalaMotifThumbs().then(
      (svgs) => {
        if (!stale) setThumbs(Object.fromEntries(MOTIF_OPTIONS.map((motif) => [motif, `data:image/svg+xml,${encodeURIComponent(svgs[motif])}`])));
      },
      () => {
        // The choices still work by name without their pictures.
      },
    );
    return () => {
      stale = true;
    };
  }, []);

  const change = (index: number, patch: Partial<MandalaRingSpec>) => onChange(plan.map((ring, i) => (i === index ? { ...ring, ...patch } : ring)));
  const drop = (index: number) => {
    if (drag?.kind === "ring") onChange(moveRing(plan, drag.index, index));
    if (drag?.kind === "motif") change(index, { motif: drag.motif });
    setDrag(null);
    setOver(null);
  };

  return (
    <fieldset>
      <legend>{t.ringBuilder}</legend>
      <p className={styles.note}>{t.ringBuilderNote}</p>
      <h3 className={css.heading}>{t.motifTray}</h3>
      <ul className={css.tray}>
        {MOTIF_OPTIONS.map((motif) => (
          <li key={motif} draggable title={t.motifNames[motif]} className={css.chip} onDragStart={() => setDrag({ kind: "motif", motif })} onDragEnd={() => setDrag(null)}>
            {thumbs[motif] && (
              // eslint-disable-next-line @next/next/no-img-element -- a generated data URI
              <img src={thumbs[motif]} alt="" draggable={false} width={32} height={32} />
            )}
            <span>{t.motifNames[motif]}</span>
          </li>
        ))}
      </ul>

      <ol className={css.rings}>
        {plan.map((ring, index) => (
          <li
            key={index}
            draggable
            className={over === index ? css.ringOver : css.ring}
            onDragStart={() => setDrag({ kind: "ring", index })}
            onDragEnd={() => {
              setDrag(null);
              setOver(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(index);
            }}
            onDragLeave={() => setOver((current) => (current === index ? null : current))}
            onDrop={(e) => {
              e.preventDefault();
              drop(index);
            }}
          >
            <div className={css.ringHead}>
              <span className={css.grip} aria-hidden>
                ⠿
              </span>
              <strong>{index + 1}</strong>
              {thumbs[ring.motif] && (
                // eslint-disable-next-line @next/next/no-img-element -- a generated data URI
                <img src={thumbs[ring.motif]} alt="" draggable={false} width={32} height={32} />
              )}
              <select aria-label={t.motif} value={ring.motif} onChange={(e) => change(index, { motif: e.target.value as MandalaMotif })}>
                {MOTIF_OPTIONS.map((motif) => (
                  <option key={motif} value={motif}>
                    {t.motifNames[motif]}
                  </option>
                ))}
              </select>
              <span className={css.buttons}>
                <button type="button" aria-label={fill(t.moveIn, { n: index + 1 })} title={fill(t.moveIn, { n: index + 1 })} disabled={index === 0} onClick={() => onChange(moveRing(plan, index, index - 1))}>
                  ↑
                </button>
                <button type="button" aria-label={fill(t.moveOut, { n: index + 1 })} title={fill(t.moveOut, { n: index + 1 })} disabled={index === plan.length - 1} onClick={() => onChange(moveRing(plan, index, index + 1))}>
                  ↓
                </button>
                <button type="button" aria-label={fill(t.copyRing, { n: index + 1 })} title={fill(t.copyRing, { n: index + 1 })} disabled={plan.length >= MAX_PLAN_RINGS} onClick={() => onChange([...plan.slice(0, index + 1), ring, ...plan.slice(index + 1)])}>
                  ⧉
                </button>
                <button type="button" aria-label={fill(t.removeRing, { n: index + 1 })} title={fill(t.removeRing, { n: index + 1 })} disabled={plan.length <= MIN_PLAN_RINGS} onClick={() => onChange(plan.filter((_, i) => i !== index))}>
                  ×
                </button>
              </span>
            </div>
            <div className={css.ringBody}>
              <label>
                {t.repeat}
                <select value={index === 0 ? 1 : ring.repeat} disabled={index === 0} title={index === 0 ? t.innerNote : undefined} onChange={(e) => change(index, { repeat: Number(e.target.value) })}>
                  {REPEAT_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t.size}
                <select value={ring.size} onChange={(e) => change(index, { size: Number(e.target.value) })}>
                  {[...new Set([...SIZE_OPTIONS, ring.size])]
                    .sort((a, b) => a - b)
                    .map((n) => (
                      <option key={n} value={n}>
                        {n}%
                      </option>
                    ))}
                </select>
              </label>
              <label>
                <input type="checkbox" checked={ring.accent} onChange={(e) => change(index, { accent: e.target.checked })} />
                {t.accent}
              </label>
              <label>
                <input type="checkbox" checked={ring.offset} onChange={(e) => change(index, { offset: e.target.checked })} />
                {t.offset}
              </label>
              <ColorChoice label={t.ringColor} value={ring.color} colors={colors} onChange={(color) => change(index, { color: color ?? 0 })} />
              <ColorChoice label={t.ringBand} value={ring.band} colors={colors} none={{ label: t.noBand, color: background }} onChange={(band) => change(index, { band })} />
            </div>
          </li>
        ))}
      </ol>
      <div className={styles.actions}>
        <button type="button" className={styles.tab} disabled={plan.length >= MAX_PLAN_RINGS} onClick={() => onChange([...plan, newRing(plan)])}>
          {t.addRing}
        </button>
      </div>
      <p className={styles.note}>{t.innerNote}</p>
    </fieldset>
  );
}
