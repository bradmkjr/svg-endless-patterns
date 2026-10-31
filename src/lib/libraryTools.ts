import { generateCelticKnot, generateCrossStitch, generateMandala, generateSashiko, generateStainedGlass, generateTessellation, type Locale } from "./generator";
import { defaultCelticKnotState } from "./celticKnotState";
import { defaultCrossStitchState } from "./crossStitchState";
import { defaultMandalaState } from "./mandalaState";
import { defaultSashikoState } from "./sashikoState";
import { defaultStainedGlassState } from "./stainedGlassState";
import { defaultTessellationState } from "./tessellationState";

/** A generator-backed library card: `svg` is a whole design, `tile` a repeat to fill the card with. */
export type LibraryTool = { id: string; href: string; svg?: string; tile?: string };

export async function libraryTools(locale: Locale): Promise<LibraryTool[]> {
  const [crossStitch, tessellation, sashiko, celtic, glass, mandala] = await Promise.all([
    generateCrossStitch(defaultCrossStitchState(locale)),
    generateTessellation(defaultTessellationState(locale)),
    generateSashiko({ ...defaultSashikoState(locale), width: 6, height: 6 }),
    generateCelticKnot(defaultCelticKnotState(locale)),
    generateStainedGlass(defaultStainedGlassState(locale)),
    generateMandala(defaultMandalaState(locale)),
  ]);
  return [
    { id: "crossStitch", href: "/cross-stitch/", svg: crossStitch.svg.stitched },
    { id: "tessellation", href: "/tessellations/", tile: tessellation.svg.repeat },
    { id: "sashiko", href: "/sashiko/", svg: sashiko.svg.panel },
    { id: "celticKnot", href: "/celtic-knots/", svg: celtic.svg.art },
    { id: "stainedGlass", href: "/stained-glass/", svg: glass.svg.panel },
    { id: "mandala", href: "/mandalas/", svg: mandala.svg.art },
  ];
}
