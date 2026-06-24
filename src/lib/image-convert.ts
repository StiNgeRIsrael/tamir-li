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
  ICO: "ico",
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
  return f in FORMAT_MIME || f === "BMP" || f === "ICO";
}

export function canConvertClientSide(fromFormat: string, toFormat: string): boolean {
  return isInputFormatSupported(fromFormat) && isOutputFormatSupported(toFormat);
}

/** True for image-converter and single-pair slugs like svg-to-png / png-to-ico. */
export function usesClientImageConversion(
  toolId: string,
  fromFormats: readonly string[],
  toFormats: readonly string[]
): boolean {
  if (toolId === "image-converter") return true;
  if (fromFormats.length !== 1 || toFormats.length !== 1) return false;
  return canConvertClientSide(fromFormats[0], toFormats[0]);
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

/** Encode RGBA canvas pixels as an uncompressed 24-bit BMP (browser canvas has no BMP export). */
export function encodeRgbaAsBmpBuffer(width: number, height: number, rgba: Uint8ClampedArray): ArrayBuffer {
  const w = width;
  const h = height;
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
      view.setUint8(offset++, rgba[i + 2]);
      view.setUint8(offset++, rgba[i + 1]);
      view.setUint8(offset++, rgba[i]);
    }
    const pad = rowSize - w * 3;
    for (let p = 0; p < pad; p++) view.setUint8(offset++, 0);
  }

  return buffer;
}

export function encodeRgbaAsBmp(width: number, height: number, rgba: Uint8ClampedArray): Blob {
  return new Blob([encodeRgbaAsBmpBuffer(width, height, rgba)], { type: "image/bmp" });
}

function canvasToBmp(canvas: HTMLCanvasElement): Blob {
  const w = canvas.width;
  const h = canvas.height;
  if (w < 1 || h < 1) {
    throw new Error("CANVAS_EXPORT_FAILED");
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("CANVAS_EXPORT_FAILED");
  }
  const { data } = ctx.getImageData(0, 0, w, h);
  return encodeRgbaAsBmp(w, h, data);
}

const FAVICON_SIZES = [16, 32, 48] as const;

async function canvasToIco(source: HTMLCanvasElement): Promise<Blob> {
  const entries: { size: number; png: Uint8Array }[] = [];

  for (const size of FAVICON_SIZES) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(source, 0, 0, size, size);
    const blob = await canvasToBlob(canvas, "image/png");
    entries.push({ size, png: new Uint8Array(await blob.arrayBuffer()) });
  }

  const headerSize = 6 + entries.length * 16;
  let dataOffset = headerSize;
  const header = new ArrayBuffer(headerSize);
  const view = new DataView(header);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, entries.length, true);

  const chunks: BlobPart[] = [header];
  entries.forEach((entry, index) => {
    const dir = 6 + index * 16;
    const dim = entry.size >= 256 ? 0 : entry.size;
    view.setUint8(dir, dim);
    view.setUint8(dir + 1, dim);
    view.setUint8(dir + 2, 0);
    view.setUint8(dir + 3, 0);
    view.setUint16(dir + 4, 1, true);
    view.setUint16(dir + 6, 32, true);
    view.setUint32(dir + 8, entry.png.length, true);
    view.setUint32(dir + 12, dataOffset, true);
    dataOffset += entry.png.length;
    chunks.push(entry.png);
  });

  return new Blob(chunks, { type: "image/x-icon" });
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
  if (img.naturalWidth < 1 || img.naturalHeight < 1) {
    throw new Error("IMAGE_DECODE_FAILED");
  }
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("CANVAS_EXPORT_FAILED");
  }
  ctx.drawImage(img, 0, 0);

  if (to === "BMP") {
    return canvasToBmp(canvas);
  }

  if (to === "ICO") {
    return canvasToIco(canvas);
  }

  const mime = FORMAT_MIME[to];
  const quality = to === "PNG" ? undefined : 0.92;
  return canvasToBlob(canvas, mime, quality);
}
