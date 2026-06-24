import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  AI_SETTINGS_TABLE_MISSING_MESSAGE,
  aiSettingsErrorMessage,
  isAiSettingsTableMissing,
  maskApiKey,
  parseAiSettingsPatch,
} from "../../backend/src/lib/ai-settings";

describe("maskApiKey", () => {
  it("masks all but last 4 characters", () => {
    expect(maskApiKey("AIzaSyAbCdEfGhIjKlMn")).toBe("****KlMn");
  });

  it("returns null for empty key", () => {
    expect(maskApiKey(null)).toBeNull();
  });
});

describe("parseAiSettingsPatch", () => {
  it("accepts model and enabled", () => {
    const { data, error } = parseAiSettingsPatch({
      modelName: "  imagen-3.0-generate-002  ",
      enabled: true,
    });
    expect(error).toBeUndefined();
    expect(data.modelName).toBe("imagen-3.0-generate-002");
    expect(data.enabled).toBe(true);
  });

  it("maps empty api key to null", () => {
    const { data } = parseAiSettingsPatch({ googleApiKey: "   " });
    expect(data.googleApiKey).toBeNull();
  });

  it("rejects invalid enabled type", () => {
    const { error } = parseAiSettingsPatch({ enabled: "yes" });
    expect(error).toMatch(/enabled must be a boolean/);
  });
});

describe("isAiSettingsTableMissing", () => {
  it("detects Prisma P2021 for AiSettings", () => {
    const err = new Prisma.PrismaClientKnownRequestError("Table does not exist", {
      code: "P2021",
      clientVersion: "test",
      meta: { table: "AiSettings" },
    });
    expect(isAiSettingsTableMissing(err)).toBe(true);
  });
});

describe("aiSettingsErrorMessage", () => {
  it("returns migration hint for missing table", () => {
    const err = new Prisma.PrismaClientKnownRequestError("Table does not exist", {
      code: "P2021",
      clientVersion: "test",
      meta: { table: "AiSettings" },
    });
    expect(aiSettingsErrorMessage(err, "save")).toBe(AI_SETTINGS_TABLE_MISSING_MESSAGE);
  });
});
