import { ImageResponse } from "next/og";

export const alt = "Endless Patterns: customizable quilt blocks";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

const TILES = Array.from({ length: 12 }, (_, i) => (i % 3 === 0 ? "#23395d" : i % 3 === 1 ? "#b5533c" : "#7f9ab8"));

export default function OpengraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f4ecdc", padding: 72, color: "#23395d" }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 92, fontWeight: 700 }}>Endless Patterns</div>
        <div style={{ fontSize: 40, marginTop: 16 }}>Quilt blocks, cutting lists and templates</div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        {TILES.map((color, i) => (
          <div key={i} style={{ width: 76, height: 76, background: color }} />
        ))}
      </div>
    </div>,
    size,
  );
}
