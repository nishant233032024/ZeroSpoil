import { getCuisineCatalog } from "@/lib/catalog";
import { SurplusForm } from "@/components/donor/surplus-form";

export const dynamic = "force-dynamic";

export default async function DonorNewPage() {
  const { cuisines, dishes } = await getCuisineCatalog();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2 border-b border-zinc-800 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          List surplus batch
        </h1>
        <p className="text-sm text-zinc-400">
          Pick an Indian cuisine and dish from the catalog, run AI shelf-life
          evaluation, then publish into the live dispatch queue.
        </p>
      </div>
      <SurplusForm cuisines={cuisines} dishes={dishes} />
    </div>
  );
}
