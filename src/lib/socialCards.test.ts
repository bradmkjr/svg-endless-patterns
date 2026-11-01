import { describe, expect, it } from "vitest";
import { SITE_LOCALES } from "./i18n";
import { cardFile, cardUrl, pageMetadata } from "./pageMetadata";
import { sitePaths } from "./sitePaths";
import { socialCard } from "./socialCards";

describe("share cards", () => {
  it("have a distinct file for every page", async () => {
    const paths = await sitePaths();
    expect(new Set(paths.map(cardFile)).size).toBe(paths.length);
    expect(cardFile("/")).toBe("home");
    expect(cardFile("/mazes/circle/")).toBe("mazes--circle");
  });

  it.each(SITE_LOCALES.map((l) => l.code))("say something on every page in %s", async (locale) => {
    for (const path of await sitePaths()) {
      const card = await socialCard(locale, path);
      expect(card?.title, path).toBeTruthy();
      if (card && card.art !== "palette") expect(card.pictures.length, path).toBeGreaterThan(0);
    }
  });

  it("are named in every tag that shares a page", () => {
    const meta = pageMetadata("es", "/mazes/circle/", "T", "D");
    const url = cardUrl("es", "/mazes/circle/");
    expect(meta.title).toBe("T");
    expect(meta.description).toBe("D");
    expect(meta.openGraph).toMatchObject({ siteName: "Endless Patterns", locale: "es_ES", title: "T", description: "D", images: [{ url, width: 1200, height: 630 }] });
    expect(meta.openGraph?.url).toMatch(/\/es\/mazes\/circle\/$/);
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", images: [{ url }] });
  });
});
