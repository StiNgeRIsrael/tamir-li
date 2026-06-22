import { describe, it, expect } from "vitest";
import {
  SERVER_UNAVAILABLE,
  isServerUnavailableHttpStatus,
  isServerUnavailableError,
} from "./conversion-errors";

describe("conversion-errors", () => {
  it("detects 5xx HTTP statuses", () => {
    expect(isServerUnavailableHttpStatus(500)).toBe(true);
    expect(isServerUnavailableHttpStatus(503)).toBe(true);
    expect(isServerUnavailableHttpStatus(499)).toBe(false);
    expect(isServerUnavailableHttpStatus(400)).toBe(false);
  });

  it("recognizes SERVER_UNAVAILABLE errors", () => {
    expect(isServerUnavailableError(new Error(SERVER_UNAVAILABLE))).toBe(true);
    expect(isServerUnavailableError(new Error("API_ERROR"))).toBe(false);
    expect(isServerUnavailableError("SERVER_UNAVAILABLE")).toBe(false);
  });
});
