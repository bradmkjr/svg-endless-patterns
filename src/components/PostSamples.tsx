import { sampleHref, type PostSample } from "@/lib/content";
import type { Locale } from "@/lib/generator";
import { CrochetColorworkSample } from "./CrochetColorworkSample";
import { CheckerboardSample } from "./CheckerboardSample";
import { FractalSample } from "./FractalSample";
import { KnitColorworkSample } from "./KnitColorworkSample";
import { MazeSample } from "./MazeSample";
import { ToolSample } from "./ToolSample";
import { isApiSample } from "@/lib/toolSamples";
import styles from "./Blog.module.css";

export function PostSamples({ items, locale }: { items: PostSample[]; locale: Locale }) {
  return (
    <ul className={styles.samples}>
      {items.map((sample) =>
        sample.kind === "maze" ? (
          <MazeSample key={sampleHref(sample, locale)} sample={sample} locale={locale} />
        ) : sample.kind === "checkerboard" ? (
          <CheckerboardSample key={sampleHref(sample, locale)} sample={sample} locale={locale} />
        ) : sample.kind === "crochetColorwork" ? (
          <CrochetColorworkSample key={sampleHref(sample, locale)} sample={sample} locale={locale} />
        ) : sample.kind === "knitColorwork" ? (
          <KnitColorworkSample key={sampleHref(sample, locale)} sample={sample} locale={locale} />
        ) : sample.kind === "fractal" ? (
          <FractalSample key={sampleHref(sample, locale)} sample={sample} locale={locale} />
        ) : isApiSample(sample) ? (
          <ToolSample key={sampleHref(sample, locale)} sample={sample} locale={locale} />
        ) : null,
      )}
    </ul>
  );
}
