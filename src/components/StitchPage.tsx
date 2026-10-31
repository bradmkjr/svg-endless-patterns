import Link from "next/link";
import { generateStitchPattern, type StitchInfo } from "@/lib/generator";
import { CRAFT_NAMES, CRAFT_PATHS, defaultStitchState } from "@/lib/stitchState";
import { StitchBuilderRoute } from "./StitchBuilderRoute";

export async function StitchPage({ stitch }: { stitch: StitchInfo }) {
  const initial = await generateStitchPattern(stitch.slug, defaultStitchState(stitch));
  return (
    <div className="page">
      <p className="no-print" style={{ margin: "0 0 0.5rem", color: "var(--muted)", fontSize: "0.9rem" }}>
        <Link href={`${CRAFT_PATHS[stitch.craft]}/`}>{CRAFT_NAMES[stitch.craft]}</Link> / {stitch.level}
      </p>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(2rem, 4vw, 3rem)" }}>{stitch.name}</h1>
      <p className="lede" style={{ marginTop: 0 }}>
        {stitch.summary}
      </p>
      <StitchBuilderRoute stitch={stitch} initial={initial} />
    </div>
  );
}
