import type { Metadata } from "next";
import { StitchGrid } from "@/components/StitchGrid";
import { getStitchPatterns } from "@/lib/generator";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Crochet Stitch Patterns and Project Calculator",
  description: "Choose a crochet stitch pattern, enter your size and gauge, and get your starting count, row-by-row instructions, a chart and a yarn estimate.",
  alternates: { canonical: absoluteUrl("/crochet/") },
};

export default async function Page() {
  const stitches = await getStitchPatterns("crochet");
  return (
    <div className="page">
      <h1>Crochet stitch patterns</h1>
      <p className="lede">Pick a stitch, then enter your size and gauge to get your numbers, written instructions and a chart. Each swatch shows 4&quot; of fabric.</p>
      <StitchGrid stitches={stitches} />
    </div>
  );
}
