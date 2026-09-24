"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  markDeliveredAction,
  markInTransitAction,
} from "@/app/actions/batches";
import { Button } from "@/components/ui/button";
import type { BatchStatus } from "@prisma/client";

type Props = {
  batchId: string;
  status: BatchStatus;
};

export function HandoffControls({ batchId, status }: Props) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [pending, startTransition] = useTransition();

  function run(
    action: (id: string) => Promise<{ success: boolean; message: string }>,
    next: BatchStatus,
  ) {
    startTransition(async () => {
      setOptimistic(next);
      const result = await action(batchId);
      if (!result.success) {
        toast.error(result.message);
        router.refresh();
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  if (optimistic === "RESERVED") {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => run(markInTransitAction, "IN_TRANSIT")}
      >
        Pick up
      </Button>
    );
  }

  if (optimistic === "IN_TRANSIT") {
    return (
      <Button
        size="sm"
        disabled={pending}
        onClick={() => run(markDeliveredAction, "DELIVERED")}
      >
        Delivered
      </Button>
    );
  }

  return null;
}
