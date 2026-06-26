/** Build a basic DOCX blob from plain text (paragraphs separated by blank lines). */
export async function createDocxFromText(text: string): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun } = await import("docx");

  const paragraphs = text.split(/\n\n+/).flatMap((block) => {
    const trimmed = block.trim();
    if (!trimmed) return [];
    return trimmed.split("\n").map(
      (line) =>
        new Paragraph({
          children: [new TextRun(line.trim())],
        })
    );
  });

  const doc = new Document({
    sections: [{ properties: {}, children: paragraphs.length > 0 ? paragraphs : [new Paragraph("")] }],
  });

  return Packer.toBlob(doc);
}

async function readFileBytes(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === "function") {
    return file.arrayBuffer();
  }
  return new Response(file).arrayBuffer();
}

/** Extract plain text from a PDF file (text-based PDFs only). */
export async function extractPdfText(arrayBuffer: ArrayBuffer): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const pages: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (pageText) pages.push(pageText);
  }

  return pages.join("\n\n");
}

/** Convert extracted PDF text to DOCX; throws when no readable text. */
export async function convertExtractedTextToDocx(text: string): Promise<Blob> {
  if (!text.trim()) {
    throw new Error("EMPTY_PDF");
  }
  return createDocxFromText(text);
}

/** Convert a PDF file to a basic DOCX (text content; layout not preserved). */
export async function convertPdfFileToDocx(file: File): Promise<Blob> {
  const arrayBuffer = await readFileBytes(file);
  const text = await extractPdfText(arrayBuffer);
  return convertExtractedTextToDocx(text);
}

/** Convert raw PDF bytes to DOCX (text content; layout not preserved). */
export async function convertPdfBufferToDocx(arrayBuffer: ArrayBuffer): Promise<Blob> {
  const text = await extractPdfText(arrayBuffer);
  return convertExtractedTextToDocx(text);
}
