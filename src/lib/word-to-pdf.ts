const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const PAGE_MARGIN = 50;
const FONT_SIZE = 11;
const LINE_HEIGHT = FONT_SIZE * 1.45;

let unicodeFontBytes: Uint8Array | null = null;

async function loadUnicodeFontBytes(): Promise<Uint8Array> {
  if (unicodeFontBytes) return unicodeFontBytes;
  const res = await fetch("/fonts/NotoSansHebrew-Regular.ttf");
  if (!res.ok) throw new Error("FONT_LOAD_FAILED");
  unicodeFontBytes = new Uint8Array(await res.arrayBuffer());
  return unicodeFontBytes;
}

/** Legacy `.doc` (not DOCX) cannot be parsed by mammoth in the browser. */
export function isLegacyDocFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".doc") && !name.endsWith(".docx");
}

interface PdfTextFont {
  widthOfTextAtSize(text: string, size: number): number;
}

export function splitTextIntoLines(
  text: string,
  font: PdfTextFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  const paragraphs = text.replace(/\r\n/g, "\n").split("\n");

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }

    const words = paragraph.split(/\s+/).filter(Boolean);
    let current = "";

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      const width = font.widthOfTextAtSize(candidate, fontSize);
      if (width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }

    if (current) lines.push(current);
  }

  return lines.length > 0 ? lines : [""];
}

export async function convertWordFileToPdf(file: File): Promise<Blob> {
  if (isLegacyDocFile(file)) {
    throw new Error("LEGACY_DOC_NOT_SUPPORTED");
  }

  const [{ default: mammoth }, { PDFDocument }, { default: fontkit }] = await Promise.all([
    import("mammoth"),
    import("pdf-lib"),
    import("@pdf-lib/fontkit"),
  ]);

  const arrayBuffer = await file.arrayBuffer();
  const { value: text } = await mammoth.extractRawText({ arrayBuffer });

  if (!text.trim()) {
    throw new Error("EMPTY_DOCUMENT");
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const font = await pdfDoc.embedFont(await loadUnicodeFontBytes());

  const maxWidth = A4_WIDTH - PAGE_MARGIN * 2;
  const textLines = splitTextIntoLines(text, font, FONT_SIZE, maxWidth);

  let page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  let y = A4_HEIGHT - PAGE_MARGIN;

  for (const line of textLines) {
    if (y < PAGE_MARGIN) {
      page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
      y = A4_HEIGHT - PAGE_MARGIN;
    }

    if (line) {
      page.drawText(line, {
        x: PAGE_MARGIN,
        y,
        size: FONT_SIZE,
        font,
      });
    }

    y -= LINE_HEIGHT;
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}
