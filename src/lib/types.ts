import type {
  BatchStatus,
  FoodBatch,
  FoodCategory,
  RiskLevel,
  Role,
  StorageMethod,
  User,
} from "@prisma/client";

export type ActionResult<T = undefined> = {
  success: boolean;
  message: string;
  data?: T;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type ShelfLifeEvaluation = {
  safeWindowHours: number;
  riskLevel: RiskLevel;
  refrigerationRequired: boolean;
  rationale: string;
};

export type ShelfLifeInput = {
  category: FoodCategory;
  ambientTemperatureC: number;
  preparedAt: string;
  storageMethod: StorageMethod;
};

export type FoodBatchWithRelations = FoodBatch & {
  donor: Pick<User, "id" | "name" | "email">;
  claimedBy: Pick<User, "id" | "name" | "email"> | null;
};

/** Serializable shape for client components (dates as ISO strings). */
export type DispatchBatchDTO = {
  id: string;
  title: string;
  category: FoodCategory;
  quantityKg: number;
  status: BatchStatus;
  riskLevel: RiskLevel;
  expiresAt: string;
  pickupAddress: string;
  safeWindowHours: number;
  refrigerationRequired: boolean;
  preparedAt: string;
  claimedById: string | null;
  donor: { name: string };
  cuisine: { name: string } | null;
  dish: { name: string; hindiName: string | null } | null;
};

export type BatchStatusValue = BatchStatus;
