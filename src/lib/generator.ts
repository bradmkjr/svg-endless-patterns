/** The site's only door to pattern generation, all of which runs in the backend API. */
import type { Locale, PatternRequest, PatternResult, StitchRequest, StitchResult } from "./patternTypes";
import type { MazePaperId, MazeRequest, MazeResult } from "./mazeTypes";
import tessellationText from "@/i18n/messages/tessellation.json";
import { apiGetJson, apiJson, apiPdf } from "./api";
import type { CrossStitchRequest, CrossStitchResult } from "./crossStitchTypes";
import type { NeedlepointRequest, NeedlepointResult } from "./needlepointTypes";
import type { MandalaMotif, MandalaRequest, MandalaResult } from "./mandalaTypes";
import type { KaleidoscopeRequest, KaleidoscopeResult } from "./kaleidoscopeTypes";
import type { StainedGlassRequest, StainedGlassResult } from "./stainedGlassTypes";
import type { GirihRequest, GirihResult } from "./girihTypes";
import type { ChineseLatticeRequest, ChineseLatticeResult } from "./chineseLatticeTypes";
import type { TessellationOptions, TessellationRequest, TessellationResult } from "./tessellationTypes";
import type { CelticKnotRequest, CelticKnotResult } from "./celticKnotTypes";
import type { SashikoRequest, SashikoResult } from "./sashikoTypes";
import type { TieDyeRequest, TieDyeResult } from "./tieDyeTypes";
import type { TartanRequest, TartanResult } from "./tartanTypes";
import type { WeavingRequest, WeavingResult } from "./weavingTypes";
import type { TruchetRequest, TruchetResult } from "./truchetTypes";
import type { RdRequest, RdResult } from "./reactionDiffusionTypes";
import type { KolamRequest, KolamResult } from "./kolamTypes";
import type { WavesRequest, WavesResult } from "./wavesTypes";
import type { NatureRequest, NatureResult } from "./natureTypes";
import { mazeApiGet } from "./mazeApi";
import type { CheckerboardRequest, CheckerboardResult } from "./checkerboardTypes";
import type { CrochetColorworkRequest, CrochetColorworkResult } from "./crochetColorworkTypes";
import type { FractalRequest, FractalResult } from "./fractalTypes";
import type { LifeRequest, LifeResult } from "./lifeTypes";
import type { KnitColorworkRequest, KnitColorworkResult } from "./knitColorworkTypes";
import type { PuzzlePaper, PuzzleRequest, PuzzleResult } from "./puzzleTypes";
import type { QuiltRequest, QuiltResult } from "./quiltTypes";
import type { OrigamiRequest, OrigamiResult } from "./origamiTypes";
import type { OrigamiTessellationRequest, OrigamiTessellationResult } from "./origamiTessellationTypes";

