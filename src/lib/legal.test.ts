import { describe, expect, it } from "vitest";
import text from "@/i18n/messages/legal.json";

const links = (value: unknown) => [...JSON.stringify(value).matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
const shape = (page: typeof text.en.privacy) => page.sections.map((s) => [s.body.length, "items" in s ? (s.items as string[]).length : 0]);

describe.each(["es", "fr", "de", "pt"] as const)("%s legal pages", (locale) => {
  it.each(["privacy", "terms"] as const)("%s matches English section for section, keeping its links", (page) => {
    expect(shape(text[locale][page])).toEqual(shape(text.en[page]));
    expect(links(text[locale][page])).toEqual(links(text.en[page]));
  });

  it("keeps the date placeholder", () => {
    expect(text[locale].updated).toContain("{date}");
  });
});
