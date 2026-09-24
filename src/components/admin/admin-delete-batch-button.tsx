"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteFoodBatchAction } from "@/app/actions/batches";
import { Button } from "@/components/ui/button";

type Props = {
  batchId: string;
  title: string;
  deletable: boolean;
};

export function AdminDeleteBatchButton({ batchId, title, deletable }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!deletable) return null;

  function onDelete() {
    if (!window.confirm(`Delete “${title}”?`)) return;
    startTransition(async () => {
      const result = await deleteFoodBatchAction({ batchId });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <Button size="sm" variant="danger" disabled={pending} onClick={onDelete}>
      Delete
    </Button>
  );
}
