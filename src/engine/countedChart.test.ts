import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { chartCenter, chartSheets, makingUp, SHEET_COLUMNS, SHEET_OVERLAP, SHEET_ROWS, skeinsFor, stitchingOrder } from "./countedChart";
import { writeProjectPdf } from "./countedChartPdf";

describe("chart sheets", () => {
  it("keeps a chart that fits on one sheet", () => {
    expect(chartSheets(SHEET_COLUMNS, SHEET_ROWS)).toEqual([{ column: 0, row: 0, columns: SHEET_COLUMNS, rows: SHEET_ROWS, overlapColumns: 0, overlapRows: 0 }]);
  });

  it("splits a wide chart across and a tall chart down", () => {
    expect(chartSheets(40, 8)).toHaveLength(2);
    expect(chartSheets(8, 40)).toHaveLength(2);
    expect(chartSheets(40, 40)).toHaveLength(4);
  });

  it.each([[31, 37], [39, 39], [40, 40], [30, 40], [40, 10]])("covers every square of a %i x %i chart, overlapping neighbors", (columns, rows) => {
    const sheets = chartSheets(columns, rows);
    const covered = new Set<string>();
    for (const sheet of sheets) {
      expect(sheet.columns).toBeLessThanOrEqual(SHEET_COLUMNS);
      expect(sheet.rows).toBeLessThanOrEqual(SHEET_ROWS);
      for (let y = sheet.row; y < sheet.row + sheet.rows; y++) for (let x = sheet.column; x < sheet.column + sheet.columns; x++) covered.add(`${x},${y}`);
      // Its overlap really does repeat the neighbor before it.
      if (sheet.overlapColumns) expect(sheets.some((other) => other.row === sheet.row && other.column + other.columns === sheet.column + SHEET_OVERLAP)).toBe(true);
      if (sheet.overlapRows) expect(sheets.some((other) => other.column === sheet.column && other.row + other.rows === sheet.row + SHEET_OVERLAP)).toBe(true);
    }
    expect(covered.size).toBe(columns * rows);
  });
});

describe("stitching order", () => {
  const grid = ["bbbbb", "b...b", "b.a.b", "b...b", "bbbbb"];

  it("starts from the center and reaches outward", () => {
    const order = stitchingOrder(grid, ["#111111", "#222222"]);
    expect(order.map((turn) => turn.symbol)).toEqual(["X", "O"]);
    expect(order[0]).toMatchObject({ column: 3, row: 3, stitches: 1 });
    expect(order[1]).toMatchObject({ column: 3, row: 1, stitches: 16 });
  });

  it("leaves out colors with no stitches", () => {
    expect(stitchingOrder(grid, ["#111111", "#222222", "#333333"])).toHaveLength(2);
  });

  it("can keep the largest color for last, as a background", () => {
    const filled = ["baab", "bccb", "bccb", "baab"];
    expect(stitchingOrder(filled, ["#1", "#2", "#3"]).map((turn) => turn.index)[0]).toBe(2);
    expect(stitchingOrder(filled, ["#1", "#2", "#3"], { backgroundLast: true }).at(-1)!.index).toBe(1);
  });

  it("numbers the center so an even chart falls on a line", () => {
    expect(chartCenter(39, 39)).toEqual({ column: 20, row: 20 });
    expect(chartCenter(40, 39)).toEqual({ column: 20.5, row: 20 });
  });
});

describe("skeins", () => {
  it("rounds up, and needs none for nothing", () => {
    expect(skeinsFor(0, 8)).toBe(0);
    expect(skeinsFor(0.1, 8)).toBe(1);
    expect(skeinsFor(8, 8)).toBe(1);
    expect(skeinsFor(8.1, 8)).toBe(2);
  });
});

describe("making up", () => {
  it("adds the same border to the front and the back", () => {
    const made = makingUp(4, 4, 3, 1, 0.5);
    expect(made).toMatchObject({ boardWidth: "6", wrap: "2", trimWidth: "6", sideStrip: "6", topStrip: "10", backWidth: "10", pillowWidth: "9", formWidth: "9" });
  });
});

describe("project PDF", () => {
  const grid = Array.from({ length: 40 }, () => "ab".repeat(20));
  const pdf = (rows: string[]) =>
    writeProjectPdf({
      title: "T",
      size: "S",
      ground: "#ffffff",
      grid: rows,
      colors: ["#111111", "#222222"],
      colorsHeading: "C",
      colorLines: [{ color: "#111111", text: "c" }],
      total: "t",
      sections: [{ heading: "H", lines: ["one"], numbered: true }],
      chartHeading: "Chart",
      chartHelp: "help",
      sheetHelp: "sheet help",
      sheetTitle: ({ n, total }) => `${n} of ${total}`,
      key: "k",
    });

  it("gives a large chart a page per sheet, after the details", async () => {
    expect((await PDFDocument.load(await pdf(grid))).getPageCount()).toBe(5);
  });

  it("keeps a small chart on one page", async () => {
    expect((await PDFDocument.load(await pdf(grid.slice(0, 20).map((r) => r.slice(0, 20))))).getPageCount()).toBe(2);
  });
});
