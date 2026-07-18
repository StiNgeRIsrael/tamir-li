import { describe, expect, it } from "vitest";
import { getActiveAppTab, isAppTabRoot, stripLocalePrefix } from "./app-tab-paths";

describe("app-tab-paths", () => {
  it("strips locale prefixes", () => {
    expect(stripLocalePrefix("/en/premium")).toBe("/premium");
    expect(stripLocalePrefix("/catalog")).toBe("/catalog");
    expect(stripLocalePrefix("/")).toBe("/");
  });

  it("detects active tabs", () => {
    expect(getActiveAppTab("/")).toBe("home");
    expect(getActiveAppTab("/en/catalog")).toBe("catalog");
    expect(getActiveAppTab("/premium")).toBe("premium");
    expect(getActiveAppTab("/account")).toBe("account");
    expect(getActiveAppTab("/jpg-to-png")).toBeNull();
  });

  it("knows tab roots vs tool screens", () => {
    expect(isAppTabRoot("/")).toBe(true);
    expect(isAppTabRoot("/en/account")).toBe(true);
    expect(isAppTabRoot("/pdf-to-word")).toBe(false);
  });
});
