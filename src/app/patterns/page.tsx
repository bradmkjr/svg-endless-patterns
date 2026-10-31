import type { Metadata } from "next";
import { PatternLibrary } from "@/components/PatternLibrary";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pattern Library",
  description: "Explore pattern makers for quilting, Celtic knots, geometric stars, tessellations, tartans, sashiko, counted-thread crafts, and stained glass.",
  alternates: { canonical: absoluteUrl("/patterns/") },
};

export default function PatternsPage() {
  return <PatternLibrary />;
}
