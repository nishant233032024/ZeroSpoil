"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  claimBatchSchema,
  createBatchSchema,
  deleteBatchSchema,
  updateBatchSchema,
} from "@/lib/validations";
import type { ActionResult } from "@/lib/types";
import type { FoodBatch } from "@prisma/client";

function revalidateBatchPaths(batchId?: string): void {
  revalidatePath("/dispatch");
  revalidatePath("/donor/new");
  revalidatePath("/donor/batches");
  revalidatePath("/admin");
  if (batchId) {
    revalidatePath(`/donor/batches/${batchId}/edit`);
  }
}

export async function createFoodBatchAction(
  raw: unknown,
): Promise<ActionResult<FoodBatch>> {
  const session = await getSession();
  if (!session || (session.role !== "DONOR" && session.role !== "ADMIN")) {
    return { success: false, message: "Only donors can list surplus batches." };
  }

  const parsed = createBatchSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid batch payload.",
    };
  }

  const preparedAt = new Date(parsed.data.preparedAt);
  if (Number.isNaN(preparedAt.getTime())) {
    return { success: false, message: "Invalid preparation time." };
  }

  const expiresAt = new Date(
    preparedAt.getTime() + parsed.data.safeWindowHours * 3_600_000,
  );

  if (expiresAt.getTime() <= Date.now()) {
    return {
      success: false,
      message: "This batch already exceeds its safe window. Do not list it.",
    };
  }

  const batch = await prisma.foodBatch.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      cuisineId: parsed.data.cuisineId,
      dishId: parsed.data.dishId,
      quantityKg: parsed.data.quantityKg,
      ambientTemperatureC: parsed.data.ambientTemperatureC,
      preparedAt,
      storageMethod: parsed.data.storageMethod,
      pickupAddress: parsed.data.pickupAddress,
      safeWindowHours: parsed.data.safeWindowHours,
      riskLevel: parsed.data.riskLevel,
      refrigerationRequired: parsed.data.refrigerationRequired,
      expiresAt,
      status: "AVAILABLE",
      donorId: session.id,
    },
  });

  revalidateBatchPaths();

  return {
    success: true,
    message: "Surplus batch listed for recovery.",
    data: batch,
  };
}

export async function updateFoodBatchAction(
  raw: unknown,
): Promise<ActionResult<FoodBatch>> {
  const session = await getSession();
  if (!session || (session.role !== "DONOR" && session.role !== "ADMIN")) {
    return { success: false, message: "Only donors can update batches." };
  }

  const parsed = updateBatchSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid update payload.",
    };
  }

  const existing = await prisma.foodBatch.findUnique({
    where: { id: parsed.data.id },
  });

  if (!existing) {
    return { success: false, message: "Batch not found." };
  }

  if (existing.status !== "AVAILABLE") {
    return {
      success: false,
      message: "Only AVAILABLE batches can be edited.",
    };
  }

  if (session.role !== "ADMIN" && existing.donorId !== session.id) {
    return { success: false, message: "You can only edit your own batches." };
  }

  const preparedAt = new Date(parsed.data.preparedAt);
  if (Number.isNaN(preparedAt.getTime())) {
    return { success: false, message: "Invalid preparation time." };
  }

  const expiresAt = new Date(
    preparedAt.getTime() + parsed.data.safeWindowHours * 3_600_000,
  );

  if (expiresAt.getTime() <= Date.now()) {
    return {
      success: false,
      message: "Updated batch would already be past its safe window.",
    };
  }

  const batch = await prisma.foodBatch.update({
    where: { id: parsed.data.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      cuisineId: parsed.data.cuisineId,
      dishId: parsed.data.dishId,
      quantityKg: parsed.data.quantityKg,
      ambientTemperatureC: parsed.data.ambientTemperatureC,
      preparedAt,
      storageMethod: parsed.data.storageMethod,
      pickupAddress: parsed.data.pickupAddress,
      safeWindowHours: parsed.data.safeWindowHours,
      riskLevel: parsed.data.riskLevel,
      refrigerationRequired: parsed.data.refrigerationRequired,
      expiresAt,
    },
  });

  revalidateBatchPaths(batch.id);

  return {
    success: true,
    message: "Batch updated.",
    data: batch,
  };
}

