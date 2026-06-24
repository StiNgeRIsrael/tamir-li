import { describe, it, expect } from "vitest";
import {
  type TextFormat,
  convertText,
  canConvertText,
  escapeHtml,
  htmlToPlainText,
  markdownToPlainText,
  plainToHtml,
  plainToMarkdown,
  getTextStats,
  toTitleCase,
  cleanWhitespace,
} from "./text-convert";

const FORMATS: TextFormat[] = ["plain", "markdown", "html"];

describe("text-convert matrix", () => {
  const sample: Record<TextFormat, string> = {
    plain: "Hello world\n\nSecond paragraph.",
    markdown: "# Title\n\nHello **world**.\n\n- item one\n- item two",
    html: "<h1>Title</h1><p>Hello <strong>world</strong>.</p><ul><li>item one</li><li>item two</li></ul>",
  };

  it.each(FORMATS.flatMap((from) => FORMATS.map((to) => [from, to] as const)))(
    "converts %s → %s without throwing",
    (from, to) => {
      expect(canConvertText(from, to)).toBe(true);
      const result = convertText(sample[from], from, to);
      expect(typeof result).toBe("string");
      if (from === to) {
        expect(result).toBe(sample[from]);
      } else {
        expect(result.length).toBeGreaterThan(0);
      }
    }
  );

  it("identity conversion returns input unchanged", () => {
    expect(convertText("same", "plain", "plain")).toBe("same");
    expect(convertText("# md", "markdown", "markdown")).toBe("# md");
  });

  it("empty input yields empty output for conversions", () => {
    expect(convertText("   ", "plain", "html")).toBe("");
    expect(convertText("", "html", "plain")).toBe("");
  });
});

describe("htmlToPlainText", () => {
  it("strips tags and preserves paragraph breaks", () => {
    const html = "<p>Line one</p><p>Line two</p>";
    expect(htmlToPlainText(html)).toContain("Line one");
    expect(htmlToPlainText(html)).toContain("Line two");
    expect(htmlToPlainText(html)).not.toContain("<p>");
  });

  it("preserves br line breaks", () => {
    expect(htmlToPlainText("Hello<br>World")).toMatch(/Hello\s*\n\s*World/);
  });

  it("handles list items on separate lines", () => {
    const text = htmlToPlainText("<ul><li>alpha</li><li>beta</li></ul>");
    expect(text).toContain("alpha");
    expect(text).toContain("beta");
  });
});

describe("markdown conversions", () => {
  it("MD → HTML renders headings and emphasis", () => {
    const html = convertText("# Hello\n\n**bold**", "markdown", "html");
    expect(html).toContain("<h1");
    expect(html).toContain("Hello");
    expect(html).toMatch(/<strong>bold<\/strong>/);
  });

  it("MD → TXT strips syntax", () => {
    const plain = convertText("# Hello\n\n**bold** text", "markdown", "plain");
    expect(plain).toContain("Hello");
    expect(plain).toContain("bold text");
    expect(plain).not.toContain("**");
    expect(plain).not.toContain("#");
  });

  it("HTML → MD produces markdown headings", () => {
    const md = convertText("<h2>Sub</h2><p>Body</p>", "html", "markdown");
    expect(md).toMatch(/##\s+Sub/);
    expect(md).toContain("Body");
  });
});

describe("plain text conversions", () => {
  it("TXT → HTML escapes entities and wraps paragraphs", () => {
    const html = plainToHtml("A & B\n\n<script>alert(1)</script>");
    expect(html).toContain("&amp;");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toMatch(/<p>.*<\/p>/);
  });

  it("TXT → MD passes through with normalized newlines", () => {
    expect(plainToMarkdown("a\r\nb")).toBe("a\nb");
  });

  it("TXT → HTML converts single newlines to br inside paragraphs", () => {
    const html = plainToHtml("line one\nline two");
    expect(html).toContain("<br>");
    expect(html).toContain("line one");
    expect(html).toContain("line two");
  });
});

describe("escapeHtml", () => {
  it("escapes dangerous characters", () => {
    expect(escapeHtml(`<a href="x">`)).toBe("&lt;a href=&quot;x&quot;&gt;");
  });
});

describe("text transforms", () => {
  it("title-cases words", () => {
    expect(toTitleCase("hello WORLD")).toBe("Hello World");
  });

  it("cleans extra spaces and blank lines", () => {
    expect(cleanWhitespace("  hello   world  \n\n\n\nfoo")).toBe("hello world\n\nfoo");
  });
});

describe("getTextStats", () => {
  it("counts words in plain text", () => {
    expect(getTextStats("one two three", "plain")).toMatchObject({
      chars: 13,
      words: 3,
      lines: 1,
      paragraphs: 1,
    });
  });

  it("counts semantic text for HTML input", () => {
    const stats = getTextStats("<p>hello world</p>", "html");
    expect(stats.words).toBe(2);
    expect(stats.charsNoSpaces).toBe(10);
  });

  it("counts semantic text for Markdown input", () => {
    const stats = getTextStats("**hello** world", "markdown");
    expect(stats.words).toBe(2);
    expect(stats.charsNoSpaces).toBe(10);
  });

  it("returns zeros for empty input", () => {
    expect(getTextStats("", "plain")).toMatchObject({
      chars: 0,
      words: 0,
      lines: 0,
      paragraphs: 0,
    });
  });
});

describe("round-trip sanity", () => {
  it("HTML → TXT → HTML produces readable paragraphs", () => {
    const start = "<p>Alpha</p><p>Beta</p>";
    const plain = convertText(start, "html", "plain");
    const back = convertText(plain, "plain", "html");
    expect(plain).toMatch(/Alpha/);
    expect(plain).toMatch(/Beta/);
    expect(back).toContain("<p>Alpha</p>");
    expect(back).toContain("<p>Beta</p>");
  });

  it("markdownToPlainText matches convertText MD → plain", () => {
    const md = "## Heading\n\nParagraph.";
    expect(markdownToPlainText(md)).toBe(convertText(md, "markdown", "plain"));
  });
});
