import type { PostSample } from "./content";
import { generateNeedlepoint } from "./generator";
import { parseNeedlepointState } from "./needlepointState";
import { generateCrossStitch } from "./generator";
import { parseCrossStitchState } from "./crossStitchState";
import { generateMandala } from "./generator";
import { parseMandalaState } from "./mandalaState";
import { generateStainedGlass } from "./generator";
import { parseStainedGlassState } from "./stainedGlassState";
import { generateGirih } from "./generator";
import { parseGirihState } from "./girihState";
import { generateTessellation } from "./generator";
import { parseTessellationState } from "./tessellationState";
import { generateCelticKnot } from "./generator";
import { parseCelticKnotState } from "./celticKnotState";
import { generateSashiko } from "./generator";
import { parseSashikoState } from "./sashikoState";
import { generateTieDye } from "./generator";
import { parseTieDyeState } from "./tieDyeState";
import { generateTartan } from "./generator";
import { parseTartanState } from "./tartanState";
import { generateTruchet } from "./generator";
import { parseTruchetState } from "./truchetState";
import { generateLife } from "./generator";
import { parseLifeState } from "./lifeState";
import type { Locale } from "./generator";

type Svgs = { svg: Record<string, string> };
type Draw = (params: URLSearchParams, locale: Locale) => Promise<Svgs>;

/** Blog samples whose pictures come from the API, drawn in the reader's browser. */
const DRAW: Partial<Record<PostSample["kind"], Draw>> = {
  life: async (p, locale) => generateLife(parseLifeState(p, locale)),
  truchet: async (p, locale) => generateTruchet(parseTruchetState(p, locale)),
  tartan: async (p, locale) => generateTartan(parseTartanState(p, locale)),
  tieDye: async (p, locale) => generateTieDye(parseTieDyeState(p, locale)),
  sashiko: async (p, locale) => generateSashiko(parseSashikoState(p, locale)),
  celtic: async (p, locale) => generateCelticKnot(parseCelticKnotState(p, locale)),
  tessellation: async (p, locale) => generateTessellation(parseTessellationState(p, locale)),
  girih: async (p, locale) => generateGirih(parseGirihState(p, locale)),
  stainedGlass: async (p, locale) => generateStainedGlass(parseStainedGlassState(p, locale)),
  mandala: async (p, locale) => generateMandala(parseMandalaState(p, locale)),
  crossStitch: async (p, locale) => generateCrossStitch(parseCrossStitchState(p, locale)),
  needlepoint: async (p, locale) => generateNeedlepoint(parseNeedlepointState(p, locale)),
};

export const isApiSample = (sample: PostSample) => sample.kind in DRAW;

export async function drawSample(sample: PostSample, locale: Locale): Promise<string> {
  const { svg } = await DRAW[sample.kind]!(new URLSearchParams(sample.query), locale);
  return svg[sample.view ?? "swatch"];
}
