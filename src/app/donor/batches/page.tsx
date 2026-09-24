import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DonorBatchTable } from "@/components/donor/donor-batch-table";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DonorBatchesPage() {
  const session = await getSession();
  if (!session || (session.role !== "DONOR" && session.role !== "ADMIN")) {
    redirect("/login?next=/donor/batches");
  }

  const rows = await prisma.foodBatch.findMany({
    where:
      session.role === "ADMIN"
        ? undefined
        : { donorId: session.id },
    include: {
      cuisine: { select: { name: true } },
      dish: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const batches = rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    quantityKg: row.quantityKg,
    expiresAt: row.expiresAt.toISOString(),
    cuisineName: row.cuisine?.name ?? null,
    dishName: row.dish?.name ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-800 pb-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">My batches</h1>
          <p className="text-sm text-zinc-400">
            Edit or delete AVAILABLE surplus before a courier claims it.
          </p>
        </div>
        <Button asChild>
          <Link href="/donor/new">List new surplus</Link>
        </Button>
      </div>
      <DonorBatchTable batches={batches} />
    </div>
  );
}
