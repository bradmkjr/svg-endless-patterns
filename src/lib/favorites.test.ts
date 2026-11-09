import { describe, expect, it } from "vitest";
import { sampleHref } from "./content";
import { favoriteSample, readFavorites, sameFavorite, type Favorite } from "./favorites";

const quilt: Favorite = { id: "1", kind: "quilt", slug: "charm-squares", name: "Charm squares", query: "p=111111-222222&seed=42", colors: ["#111111", "#222222"], savedAt: 1 };

describe("favorites", () => {
  it("reads what it stored", () => {
    expect(readFavorites(JSON.stringify([quilt]))).toEqual([quilt]);
  });

  it("drops anything that doesn't read", () => {
    expect(readFavorites(null)).toEqual([]);
    expect(readFavorites("not json")).toEqual([]);
    expect(readFavorites(JSON.stringify({ a: 1 }))).toEqual([]);
    expect(readFavorites(JSON.stringify([{ ...quilt, kind: "maze" }, { ...quilt, slug: "../x" }, { ...quilt, colors: ["red"] }, quilt]))).toEqual([quilt]);
  });

  it("is the same favorite only with the same settings", () => {
    expect(sameFavorite(quilt, { ...quilt })).toBe(true);
    expect(sameFavorite(quilt, { ...quilt, query: "p=111111-333333&seed=42" })).toBe(false);
  });

  it("opens the builder with its colors and seed, in the reader's language", () => {
    expect(sampleHref(favoriteSample(quilt), "fr")).toBe("/fr/quilts/charm-squares/?p=111111-222222&seed=42");
    expect(sampleHref(favoriteSample({ ...quilt, kind: "block", slug: "ohio-star", query: "f_star=ff0000" }))).toBe("/blocks/ohio-star/?f_star=ff0000");
    expect(sampleHref(favoriteSample({ ...quilt, kind: "crochet", slug: "granite-stitch", query: "" }))).toBe("/crochet/granite-stitch/");
  });
});
