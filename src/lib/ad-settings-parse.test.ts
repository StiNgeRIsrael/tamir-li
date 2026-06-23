import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  AD_SETTINGS_TABLE_MISSING_MESSAGE,
  adSettingsErrorMessage,
  isAdSettingsTableMissing,
  parseAdSettingsPatch,
} from "../../backend/src/lib/ad-settings";

describe("parseAdSettingsPatch", () => {
  it("maps empty strings to null", () => {
    const { data, error } = parseAdSettingsPatch({ zoneBanner: "  " });
    expect(error).toBeUndefined();
    expect(data.zoneBanner).toBeNull();
  });

  it("accepts null values", () => {
    const { data, error } = parseAdSettingsPatch({
      zoneBanner: null,
      invokeHost: null,
    });
    expect(error).toBeUndefined();
    expect(data.zoneBanner).toBeNull();
    expect(data.invokeHost).toBeNull();
  });

  it("trims non-empty strings", () => {
    const { data } = parseAdSettingsPatch({ zoneInline: "  abc123  " });
    expect(data.zoneInline).toBe("abc123");
  });

  it("rejects non-string types", () => {
    const { error } = parseAdSettingsPatch({ zoneBanner: 42 });
    expect(error).toMatch(/zoneBanner must be a string or null/);
  });
});

describe("isAdSettingsTableMissing", () => {
  it("detects Prisma P2021 for AdSettings", () => {
    const err = new Prisma.PrismaClientKnownRequestError("Table does not exist", {
      code: "P2021",
      clientVersion: "test",
      meta: { table: "AdSettings" },
    });
    expect(isAdSettingsTableMissing(err)).toBe(true);
  });

  it("ignores P2021 for other tables", () => {
    const err = new Prisma.PrismaClientKnownRequestError("Table does not exist", {
      code: "P2021",
      clientVersion: "test",
      meta: { table: "User" },
    });
    expect(isAdSettingsTableMissing(err)).toBe(false);
  });
});

describe("adSettingsErrorMessage", () => {
  it("returns migration hint for missing table", () => {
    const err = new Prisma.PrismaClientKnownRequestError("Table does not exist", {
      code: "P2021",
      clientVersion: "test",
      meta: { table: "AdSettings" },
    });
    expect(adSettingsErrorMessage(err, "save")).toBe(AD_SETTINGS_TABLE_MISSING_MESSAGE);
  });
});