export type { BlockInfo, Craft, CutLine, FabricInfo, Locale, PatternRequest, PatternResult, QuiltFinish, Setting, StitchInfo, StitchRequest, StitchResult } from "./patternTypes";
export type { QuiltArrangement, QuiltBatting, QuiltCutMapLine, QuiltQuilting, QuiltRequest, QuiltResult, QuiltWeightPart } from "./quiltTypes";
export type { KnitColorworkPlan, KnitColorworkRequest, KnitColorworkResult, KnitColorworkTechnique } from "./knitColorworkTypes";
export type { CheckerboardRequest, CheckerboardResult, CheckerLayout, CheckerPattern } from "./checkerboardTypes";
export type { PuzzleColors, PuzzleDifficulty, PuzzlePaper, PuzzleRequest, PuzzleResult, PuzzleType } from "./puzzleTypes";
export type { ColorworkTechnique, ColorworkWeight, CrochetColorworkRequest, CrochetColorworkResult } from "./crochetColorworkTypes";
export type { LifeColors, LifeNeighborhood, LifePattern, LifeRequest, LifeResult } from "./lifeTypes";
export type { FractalColors, FractalRequest, FractalResult, FractalType } from "./fractalTypes";
export type { TruchetArrangement, TruchetColors, TruchetRequest, TruchetResult, TruchetStyle } from "./truchetTypes";
export type { RdColors, RdDirection, RdPreset, RdRequest, RdResult, RdStyle } from "./reactionDiffusionTypes";
export type { KolamColors, KolamForm, KolamGrid, KolamLine, KolamRequest, KolamResult, KolamRule } from "./kolamTypes";
export type { WaveColors, WaveFill, WaveFunction, WaveMix, WavesRequest, WavesResult } from "./wavesTypes";
export type { NatureColors, NatureLayout, NatureMotif, NaturePacking, NatureRequest, NatureResult, NatureStyle } from "./natureTypes";
export type { TartanColor, TartanRequest, TartanResult, TartanStripe } from "./tartanTypes";
export type { WeavingRequest, WeavingResult, WeavingStripe, WeavingStructure } from "./weavingTypes";
export type { TieDyeGuide, TieDyeGuideLabel, TieDyeGuideShape, TieDyeLayer, TieDyeMix, TieDyeRequest, TieDyeResult, TieDyeTechnique } from "./tieDyeTypes";
export type { SashikoMotif, SashikoRequest, SashikoResult } from "./sashikoTypes";
export type { CelticBreakPattern, CelticInterlace, CelticKnotRequest, CelticKnotResult, CelticStrand } from "./celticKnotTypes";
export type { TessellationColors, TessellationMotif, TessellationOptions, TessellationRequest, TessellationResult, GroupId } from "./tessellationTypes";
export type { GirihColors, GirihPart, GirihRequest, GirihResult, GirihStar, GirihSymmetry } from "./girihTypes";
export type { ChineseLatticeRequest, ChineseLatticeResult, LatticeColors, LatticeEdge, LatticeFramework } from "./chineseLatticeTypes";
export type { StainedGlassColor, StainedGlassLayout, StainedGlassPiece, StainedGlassRequest, StainedGlassResult } from "./stainedGlassTypes";
export type { MandalaMotif, MandalaRequest, MandalaResult, MandalaRing, MandalaRingSpec, MandalaStyle } from "./mandalaTypes";
export type { KaleidoscopeMirrors, KaleidoscopeRequest, KaleidoscopeResult, KaleidoscopeSource } from "./kaleidoscopeTypes";
export type { CountedFinish, CrossStitchColor, CrossStitchRequest, CrossStitchResult } from "./crossStitchTypes";
export type { NeedlepointColor, NeedlepointRequest, NeedlepointResult, NeedlepointStitch, NeedlepointYarn } from "./needlepointTypes";
export type { OrigamiColors, OrigamiGuide, OrigamiModel, OrigamiPrint, OrigamiRequest, OrigamiResult } from "./origamiTypes";
export type { CreaseColors, OrigamiTessellationRequest, OrigamiTessellationResult, TessellationPattern } from "./origamiTessellationTypes";
export type { MazeAlgorithm, MazeColors, MazeDifficulty, MazePaperId, MazeRequest, MazeResult, MazeShape, MazeSize } from "./mazeTypes";

/** A knitted square's sizes in inches, which the API also checks. */
export const KNIT_SQUARE_SIZES = [6, 8, 10, 12];
export const DEFAULT_KNIT_SQUARE = 8;
export { MAZE_PAPERS, mazeAcross, mazeTallRows } from "./mazeOptions";

export async function generatePattern(slug: string, request: PatternRequest): Promise<PatternResult> {
  return apiJson("/quilt-block", { slug, ...request });
}

export async function generatePdf(slug: string, request: PatternRequest): Promise<Uint8Array> {
  return apiPdf("/quilt-block/pdf", { slug, ...request });
}

/** A whole quilt from a choice of blocks. Its cut map also prints from the page. */
export async function generateQuilt(request: QuiltRequest): Promise<QuiltResult> {
  return apiJson("/quilt", request);
}

/** The whole quilt's printable pattern: picture, fabric, cutting, every block's piecing, assembly and templates. */
export async function generateQuiltPdf(request: QuiltRequest): Promise<Uint8Array> {
  return apiPdf("/quilt/pdf", request);
}

export async function generateStitchPattern(slug: string, request: StitchRequest): Promise<StitchResult> {
  return apiJson("/stitch", { slug, ...request });
}

export async function generateStitchPdf(slug: string, request: StitchRequest): Promise<Uint8Array> {
  return apiPdf("/stitch/pdf", { slug, ...request });
}

export async function generateTartan(request: TartanRequest): Promise<TartanResult> {
  return apiJson("/tartan", request);
}

export async function generateTartanPdf(request: TartanRequest): Promise<Uint8Array> {
  return apiPdf("/tartan/pdf", request);
}

export async function generateWeaving(request: WeavingRequest): Promise<WeavingResult> {
  return apiJson("/weaving", request);
}

export async function generateWeavingPdf(request: WeavingRequest): Promise<Uint8Array> {
  return apiPdf("/weaving/pdf", request);
}

export async function generateCrossStitch(request: CrossStitchRequest): Promise<CrossStitchResult> {
  return apiJson("/cross-stitch", request);
}

export async function generateCrossStitchPdf(request: CrossStitchRequest): Promise<Uint8Array> {
  return apiPdf("/cross-stitch/pdf", request);
}

export async function generateNeedlepoint(request: NeedlepointRequest): Promise<NeedlepointResult> {
  return apiJson("/needlepoint", request);
}

