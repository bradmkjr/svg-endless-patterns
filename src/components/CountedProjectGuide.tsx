import { fill } from "@/lib/i18n";
import styles from "./BlockBuilder.module.css";
import css from "./CrossStitchBuilder.module.css";

/** A labeled dropdown of numbers, as both counted-thread builders use. */
export function NumberSelect({ label, value, options, unit = "", onChange }: { label: string; value: number; options: number[]; unit?: string; onChange: (value: number) => void }) {
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

type GuideText = {
  guide: string;
  materials: string;
  stepsTitle: string;
  stitchOrder: string;
  finishing: string;
  colorList: string;
  symbol: string;
  color: string;
  stitches: string;
  strandsColumn: string;
  yards: string;
  skeins: string;
  sheetsNote: string;
};

type GuideResult = {
  materials: string[];
  steps: string[];
  order: string[];
  finishing: string[];
  sheets: number;
  colors: { symbol: string; color: string; stitches: number; strands: number; yards: number; skeins: number }[];
};

/** The written project: materials, steps, stitching order, finishing and thread per color. */
export function CountedProjectGuide({ t, result, sizeLines, note }: { t: GuideText; result: GuideResult; sizeLines: string[]; note: string }) {
  return (
    <div className={styles.results}>
      <section>
        <h2>{t.guide}</h2>
        {sizeLines.map((line) => (
          <p key={line} className={styles.quiltSize}>
            {line}
          </p>
        ))}
        <h3>{t.materials}</h3>
        <ul>
          {result.materials.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <h3>{t.stepsTitle}</h3>
        <ol className={styles.steps}>
          {result.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <h3>{t.stitchOrder}</h3>
        <ol className={styles.steps}>
          {result.order.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
        <h3>{t.finishing}</h3>
        <ol className={styles.steps}>
          {result.finishing.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section>
        <h2>{t.colorList}</h2>
        <table className={styles.yardage}>
          <thead>
            <tr>
              <th scope="col">{t.symbol}</th>
              <th scope="col">{t.color}</th>
              <th scope="col" style={{ textAlign: "right" }}>
                {t.stitches}
              </th>
              <th scope="col" style={{ textAlign: "right" }}>
                {t.strandsColumn}
              </th>
              <th scope="col" style={{ textAlign: "right" }}>
                {t.yards}
              </th>
              <th scope="col" style={{ textAlign: "right" }}>
                {t.skeins}
              </th>
            </tr>
          </thead>
          <tbody>
            {result.colors.map((c) => (
              <tr key={c.symbol}>
                <th scope="row" className={css.symbol}>
                  {c.symbol}
                </th>
                <td style={{ textAlign: "left", fontWeight: 400 }}>
                  <span className={styles.swatch} style={{ background: c.color }} aria-hidden />
                  {c.color}
                </td>
                <td>{c.stitches}</td>
                <td>{c.strands}</td>
                <td>{c.yards}</td>
                <td>{c.skeins}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={styles.note}>{note}</p>
        {result.sheets > 1 && <p className={styles.note}>{fill(t.sheetsNote, { n: result.sheets })}</p>}
      </section>
    </div>
  );
}
