import { marked } from "marked";
import TurndownService from "turndown";

export type TextFormat = "plain" | "markdown" | "html";

const BLOCK_TAGS = new Set([
  "address",
  "article",
  "aside",
  "blockquote",
  "details",
  "div",
  "dl",
  "dt",
  "dd",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "li",
  "main",
  "nav",
  "ol",
  "p",
  "pre",
  "section",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "ul",
]);

let turndownService: TurndownService | null = null;

function getTurndown(): TurndownService {
  if (!turndownService) {
    turndownService = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
    });
    turndownService.addRule("lineBreak", {
      filter: "br",
      replacement: () => "\n",
    });
  }
  return turndownService;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function extractTextFromNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as Element;
  const tag = el.tagName.toLowerCase();

  if (tag === "br") return "\n";
  if (tag === "hr") return "\n---\n";

  let inner = "";
  for (const child of el.childNodes) {
    inner += extractTextFromNode(child);
  }

  if (BLOCK_TAGS.has(tag)) {
    const trimmed = inner.replace(/^\n+/, "").replace(/\n+$/, "");
    return `\n${trimmed}\n`;
  }

  return inner;
}

/** Strip HTML tags while preserving block/line structure. */
export function htmlToPlainText(html: string): string {
  if (!html.trim()) return "";

  const doc = new DOMParser().parseFromString(html, "text/html");
  const text = extractTextFromNode(doc.body);
  return text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function markdownToHtml(md: string): string {
  return marked.parse(md, { async: false }) as string;
}

export function markdownToPlainText(md: string): string {
  if (!md.trim()) return "";
  return htmlToPlainText(markdownToHtml(md));
}

export function htmlToMarkdown(html: string): string {
  if (!html.trim()) return "";
  return getTurndown().turndown(html);
}

export function plainToHtml(text: string): string {
  if (!text.trim()) return "";

  return text
    .split(/\n{2,}/)
    .map((paragraph) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return "";
      return `<p>${escapeHtml(trimmed).replace(/\n/g, "<br>")}</p>`;
    })
    .filter(Boolean)
    .join("\n");
}

/** Plain text is valid Markdown; normalize line endings only. */
export function plainToMarkdown(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

export function convertText(input: string, from: TextFormat, to: TextFormat): string {
  if (from === to) return input;
  if (!input.trim()) return "";

  if (from === "markdown" && to === "html") return markdownToHtml(input);
  if (from === "html" && to === "markdown") return htmlToMarkdown(input);
  if (from === "html" && to === "plain") return htmlToPlainText(input);
  if (from === "markdown" && to === "plain") return markdownToPlainText(input);
  if (from === "plain" && to === "markdown") return plainToMarkdown(input);
  if (from === "plain" && to === "html") return plainToHtml(input);

  return input;
}

export function canConvertText(from: TextFormat, to: TextFormat): boolean {
  return from === to || (["plain", "markdown", "html"] as TextFormat[]).includes(from);
}

export type TextStats = {
  chars: number;
  charsNoSpaces: number;
  words: number;
  lines: number;
  paragraphs: number;
};

function plainTextForStats(text: string, format: TextFormat): string {
  if (!text.trim()) return "";
  if (format === "html") return htmlToPlainText(text);
  if (format === "markdown") return markdownToPlainText(text);
  return text;
}

export function getTextStats(text: string, format: TextFormat = "plain"): TextStats {
  const plain = plainTextForStats(text, format);
  const chars = plain.length;
  const charsNoSpaces = plain.replace(/\s/g, "").length;
  const words = plain.trim() ? plain.trim().split(/\s+/).length : 0;
  const lines = plain ? plain.split("\n").length : 0;
  const paragraphs = plain.trim() ? plain.split(/\n\n+/).filter((p) => p.trim()).length : 0;
  return { chars, charsNoSpaces, words, lines, paragraphs };
}

export function toTitleCase(text: string): string {
  return text.replace(/\b\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

export function cleanWhitespace(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/[^\S\n]+/g, " ").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Normalize toolbar transforms to plain text when source is HTML or Markdown. */
export function plainTextForEditing(text: string, format: TextFormat): string {
  if (format === "html") return htmlToPlainText(text);
  if (format === "markdown") return markdownToPlainText(text);
  return text;
}