export async function generateNeedlepointPdf(request: NeedlepointRequest): Promise<Uint8Array> {
  return apiPdf("/needlepoint/pdf", request);
}

/** Names only, so pages can list every group without asking the API. */
export async function getTessellationOptions(locale: Locale = "en"): Promise<TessellationOptions> {
  return tessellationText[locale].options as TessellationOptions;
}

export async function generateTessellation(request: TessellationRequest): Promise<TessellationResult> {
  return apiJson("/tessellation", request);
}

export async function generateTessellationPdf(request: TessellationRequest): Promise<Uint8Array> {
  return apiPdf("/tessellation/pdf", request);
}

export async function generateSashiko(request: SashikoRequest): Promise<SashikoResult> {
  return apiJson("/sashiko", request);
}

export async function generateSashikoPdf(request: SashikoRequest): Promise<Uint8Array> {
  return apiPdf("/sashiko/pdf", request);
}

export async function generateCelticKnot(request: CelticKnotRequest): Promise<CelticKnotResult> {
  return apiJson("/celtic-knot", request);
}

export async function generateCelticKnotPdf(request: CelticKnotRequest): Promise<Uint8Array> {
  return apiPdf("/celtic-knot/pdf", request);
}

export async function generateStainedGlass(request: StainedGlassRequest): Promise<StainedGlassResult> {
  return apiJson("/stained-glass", request);
}

export async function generateStainedGlassPdf(request: StainedGlassRequest): Promise<Uint8Array> {
  return apiPdf("/stained-glass/pdf", request);
}

export async function generateMandala(request: MandalaRequest): Promise<MandalaResult> {
  return apiJson("/mandala", request);
}

/** Pictures of every motif, for choosing one, in a single request. */
export async function getMandalaMotifThumbs(): Promise<Record<MandalaMotif, string>> {
  return apiGetJson("/mandala/motifs");
}

export async function generateMandalaPdf(request: MandalaRequest): Promise<Uint8Array> {
  return apiPdf("/mandala/pdf", request);
}

/** The picture at the request's angle. A builder turns it live by updating its `data-turn` element. */
export async function generateKaleidoscope(request: KaleidoscopeRequest): Promise<KaleidoscopeResult> {
  return apiJson("/kaleidoscope", request);
}

export async function generateKaleidoscopePdf(request: KaleidoscopeRequest): Promise<Uint8Array> {
  return apiPdf("/kaleidoscope/pdf", request);
}

export async function generateGirih(request: GirihRequest): Promise<GirihResult> {
  return apiJson("/girih", request);
}

export async function generateGirihPdf(request: GirihRequest): Promise<Uint8Array> {
  return apiPdf("/girih/pdf", request);
}

export async function generateChineseLattice(request: ChineseLatticeRequest): Promise<ChineseLatticeResult> {
  return apiJson("/chinese-lattice", request);
}

export async function generateChineseLatticePdf(request: ChineseLatticeRequest): Promise<Uint8Array> {
  return apiPdf("/chinese-lattice/pdf", request);
}

export async function generateKnitColorwork(request: KnitColorworkRequest): Promise<KnitColorworkResult> {
  const response = await mazeApiGet("/knit-colorwork", request);
  return response.json() as Promise<KnitColorworkResult>;
}

export async function generateKnitColorworkPdf(request: KnitColorworkRequest): Promise<Uint8Array> {
  const response = await mazeApiGet("/knit-colorwork/pdf", request, "application/pdf");
  return new Uint8Array(await response.arrayBuffer());
}

export async function generateCrochetColorwork(request: CrochetColorworkRequest): Promise<CrochetColorworkResult> {
  const response = await mazeApiGet("/crochet-colorwork", request);
  return response.json() as Promise<CrochetColorworkResult>;
}

export async function generateCrochetColorworkPdf(request: CrochetColorworkRequest): Promise<Uint8Array> {
  const response = await mazeApiGet("/crochet-colorwork/pdf", request, "application/pdf");
  return new Uint8Array(await response.arrayBuffer());
}

export async function generatePuzzle(request: PuzzleRequest): Promise<PuzzleResult> {
  const response = await mazeApiGet("/puzzle", request);
  return response.json() as Promise<PuzzleResult>;
}

export async function generatePuzzlePdf(request: PuzzleRequest, { paper = "letter", solution = true }: { paper?: PuzzlePaper; solution?: boolean } = {}): Promise<Uint8Array> {
  const response = await mazeApiGet(`/puzzle/pdf?paper=${paper}&solution=${solution}`, request, "application/pdf");
  return new Uint8Array(await response.arrayBuffer());
}

export async function generatePuzzlePosterPdf(request: PuzzleRequest, paper: MazePaperId): Promise<Uint8Array> {
  const response = await mazeApiGet(`/puzzle/poster-pdf?paper=${encodeURIComponent(paper)}`, request, "application/pdf");
  return new Uint8Array(await response.arrayBuffer());
}

