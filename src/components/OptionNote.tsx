import type { Locale } from "@/lib/generator";
import { optionNote, type ToolId } from "@/lib/toolOptions";

/** On a choice's own page, what sets that choice apart, in the static HTML under the lede. */
export function OptionNote({ tool, option, locale }: { tool: ToolId; option?: string; locale: Locale }) {
  const note = option ? optionNote(tool, option, locale) : undefined;
  return note ? <p style={{ marginTop: 0 }}>{note}</p> : null;
}
