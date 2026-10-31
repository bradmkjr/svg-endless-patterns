import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Generation is due to move behind a backend API, which only stays a small
 * change while these two rules hold.
 */
const SRC = join(__dirname, "..");
const files = (readdirSync(SRC, { recursive: true }) as string[]).filter((f) => /\.tsx?$/.test(f));
const read = (f: string) => readFileSync(join(SRC, f), "utf8");

describe("engine boundary", () => {
  it("is imported only by lib/generator.ts", () => {
    const importers = files.filter((f) => !f.startsWith("engine/") && /from "@\/engine|import\("@\/engine/.test(read(f)));
    expect(importers).toEqual(["lib/generator.ts"]);
  });

  it("depends on nothing from the site, the framework or the browser", () => {
    const engine = files.filter((f) => f.startsWith("engine/") && !f.endsWith(".test.ts"));
    expect(engine.length).toBeGreaterThan(0);
    for (const f of engine) {
      const source = read(f);
      const imports = [...source.matchAll(/from "([^"]+)"/g)].map((m) => m[1]);
      expect(imports.filter((i) => !i.startsWith("./") && i !== "pdf-lib"), f).toEqual([]);
      expect(source, f).not.toMatch(/\b(window|document|localStorage|navigator)\./);
    }
  });
});
