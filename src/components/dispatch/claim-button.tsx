"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { claimBatchAction } from "@/app/actions/batches";
import { Button } from "@/components/ui/button";
import type { DispatchBatchDTO } from "@/lib/types";

type Props = {
  batch: DispatchBatchDTO;
};

export function ClaimButton({ batch }: Props) {
  const router = useRouter();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    batch.status,
    (_current, next: typeof batch.status) => next,
  );
  const [pending, startTransition] = useTransition();

  const canClaim = optimisticStatus === "AVAILABLE";

  function onClaim() {
    startTransition(async () => {
      setOptimisticStatus("RESERVED");
      const result = await claimBatchAction({ batchId: batch.id });
      if (!result.success) {
        toast.error(result.message);
        router.refresh();
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  if (!canClaim) {
    return (
      <span className="text-xs text-zinc-500">
        {optimisticStatus === "RESERVED" ? "Reserved" : optimisticStatus}
      </span>
    );
  }

  return (
    <Button
      size="sm"
      variant="amber"
      disabled={pending}
      onClick={onClaim}
      aria-label={`Claim batch ${batch.title}`}
    >
      {pending ? "Claiming…" : "Claim"}
    </Button>
  );
}
