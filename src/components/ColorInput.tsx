"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "@/lib/generator";
import { fill } from "@/lib/i18n";
import { useActiveColors, useReportColor } from "@/lib/activeColors";
import { BASIC_COLORS, complementaryRow, normalizeHex, shade } from "@/lib/swatches";
import text from "@/i18n/messages/colorPicker.json";
import styles from "./ColorInput.module.css";

const LOCALES = Object.keys(text) as Locale[];
const GAP = 6;
const STEP = 8;

/** The page's language, from `<html lang>`, which each root layout sets. */
function pageLocale(): Locale {
  const lang = document.documentElement.lang.slice(0, 2) as Locale;
  return LOCALES.includes(lang) ? lang : "en";
}

/**
 * A color square that opens a panel of large swatches instead of the browser's
 * color wheel: the pattern's own colors followed by complementary suggestions, eighteen
 * plain ones, lighter and darker steps, and the browser's picker for an exact color.
 * Drop-in for `<input type="color">`, but `onChange` gets the color itself.
 */
export function ColorInput({ value, onChange, "aria-label": ariaLabel }: { value: string; onChange: (color: string) => void; "aria-label"?: string }) {
  const id = useId();
  useReportColor(id, value);
  const active = useActiveColors();
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<{ top: number; left: number } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const current = normalizeHex(value) ?? "#000000";

  const close = (refocus: boolean) => {
    setOpen(false);
    setPlace(null);
    if (refocus) trigger.current?.focus();
  };

  // Below the square, or above it when there's no room, and always inside the window.
  useLayoutEffect(() => {
    if (!open) return;
    const position = () => {
      const button = trigger.current?.getBoundingClientRect();
      const box = panel.current?.getBoundingClientRect();
      if (!button || !box) return;
      const below = button.bottom + GAP;
      const top = below + box.height > window.innerHeight - GAP && button.top - GAP - box.height > GAP ? button.top - GAP - box.height : Math.max(GAP, Math.min(below, window.innerHeight - box.height - GAP));
      const left = Math.max(GAP, Math.min(button.left, window.innerWidth - box.width - GAP));
      setPlace({ top, left });
    };
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [open]);

  // Focus the chosen swatch, or the first, once the panel is in place.
  const placed = place !== null;
  useEffect(() => {
    if (!placed) return;
    const target = panel.current?.querySelector<HTMLElement>('[aria-pressed="true"]') ?? panel.current?.querySelector<HTMLElement>("button");
    target?.focus();
  }, [placed]);

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!panel.current?.contains(target) && !trigger.current?.contains(target)) close(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(true);
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const t = open ? text[pageLocale()] : text.en;
  const row = open ? complementaryRow(active) : { used: [], suggested: [] };

  const swatch = (hex: string, name: string, used = false) => (
    <button key={hex} type="button" className={used ? `${styles.swatch} ${styles.used}` : styles.swatch} style={{ background: hex }} title={name} aria-label={fill(t.use, { name })} aria-pressed={hex === current} onClick={() => onChange(hex)} />
  );

  return (
    <>
      <button ref={trigger} type="button" className={styles.trigger} style={{ background: current }} aria-label={ariaLabel} aria-haspopup="dialog" aria-expanded={open} title={current} onClick={() => (open ? close(false) : setOpen(true))} />
      {open &&
        createPortal(
          // A portal, so a click inside the panel never reaches the label around the square.
          <div ref={panel} role="dialog" aria-label={ariaLabel ? `${t.title}: ${ariaLabel}` : t.title} className={styles.panel} style={place ? { top: place.top, left: place.left } : { visibility: "hidden" }}>
            <div className={styles.head}>
              <span className={styles.preview} style={{ background: current }} />
              <strong>{t.title}</strong>
            </div>
            <p className={styles.heading}>{t.matching}</p>
            <div className={styles.grid}>
              {row.used.map((hex) => swatch(hex, `${hex} · ${t.used}`, true))}
              {row.suggested.map((hex) => swatch(hex, hex))}
            </div>
            <p className={styles.heading}>{t.basic}</p>
            <div className={styles.grid}>{BASIC_COLORS.map(({ id: colorId, hex }) => swatch(hex, t.names[colorId]))}</div>
            <p className={styles.heading}>{t.adjust}</p>
            <div className={styles.row}>
              <button type="button" className={styles.step} onClick={() => onChange(shade(current, STEP))}>
                <span style={{ background: shade(current, STEP) }} /> {t.lighter}
              </button>
              <button type="button" className={styles.step} onClick={() => onChange(shade(current, -STEP))}>
                <span style={{ background: shade(current, -STEP) }} /> {t.darker}
              </button>
            </div>
            <div className={styles.row}>
              <label className={styles.exact}>
                <input type="color" value={current} onChange={(e) => onChange(e.target.value)} />
                {t.exact}
              </label>
              <button type="button" className={styles.done} onClick={() => close(true)}>
                {t.done}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
