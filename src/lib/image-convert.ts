/** Client-side raster conversion via canvas — no server compute. */

const FORMAT_MIME: Record<string, string> = {
  JPG: "image/jpeg",
  JPEG: "image/jpeg",
  PNG: "image/png",
  WEBP: "image/webp",
  GIF: "image/gif",
};

const FORMAT_EXT: Record<string, string> = {
  JPG: "jpg",
  JPEG: "jpg",
  PNG: "png",
  WEBP: "webp",
  GIF: "gif",
  BMP: "bmp",
  TIFF: "tiff",
  TIF: "tiff",
  SVG: "svg",
};

export function normalizeFormat(fmt: string): string {
  return fmt.toUpperCase().replace(/^JPEG$/, "JPG");
}

export function formatToExtension(fmt: string): string {
  const key = normalizeFormat(fmt);
  return FORMAT_EXT[key] ?? key.toLowerCase();
}

/** Output formats the browser can produce without a WASM encoder. */
export function isOutputFormatSupported(fmt: string): boolean {
  const f = normalizeFormat(fmt);
  return f in FORMAT_MIME || f === "BMP";
}

export function isInputFormatSupported(fmt: string): boolean {
  const f = normalizeFormat(fmt);
  return ["JPG", "PNG", "WEBP", "GIF", "BMP", "TIFF", "TIF", "SVG"].includes(f);
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("IMAGE_DECODE_FAILED"));
    };
    img.src = url;
  });
}

function canvasToBmp(canvas: HTMLCanvasElement): Blob {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d")!;
  const { data } = ctx.getImageData(0, 0, w, h);
  const rowSize = Math.floor((24 * w + 31) / 32) * 4;
  const pixelSize = rowSize * h;
  const fileSize = 54 + pixelSize;
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // BITMAPFILEHEADER
  view.setUint8(0, 0x42);
  view.setUint8(1, 0x4d);
  view.setUint32(2, fileSize, true);
  view.setUint32(6, 0, true);
  view.setUint32(10, 54, true);

  // BITMAPINFOHEADER
  view.setUint32(14, 40, true);
  view.setInt32(18, w, true);
  view.setInt32(22, h, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(30, 0, true);
  view.setUint32(34, pixelSize, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  let offset = 54;
  for (let y = h - 1; y >= 0; y--) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      view.setUint8(offset++, data[i + 2]);
      view.setUint8(offset++, data[i + 1]);
      view.setUint8(offset++, data[i]);
    }
    const pad = rowSize - w * 3;
    for (let p = 0; p < pad; p++) view.setUint8(offset++, 0);
  }

  return new Blob([buffer], { type: "image/bmp" });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("CANVAS_EXPORT_FAILED"))),
      mime,
      quality
    );
  });
}

export type ImageConvertError =
  | "UNSUPPORTED_OUTPUT"
  | "IMAGE_DECODE_FAILED"
  | "CANVAS_EXPORT_FAILED";

export async function convertImageFile(file: File, toFormat: string): Promise<Blob> {
  const to = normalizeFormat(toFormat);

  if (!isOutputFormatSupported(to)) {
    throw new Error("UNSUPPORTED_OUTPUT");
  }

  const img = await loadImageFromFile(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  if (to === "BMP") {
    return canvasToBmp(canvas);
  }

  const mime = FORMAT_MIME[to];
  const quality = to === "PNG" ? undefined : 0.92;
  return canvasToBlob(canvas, mime, quality);
}
