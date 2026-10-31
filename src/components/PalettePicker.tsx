"use client";

import { useState } from "react";
import type { Locale } from "@/lib/generator";
import { deletePalette, MAX_NAME, MIN_PALETTE_COLORS, savePalette, useCustomPalettes } from "@/lib/customPalettes";
import { fill } from "@/lib/i18n";
import { HARMONIES, harmonyColors, HUES, THEME_GROUPS } from "@/lib/palettes";
import text from "@/i18n/messages/palettes.json";
import styles from "./BlockBuilder.module.css";
import css from "./PalettePicker.module.css";

function Swatches({ name, colors, label, onClick }: { name: string; colors: string[]; label: string; onClick: () => void }) {
  return (
    <button type="button" className={styles.palette} title={name} aria-label={label} onClick={onClick}>
      {colors.map((color, i) => (
        <span key={i} style={{ background: color }} />
      ))}
    </button>
  );
}

/**
 * The palette library and saved palettes, for any builder. A palette is an ordered
 * list of colors: `onApply` places them on the tool, and `current` is what "save" keeps.
 */
export function PalettePicker({ locale, current, onApply }: { locale: Locale; current: string[]; onApply: (colors: string[]) => void }) {
  const t = text[locale];
  const mine = useCustomPalettes();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [failed, setFailed] = useState(false);
  const unique = [...new Set(current)];

  const save = () => {
    const saved = savePalette(name, unique);
    setFailed(!saved);
    if (saved) setName("");
  };

  return (
    <details className={css.picker} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>{t.title}</summary>
      {/* Drawn on opening: there are over a hundred palettes, and most visits never need them. */}
      {open && (
        <div className={css.body}>
          <h3>{t.mine}</h3>
          {mine.length === 0 && <p className={styles.note}>{t.empty}</p>}
          <ul className={css.mine}>
            {mine.map((palette) => (
              <li key={palette.id}>
                <Swatches name={palette.name} colors={palette.colors} label={fill(t.use, { name: palette.name })} onClick={() => onApply(palette.colors)} />
                <span>{palette.name}</span>
                <button type="button" className={styles.tab} aria-label={fill(t.remove, { name: palette.name })} onClick={() => deletePalette(palette.id)}>
                  {t.deleteShort}
                </button>
              </li>
            ))}
          </ul>
          <div className={css.save}>
            <input type="text" aria-label={t.name} placeholder={t.name} maxLength={MAX_NAME} value={name} onChange={(e) => setName(e.target.value)} />
            <button type="button" className={styles.tab} disabled={!name.trim() || unique.length < MIN_PALETTE_COLORS} onClick={save}>
              {t.saveCurrent}
            </button>
          </div>
          {failed && <p className={styles.note}>{t.storageError}</p>}

          <h3>{t.themes}</h3>
          {THEME_GROUPS.map((group) => (
            <div key={group.id} className={css.group}>
              <h4>{t.groups[group.id]}</h4>
              <div className={styles.palettes}>
                {group.palettes.map((palette) => (
                  <Swatches key={palette.id} name={t.names[palette.id]} colors={palette.colors} label={fill(t.use, { name: t.names[palette.id] })} onClick={() => onApply(palette.colors)} />
                ))}
              </div>
            </div>
          ))}

          <h3>{t.harmonies}</h3>
          {HARMONIES.map((harmony) => (
            <div key={harmony} className={css.group}>
              <h4>{t.harmonyNames[harmony]}</h4>
              <div className={styles.palettes}>
                {HUES.map((hue) => {
                  const label = fill(t.harmonyName, { harmony: t.harmonyNames[harmony], hue: t.hues[hue.id] });
                  const colors = harmonyColors(harmony, hue.degrees);
                  return <Swatches key={hue.id} name={label} colors={colors} label={fill(t.use, { name: label })} onClick={() => onApply(colors)} />;
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </details>
  );
}
