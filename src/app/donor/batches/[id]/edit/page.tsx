import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCuisineCatalog } from "@/lib/catalog";
import { EditBatchForm } from "@/components/donor/edit-batch-form";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditBatchPage({ params }: PageProps) {
  const session = await getSession();
  if (!session || (session.role !== "DONOR" && session.role !== "ADMIN")) {
    redirect("/login?next=/donor/batches");
  }

  const { id } = await params;
  const batch = await prisma.foodBatch.findUnique({ where: { id } });

  if (!batch) notFound();
  if (session.role !== "ADMIN" && batch.donorId !== session.id) {
    redirect("/donor/batches");
  }
  if (batch.status !== "AVAILABLE") {
    redirect("/donor/batches");
  }

  const { cuisines, dishes } = await getCuisineCatalog();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2 border-b border-zinc-800 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Edit batch</h1>
        <p className="text-sm text-zinc-400">
          Updates are allowed only while status is AVAILABLE.
        </p>
      </div>
      <EditBatchForm
        batch={{
          id: batch.id,
          title: batch.title,
          description: batch.description,
          category: batch.category,
          cuisineId: batch.cuisineId,
          dishId: batch.dishId,
          quantityKg: batch.quantityKg,
          ambientTemperatureC: batch.ambientTemperatureC,
          preparedAt: batch.preparedAt.toISOString(),
          storageMethod: batch.storageMethod,
          pickupAddress: batch.pickupAddress,
          safeWindowHours: batch.safeWindowHours,
          riskLevel: batch.riskLevel,
          refrigerationRequired: batch.refrigerationRequired,
        }}
        cuisines={cuisines}
        dishes={dishes}
      />
    </div>
  );
}
