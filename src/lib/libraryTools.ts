import { generateCelticKnot, generateCrossStitch, generateGirih, generateMandala, generateSashiko, generateStainedGlass, generateTessellation, generateTruchet, type Locale } from "./generator";
import { defaultCelticKnotState } from "./celticKnotState";
import { defaultCrossStitchState } from "./crossStitchState";
import { defaultGirihState } from "./girihState";
import { defaultMandalaState } from "./mandalaState";
import { defaultSashikoState } from "./sashikoState";
import { defaultStainedGlassState } from "./stainedGlassState";
import { defaultTessellationState } from "./tessellationState";
import { defaultTruchetState } from "./truchetState";

/** A generator-backed library card: `svg` is a whole design, `tile` a repeat to fill the card with. */
export type LibraryTool = { id: string; href: string; svg?: string; tile?: string; tileSize?: string };

export async function libraryTools(locale: Locale): Promise<LibraryTool[]> {
  const [crossStitch, tessellation, sashiko, celtic, glass, mandala, girih, truchet] = await Promise.all([
    generateCrossStitch(defaultCrossStitchState(locale)),
    generateTessellation(defaultTessellationState(locale)),
    generateSashiko({ ...defaultSashikoState(locale), width: 6, height: 6 }),
    generateCelticKnot(defaultCelticKnotState(locale)),
    generateStainedGlass(defaultStainedGlassState(locale)),
    generateMandala(defaultMandalaState(locale)),
    generateGirih(defaultGirihState(locale)),
    generateTruchet(defaultTruchetState(locale)),
  ]);
  return [
    { id: "crossStitch", href: "/cross-stitch/", svg: crossStitch.svg.stitched },
    { id: "tessellation", href: "/tessellations/", tile: tessellation.svg.repeat },
    { id: "sashiko", href: "/sashiko/", svg: sashiko.svg.panel },
    { id: "celticKnot", href: "/celtic-knots/", svg: celtic.svg.art },
    { id: "stainedGlass", href: "/stained-glass/", svg: glass.svg.panel },
    { id: "mandala", href: "/mandalas/", svg: mandala.svg.art },
    // The girih repeat is wider than tall, so it's sized by height.
    { id: "girih", href: "/girih/", tile: girih.svg.repeat, tileSize: "auto 100%" },
    { id: "truchet", href: "/truchet/", tile: truchet.svg.repeat, tileSize: "100% auto" },
  ];
}
