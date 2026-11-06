import copy from "@/i18n/messages/weaving.json";
import type { Locale } from "./generator";
import { optionHref, slugFor, thumbSrc } from "./toolOptions";
import { presetState, serializeWeavingState, WEAVING_PRESETS } from "./weavingState";

export type WeavingDraftLink = { id: string; name: string; href: string; src: string };

/** Every traditional draft: its name, a link that opens the builder with it, and its thumbnail. */
export function weavingDraftLinks(locale: Locale): WeavingDraftLink[] {
  const names = copy[locale].drafts as Record<string, string>;
  return WEAVING_PRESETS.map((preset) => ({
    id: preset.id,
    name: names[preset.id],
    href: optionHref("weaving", locale, slugFor("weaving", preset.structure)!, serializeWeavingState(presetState(preset, locale))),
    src: thumbSrc("weaving", preset.id),
  }));
}
