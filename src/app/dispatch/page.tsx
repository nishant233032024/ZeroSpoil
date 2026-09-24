import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DispatchQueue } from "@/components/dispatch/dispatch-queue";
import { DispatchPoller } from "@/components/dispatch/dispatch-poller";
import type { DispatchBatchDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DispatchPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/dispatch");
  }

  await prisma.foodBatch.updateMany({
    where: {
      status: { in: ["AVAILABLE", "RESERVED"] },
      expiresAt: { lt: new Date() },
    },
    data: { status: "EXPIRED" },
  });

  const rows = await prisma.foodBatch.findMany({
    where: {
      status: { in: ["AVAILABLE", "RESERVED", "IN_TRANSIT"] },
    },
    include: {
      donor: { select: { name: true } },
      cuisine: { select: { name: true } },
      dish: { select: { name: true, hindiName: true } },
    },
    orderBy: [{ expiresAt: "asc" }, { createdAt: "desc" }],
  });

  const batches: DispatchBatchDTO[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    quantityKg: row.quantityKg,
    status: row.status,
    riskLevel: row.riskLevel,
    expiresAt: row.expiresAt.toISOString(),
    pickupAddress: row.pickupAddress,
    safeWindowHours: row.safeWindowHours,
    refrigerationRequired: row.refrigerationRequired,
    preparedAt: row.preparedAt.toISOString(),
    claimedById: row.claimedById,
    donor: { name: row.donor.name },
    cuisine: row.cuisine ? { name: row.cuisine.name } : null,
    dish: row.dish
      ? { name: row.dish.name, hindiName: row.dish.hindiName }
      : null,
  }));

  return (
    <div className="space-y-6">
      <DispatchPoller />
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-800 pb-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Live dispatch queue
          </h1>
          <p className="text-sm text-zinc-400">
            Amber timers mark &lt;90-minute windows. Claims are atomic — only
            the first courier wins. Queue refreshes every 20s.
          </p>
        </div>
        <p className="text-xs uppercase tracking-wider text-zinc-500">
          {batches.length} active
        </p>
      </div>

      <DispatchQueue
        batches={batches}
        role={session.role}
        viewerId={session.id}
      />
    </div>
  );
}
