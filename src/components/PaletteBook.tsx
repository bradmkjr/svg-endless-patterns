"use client";

import { useState } from "react";
import type { Locale } from "@/lib/generator";
import { deletePalette, MAX_NAME, MAX_PALETTE_COLORS, MIN_PALETTE_COLORS, renamePalette, savePalette, useCustomPalettes } from "@/lib/customPalettes";
import { fill } from "@/lib/i18n";
import { HARMONIES, harmonyColors, HUES, THEME_GROUPS } from "@/lib/palettes";
import text from "@/i18n/messages/palettes.json";
import styles from "./BlockBuilder.module.css";
import css from "./PaletteBook.module.css";

const STARTING_COLORS = ["#f4ecdc", "#23395d", "#b5533c", "#7f9ab8"];

function Card({ name, colors, children }: { name: string; colors: string[]; children: React.ReactNode }) {
  return (
    <li className={css.card}>
      <div className={css.strip} aria-hidden>
        {colors.map((color, i) => (
          <span key={i} style={{ background: color }} />
        ))}
      </div>
      <strong>{name}</strong>
      <div className={css.cardActions}>{children}</div>
    </li>
  );
}

/** Browses the library, and makes, names and keeps a visitor's own palettes. */
export function PaletteBook({ locale }: { locale: Locale }) {
  const t = text[locale];
  const mine = useCustomPalettes();
  const [name, setName] = useState("");
  const [colors, setColors] = useState(STARTING_COLORS);
  const [status, setStatus] = useState("");

  const keep = (paletteName: string, palette: string[]) => setStatus(savePalette(paletteName, palette) ? fill(t.keep, { name: paletteName }) : t.storageError);
  const copy = async (paletteName: string, palette: string[]) => {
    try {
      await navigator.clipboard.writeText(palette.join(", "));
      setStatus(fill(t.copied, { name: paletteName }));
    } catch {
      setStatus(palette.join(", "));
    }
  };
  const actions = (paletteName: string, palette: string[]) => (
    <>
      <button type="button" className={styles.tab} aria-label={fill(t.keep, { name: paletteName })} onClick={() => keep(paletteName, palette)}>
        {t.keepShort}
      </button>
      <button type="button" className={styles.tab} onClick={() => copy(paletteName, palette)}>
        {t.copyShort}
      </button>
    </>
  );

  return (
    <>
      <section className={css.section}>
        <h2>{t.mine}</h2>
        <form
          className={css.maker}
          onSubmit={(e) => {
            e.preventDefault();
            if (savePalette(name, colors)) {
              setName("");
              setStatus("");
            } else setStatus(t.storageError);
          }}
        >
          <h3>{t.maker}</h3>
          <input type="text" aria-label={t.name} placeholder={t.name} maxLength={MAX_NAME} value={name} onChange={(e) => setName(e.target.value)} />
          <div className={css.inputs}>
            {colors.map((color, i) => (
              <input key={i} type="color" aria-label={fill(t.color, { n: i + 1 })} value={color} onChange={(e) => setColors(colors.map((c, n) => (n === i ? e.target.value : c)))} />
            ))}
          </div>
          <div className={css.cardActions}>
            <button type="button" className={styles.tab} disabled={colors.length >= MAX_PALETTE_COLORS} onClick={() => setColors([...colors, "#888888"])}>
              {t.addColor}
            </button>
            <button type="button" className={styles.tab} disabled={colors.length <= MIN_PALETTE_COLORS} onClick={() => setColors(colors.slice(0, -1))}>
              {t.removeColor}
            </button>
            <button type="submit" className={styles.tabOn} disabled={!name.trim()}>
              {t.keepShort}
            </button>
          </div>
          <p className={styles.note}>{t.order}</p>
        </form>
        {mine.length === 0 && <p className={styles.note}>{t.empty}</p>}
        <ul className={css.cards}>
          {mine.map((palette) => (
            <Card key={palette.id} name={palette.name} colors={palette.colors}>
              <button
                type="button"
                className={styles.tab}
                aria-label={fill(t.rename, { name: palette.name })}
                onClick={() => {
                  const next = window.prompt(t.name, palette.name);
                  if (next) renamePalette(palette.id, next);
                }}
              >
                {t.renameShort}
              </button>
              <button type="button" className={styles.tab} aria-label={fill(t.remove, { name: palette.name })} onClick={() => deletePalette(palette.id)}>
                {t.deleteShort}
              </button>
              <button type="button" className={styles.tab} onClick={() => copy(palette.name, palette.colors)}>
                {t.copyShort}
              </button>
            </Card>
          ))}
        </ul>
        <p className={styles.status} role="status">
          {status}
        </p>
      </section>

      <section className={css.section}>
        <h2>{t.themes}</h2>
        {THEME_GROUPS.map((group) => (
          <div key={group.id} className={css.group}>
            <h3>{t.groups[group.id]}</h3>
            <ul className={css.cards}>
              {group.palettes.map((palette) => (
                <Card key={palette.id} name={t.names[palette.id]} colors={palette.colors}>
                  {actions(t.names[palette.id], palette.colors)}
                </Card>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className={css.section}>
        <h2>{t.harmonies}</h2>
        {HARMONIES.map((harmony) => (
          <div key={harmony} className={css.group}>
            <h3>{t.harmonyNames[harmony]}</h3>
            <p className={styles.note}>{t.harmonyNotes[harmony]}</p>
            <ul className={css.cards}>
              {HUES.map((hue) => {
                const label = fill(t.harmonyName, { harmony: t.harmonyNames[harmony], hue: t.hues[hue.id] });
                const palette = harmonyColors(harmony, hue.degrees);
                return (
                  <Card key={hue.id} name={t.hues[hue.id]} colors={palette}>
                    {actions(label, palette)}
                  </Card>
                );
              })}
            </ul>
          </div>
        ))}
      </section>
    </>
  );
}