export async function generateCheckerboard(request: CheckerboardRequest): Promise<CheckerboardResult> {
  const response = await mazeApiGet("/checkerboard", request);
  return response.json() as Promise<CheckerboardResult>;
}

export async function generateCheckerboardPdf(request: CheckerboardRequest): Promise<Uint8Array> {
  const response = await mazeApiGet("/checkerboard/pdf", request, "application/pdf");
  return new Uint8Array(await response.arrayBuffer());
}

export async function generateFractal(request: FractalRequest): Promise<FractalResult> {
  const response = await mazeApiGet("/fractal", request);
  return response.json() as Promise<FractalResult>;
}

export async function generateFractalPdf(request: FractalRequest): Promise<Uint8Array> {
  const response = await mazeApiGet("/fractal/pdf", request, "application/pdf");
  return new Uint8Array(await response.arrayBuffer());
}

export async function generateTieDye(request: TieDyeRequest): Promise<TieDyeResult> {
  return apiJson("/tie-dye", request);
}

export async function generateTieDyePdf(request: TieDyeRequest): Promise<Uint8Array> {
  return apiPdf("/tie-dye/pdf", request);
}

export async function generateMaze(request: MazeRequest): Promise<MazeResult> {
  const response = await mazeApiGet("/maze", request);
  return response.json() as Promise<MazeResult>;
}

export async function generateMazePosterPdf(request: MazeRequest, paper: MazePaperId): Promise<Uint8Array> {
  const response = await mazeApiGet(`/maze/poster-pdf?paper=${encodeURIComponent(paper)}`, request, "application/pdf");
  return new Uint8Array(await response.arrayBuffer());
}

export async function generateMazePdf(request: MazeRequest, { solution = true }: { solution?: boolean } = {}): Promise<Uint8Array> {
  const response = await mazeApiGet(`/maze/pdf?solution=${solution}`, request, "application/pdf");
  return new Uint8Array(await response.arrayBuffer());
}

export async function generateMazePng(request: MazeRequest, view: "maze" | "solution", size: number): Promise<Uint8Array> {
  const query = new URLSearchParams({ view, size: String(size) });
  const response = await mazeApiGet(`/maze/png?${query}`, request, "image/png");
  return new Uint8Array(await response.arrayBuffer());
}

export async function generateLife(request: LifeRequest): Promise<LifeResult> {
  return apiJson("/life", request);
}

export async function generateLifePdf(request: LifeRequest): Promise<Uint8Array> {
  return apiPdf("/life/pdf", request);
}

export async function generateTruchet(request: TruchetRequest): Promise<TruchetResult> {
  return apiJson("/truchet", request);
}

export async function generateTruchetPdf(request: TruchetRequest): Promise<Uint8Array> {
  return apiPdf("/truchet/pdf", request);
}

export async function generateReactionDiffusion(request: RdRequest): Promise<RdResult> {
  return apiJson("/reaction-diffusion", request);
}

export async function generateReactionDiffusionPdf(request: RdRequest): Promise<Uint8Array> {
  return apiPdf("/reaction-diffusion/pdf", request);
}

export async function generateKolam(request: KolamRequest): Promise<KolamResult> {
  return apiJson("/kolam", request);
}

export async function generateKolamPdf(request: KolamRequest): Promise<Uint8Array> {
  return apiPdf("/kolam/pdf", request);
}

export async function generateWaves(request: WavesRequest): Promise<WavesResult> {
  return apiJson("/waves", request);
}

export async function generateWavesPdf(request: WavesRequest): Promise<Uint8Array> {
  return apiPdf("/waves/pdf", request);
}

export async function generateNature(request: NatureRequest): Promise<NatureResult> {
  return apiJson("/nature", request);
}

export async function generateNaturePdf(request: NatureRequest): Promise<Uint8Array> {
  return apiPdf("/nature/pdf", request);
}

/** A traditional model's diagrams, step by step, and its folding paper. */
export async function generateOrigami(request: OrigamiRequest): Promise<OrigamiResult> {
  return apiJson("/origami", request);
}

export async function generateOrigamiPdf(request: OrigamiRequest): Promise<Uint8Array> {
  return apiPdf("/origami/pdf", request);
}

/** A folded tessellation's crease pattern. */
export async function generateOrigamiTessellation(request: OrigamiTessellationRequest): Promise<OrigamiTessellationResult> {
  return apiJson("/origami-tessellation", request);
}

export async function generateOrigamiTessellationPdf(request: OrigamiTessellationRequest): Promise<Uint8Array> {
  return apiPdf("/origami-tessellation/pdf", request);
}
