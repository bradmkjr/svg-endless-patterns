import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import text from "@/i18n/messages/acknowledgements.json";
import { REFERENCES } from "./references";

const LOCALES = ["en", "es", "fr", "de", "pt"] as const;
const files = (dir: string): string[] => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? files(path) : [path];
});
const ALLOWED = /w3\.org|localhost|github\.io|schema\.org/;

describe("references", () => {
  it.each(LOCALES)("says what each one is used for in %s", (locale) => {
    for (const reference of REFERENCES) expect(text[locale].usedFor[reference.id]).toBeTruthy();
    expect(Object.keys(text[locale])).toEqual(Object.keys(text.en));
    expect(Object.keys(text[locale].usedFor).sort()).toEqual(REFERENCES.map((r) => r.id).sort());
  });

  it("lists every outside site the code or text links to", () => {
    const listed = REFERENCES.flatMap((r) => (r.url ? [new URL(r.url).hostname.replace(/^www\./, "")] : []));
    for (const file of files("src").filter((f) => /\.(tsx?|json)$/.test(f) && !f.endsWith(".test.ts"))) {
      for (const [url] of readFileSync(file, "utf8").matchAll(/(?:https?:\/\/|\bwww\.|dharmatrading\.com)[\w./-]*/g)) {
        if (ALLOWED.test(url) || url === "https://" || url === "http://") continue;
        const host = url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
        expect(listed, `${file}: ${url}`).toContain(host);
      }
    }
  });
});
