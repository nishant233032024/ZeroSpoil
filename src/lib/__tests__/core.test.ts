import { describe, expect, it } from "vitest";
import { computeHeuristicShelfLife } from "@/lib/shelf-life";
import {
  claimBatchSchema,
  createBatchSchema,
  registerSchema,
} from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

describe("computeHeuristicShelfLife", () => {
  it("flags high risk for hot ambient prepared meals", () => {
    const result = computeHeuristicShelfLife({
      category: "PREPARED_MEALS",
      ambientTemperatureC: 34,
      preparedAt: new Date(Date.now() - 60 * 60_000),
      storageMethod: "HOT_HOLD",
    });

    expect(result.riskLevel).toBe("HIGH");
    expect(result.safeWindowHours).toBeGreaterThan(0);
    expect(result.refrigerationRequired).toBe(true);
  });

  it("keeps refrigerated produce lower risk", () => {
    const result = computeHeuristicShelfLife({
      category: "PRODUCE",
      ambientTemperatureC: 4,
      preparedAt: new Date(),
      storageMethod: "REFRIGERATED",
    });

    expect(["LOW", "MEDIUM"]).toContain(result.riskLevel);
  });
});

describe("zod schemas", () => {
  it("accepts a valid claim payload", () => {
    const parsed = claimBatchSchema.safeParse({
      batchId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects short batch titles", () => {
    const parsed = createBatchSchema.safeParse({
      title: "ab",
      category: "PREPARED_MEALS",
      quantityKg: 1,
      ambientTemperatureC: 20,
      preparedAt: new Date().toISOString(),
      storageMethod: "REFRIGERATED",
      pickupAddress: "Somewhere long enough",
      safeWindowHours: 4,
      riskLevel: "LOW",
      refrigerationRequired: true,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects admin self-registration roles", () => {
    const parsed = registerSchema.safeParse({
      name: "Test",
      email: "t@example.com",
      password: "password123",
      role: "ADMIN",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("checkRateLimit", () => {
  it("blocks after the configured limit", () => {
    const key = `test-${Date.now()}`;
    expect(checkRateLimit(key, 2, 60_000).ok).toBe(true);
    expect(checkRateLimit(key, 2, 60_000).ok).toBe(true);
    expect(checkRateLimit(key, 2, 60_000).ok).toBe(false);
  });
});