export async function deleteFoodBatchAction(
  raw: unknown,
): Promise<ActionResult<{ batchId: string }>> {
  const session = await getSession();
  if (
    !session ||
    (session.role !== "DONOR" &&
      session.role !== "ADMIN" &&
      session.role !== "COURIER")
  ) {
    return { success: false, message: "Unauthorized." };
  }

  // Couriers cannot delete — only donor/admin
  if (session.role === "COURIER") {
    return { success: false, message: "Couriers cannot delete batches." };
  }

  const parsed = deleteBatchSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: "Invalid delete payload." };
  }

  const existing = await prisma.foodBatch.findUnique({
    where: { id: parsed.data.batchId },
  });

  if (!existing) {
    return { success: false, message: "Batch not found." };
  }

  if (session.role !== "ADMIN" && existing.donorId !== session.id) {
    return { success: false, message: "You can only delete your own batches." };
  }

  // Donors may only delete unclaimed AVAILABLE batches; admin may delete any terminal/available
  if (session.role === "DONOR" && existing.status !== "AVAILABLE") {
    return {
      success: false,
      message: "Only AVAILABLE batches can be deleted by donors.",
    };
  }

  if (
    session.role === "ADMIN" &&
    !["AVAILABLE", "EXPIRED", "DELIVERED"].includes(existing.status)
  ) {
    return {
      success: false,
      message: "Cannot delete an in-progress reserved/in-transit batch.",
    };
  }

  await prisma.foodBatch.delete({ where: { id: parsed.data.batchId } });

  revalidateBatchPaths(parsed.data.batchId);

  return {
    success: true,
    message: "Batch deleted.",
    data: { batchId: parsed.data.batchId },
  };
}

/**
 * Atomic claim: only one courier wins when status is still AVAILABLE.
 * Uses conditional UPDATE to eliminate double-claim race conditions.
 */
export async function claimBatchAction(
  raw: unknown,
): Promise<ActionResult<{ batchId: string }>> {
  const session = await getSession();
  if (!session || (session.role !== "COURIER" && session.role !== "ADMIN")) {
    return { success: false, message: "Only couriers can claim batches." };
  }

  const parsed = claimBatchSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: "Invalid claim payload." };
  }

  const { batchId, shelterName } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const affected = await tx.$executeRaw`
        UPDATE "FoodBatch"
        SET
          status = 'RESERVED',
          "claimedById" = ${session.id},
          "updatedAt" = NOW()
        WHERE id = ${batchId}
          AND status = 'AVAILABLE'
          AND "expiresAt" > NOW()
      `;

      if (affected === 0) {
        return null;
      }

      await tx.dispatchHandoff.create({
        data: {
          batchId,
          courierId: session.id,
          shelterName: shelterName ?? "Community Shelter",
          reservedAt: new Date(),
        },
      });

      return batchId;
    });

    if (!result) {
      return {
        success: false,
        message:
          "Batch already claimed, expired, or unavailable. Refresh the queue.",
      };
    }

    revalidateBatchPaths();

    return {
      success: true,
      message: "Batch reserved. Proceed to pickup.",
      data: { batchId: result },
    };
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        message: "Another courier already claimed this batch.",
      };
    }

    return {
      success: false,
      message: "Claim failed due to a server error. Try again.",
    };
  }
}

export async function markInTransitAction(
  batchId: string,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || (session.role !== "COURIER" && session.role !== "ADMIN")) {
    return { success: false, message: "Unauthorized." };
  }

  const updated = await prisma.foodBatch.updateMany({
    where: {
      id: batchId,
      claimedById: session.role === "ADMIN" ? undefined : session.id,
      status: "RESERVED",
    },
    data: { status: "IN_TRANSIT" },
  });

  if (updated.count === 0) {
    return { success: false, message: "Unable to mark batch in transit." };
  }

  await prisma.dispatchHandoff.updateMany({
    where: { batchId },
    data: { pickedUpAt: new Date() },
  });

  revalidatePath("/dispatch");
  return { success: true, message: "Batch marked in transit." };
}

export async function markDeliveredAction(
  batchId: string,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || (session.role !== "COURIER" && session.role !== "ADMIN")) {
    return { success: false, message: "Unauthorized." };
  }

  const updated = await prisma.foodBatch.updateMany({
    where: {
      id: batchId,
      claimedById: session.role === "ADMIN" ? undefined : session.id,
      status: "IN_TRANSIT",
    },
    data: { status: "DELIVERED" },
  });

  if (updated.count === 0) {
    return { success: false, message: "Unable to mark batch delivered." };
  }

  await prisma.dispatchHandoff.updateMany({
    where: { batchId },
    data: { deliveredAt: new Date() },
  });

  revalidatePath("/dispatch");
  revalidatePath("/admin");
  return { success: true, message: "Handoff complete — food rescued." };
}
