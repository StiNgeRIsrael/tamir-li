import { describe, expect, it } from "vitest";
import { buildBreadcrumbJsonLd, buildFaqPageJsonLd } from "./structured-data";

describe("buildBreadcrumbJsonLd", () => {
  it("maps items to ListItem positions", () => {
    const result = buildBreadcrumbJsonLd([
      { name: "Home", item: "https://tamir.li/" },
      { name: "Blog", item: "https://tamir.li/blog" },
      { name: "Post" },
    ]);
    expect(result.itemListElement).toHaveLength(3);
    expect(result.itemListElement[0]).toMatchObject({ position: 1, name: "Home", item: "https://tamir.li/" });
    expect(result.itemListElement[2]).toMatchObject({ position: 3, name: "Post" });
    expect(result.itemListElement[2]).not.toHaveProperty("item");
  });
});

describe("buildFaqPageJsonLd", () => {
  it("returns null for empty FAQs", () => {
    expect(buildFaqPageJsonLd([])).toBeNull();
  });

  it("builds FAQPage mainEntity", () => {
    const result = buildFaqPageJsonLd([{ q: "Q?", a: "A." }]);
    expect(result?.mainEntity).toHaveLength(1);
    expect(result?.mainEntity[0]).toMatchObject({
      "@type": "Question",
      name: "Q?",
      acceptedAnswer: { "@type": "Answer", text: "A." },
    });
  });
});
