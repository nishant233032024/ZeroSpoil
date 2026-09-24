import { z } from "zod";

export const foodCategorySchema = z.enum([
  "PREPARED_MEALS",
  "DAIRY",
  "PRODUCE",
  "BAKERY",
  "PROTEIN",
  "OTHER",
]);

export const storageMethodSchema = z.enum([
  "AMBIENT",
  "REFRIGERATED",
  "FROZEN",
  "HOT_HOLD",
]);

export const riskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const shelfLifeInputSchema = z.object({
  category: foodCategorySchema,
  ambientTemperatureC: z.coerce.number().min(-20).max(80),
  preparedAt: z.string().datetime({ offset: true }).or(z.string().min(1)),
  storageMethod: storageMethodSchema,
  cuisineName: z.string().trim().min(1).max(80).optional(),
  dishName: z.string().trim().min(1).max(120).optional(),
});

export const shelfLifeOutputSchema = z.object({
  safeWindowHours: z.number().positive().max(168),
  riskLevel: riskLevelSchema,
  refrigerationRequired: z.boolean(),
  rationale: z.string().min(1).max(500),
});

export const createBatchSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(500).optional(),
  category: foodCategorySchema,
  cuisineId: z.string().min(1).optional(),
  dishId: z.string().min(1).optional(),
  quantityKg: z.coerce.number().positive().max(10_000),
  ambientTemperatureC: z.coerce.number().min(-20).max(80),
  preparedAt: z.string().min(1),
  storageMethod: storageMethodSchema,
  pickupAddress: z.string().trim().min(5).max(240),
  safeWindowHours: z.coerce.number().positive().max(168),
  riskLevel: riskLevelSchema,
  refrigerationRequired: z.coerce.boolean(),
});

export const updateBatchSchema = createBatchSchema.extend({
  id: z.string().min(1),
});

export const deleteBatchSchema = z.object({
  batchId: z.string().min(1),
});

export const claimBatchSchema = z.object({
  batchId: z.string().min(1),
  shelterName: z.string().trim().min(2).max(120).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["DONOR", "COURIER"]),
});

export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type UpdateBatchInput = z.infer<typeof updateBatchSchema>;
export type ClaimBatchInput = z.infer<typeof claimBatchSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ShelfLifeInputParsed = z.infer<typeof shelfLifeInputSchema>;
