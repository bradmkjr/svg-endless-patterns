/** Browser-only file helpers for the builder's download buttons. */

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadSvg(svg: string, filename: string) {
  save(new Blob([svg], { type: "image/svg+xml" }), filename);
}

export function downloadBytes(bytes: Uint8Array, filename: string, type: string) {
  save(new Blob([new Uint8Array(bytes)], { type }), filename);
}

/** Rasterizes an SVG so its longest side is `longest` pixels. */
export async function downloadPng(svg: string, filename: string, longest = 2400) {
  const box = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  if (!box) throw new Error("SVG has no viewBox");
  const width = Number(box[1]);
  const height = Number(box[2]);
  const scale = longest / Math.max(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  const sized = svg.replace(/width="[\d.]+in" height="[\d.]+in"/, `width="${canvas.width}" height="${canvas.height}"`);
  const url = URL.createObjectURL(new Blob([sized], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser can't draw a PNG this large");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
  } finally {
    URL.revokeObjectURL(url);
  }
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Couldn't create the PNG");
  save(blob, filename);
}
