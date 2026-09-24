import type { FoodCategory, RiskLevel, StorageMethod } from "@prisma/client";
import type { ShelfLifeEvaluation } from "@/lib/types";

const BASE_HOURS: Record<FoodCategory, number> = {
  PREPARED_MEALS: 4,
  DAIRY: 6,
  PRODUCE: 12,
  BAKERY: 10,
  PROTEIN: 3,
  OTHER: 5,
};

const STORAGE_MULTIPLIER: Record<StorageMethod, number> = {
  AMBIENT: 0.65,
  REFRIGERATED: 1,
  FROZEN: 2.5,
  HOT_HOLD: 0.5,
};

/**
 * Deterministic food-safety heuristic used when no AI provider key is configured,
 * or as a safety net if the model call fails.
 */
export function computeHeuristicShelfLife(input: {
  category: FoodCategory;
  ambientTemperatureC: number;
  preparedAt: Date;
  storageMethod: StorageMethod;
}): ShelfLifeEvaluation {
  const ageHours = Math.max(
    0,
    (Date.now() - input.preparedAt.getTime()) / 3_600_000,
  );

  let safeWindowHours =
    BASE_HOURS[input.category] * STORAGE_MULTIPLIER[input.storageMethod];

  if (input.ambientTemperatureC >= 32) {
    safeWindowHours *= 0.55;
  } else if (input.ambientTemperatureC >= 25) {
    safeWindowHours *= 0.75;
  } else if (input.ambientTemperatureC <= 4) {
    safeWindowHours *= 1.15;
  }

  safeWindowHours = Math.max(0.5, Number((safeWindowHours - ageHours * 0.35).toFixed(1)));

  const refrigerationRequired =
    input.storageMethod === "REFRIGERATED" ||
    input.storageMethod === "FROZEN" ||
    input.category === "DAIRY" ||
    input.category === "PROTEIN" ||
    input.category === "PREPARED_MEALS";

  let riskLevel: RiskLevel = "LOW";
  if (safeWindowHours < 2 || input.ambientTemperatureC >= 32) {
    riskLevel = "HIGH";
  } else if (safeWindowHours < 4 || input.ambientTemperatureC >= 25) {
    riskLevel = "MEDIUM";
  }

  return {
    safeWindowHours,
    riskLevel,
    refrigerationRequired,
    rationale: `Heuristic estimate for ${input.category.toLowerCase().replaceAll("_", " ")} under ${input.storageMethod.toLowerCase().replaceAll("_", " ")} storage at ${input.ambientTemperatureC}°C.`,
  };
}
