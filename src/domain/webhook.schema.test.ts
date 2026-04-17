import { describe, expect, it } from "vitest";

import {
  webhookCreateSchema,
  webhookUpdateSchema,
} from "./webhook.schema";

describe("webhookCreateSchema", () => {
  it("defaults enabled to true when omitted on create", () => {
    const result = webhookCreateSchema.parse({
      name: "New",
      url: "https://x.test/hook",
      events: ["lead.created"],
    });
    expect(result.enabled).toBe(true);
  });

  it("respects explicit enabled=false on create", () => {
    const result = webhookCreateSchema.parse({
      name: "New",
      url: "https://x.test/hook",
      events: ["lead.created"],
      enabled: false,
    });
    expect(result.enabled).toBe(false);
  });
});

describe("webhookUpdateSchema", () => {
  // Regression test for the Zod v4 `.partial()` leak flagged by Devin Review
  // on PR #12: a PATCH without `enabled` must NOT silently inject `true`.
  it("does not inject enabled=true when the field is omitted (regression)", () => {
    const result = webhookUpdateSchema.parse({ name: "Updated" });
    expect(result).not.toHaveProperty("enabled");
  });

  it("allows renaming a paused webhook without re-activating it", () => {
    const result = webhookUpdateSchema.parse({
      name: "Renamed while paused",
    });
    expect(Object.keys(result)).toEqual(["name"]);
  });

  it("still accepts explicit enabled updates", () => {
    expect(webhookUpdateSchema.parse({ enabled: true }).enabled).toBe(true);
    expect(webhookUpdateSchema.parse({ enabled: false }).enabled).toBe(false);
  });

  it("allows empty partial patches", () => {
    expect(webhookUpdateSchema.parse({})).toEqual({});
  });
});
