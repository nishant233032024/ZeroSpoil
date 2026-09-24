"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { deleteFoodBatchAction } from "@/app/actions/batches";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type DonorBatchRow = {
  id: string;
  title: string;
  status: string;
  quantityKg: number;
  expiresAt: string;
  cuisineName: string | null;
  dishName: string | null;
};

type Props = {
  batches: DonorBatchRow[];
};

export function DonorBatchTable({ batches }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete(batchId: string, title: string) {
    if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;

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

  if (batches.length === 0) {
    return (
      <p className="border border-dashed border-zinc-800 px-4 py-10 text-center text-sm text-zinc-500">
        No batches yet.{" "}
        <Link href="/donor/new" className="text-emerald-400 hover:underline">
          List surplus
        </Link>
      </p>
    );
  }

  return (
    <Table>
      <caption className="sr-only">Your surplus food batches</caption>
      <TableHeader>
        <TableRow>
          <TableHead>Batch</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {batches.map((batch) => (
          <TableRow key={batch.id}>
            <TableCell>
              <div className="space-y-1">
                <p className="font-medium text-white">{batch.title}</p>
                <p className="text-xs text-zinc-500">
                  {[batch.cuisineName, batch.dishName]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
              </div>
            </TableCell>
            <TableCell>{batch.quantityKg} kg</TableCell>
            <TableCell>
              <Badge
                variant={
                  batch.status === "AVAILABLE"
                    ? "emerald"
                    : batch.status === "EXPIRED"
                      ? "danger"
                      : "amber"
                }
              >
                {batch.status.replaceAll("_", " ")}
              </Badge>
            </TableCell>
            <TableCell className="text-xs text-zinc-400">
              {new Date(batch.expiresAt).toLocaleString()}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                {batch.status === "AVAILABLE" ? (
                  <>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/donor/batches/${batch.id}/edit`}>Edit</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={pending}
                      onClick={() => onDelete(batch.id, batch.title)}
                    >
                      Delete
                    </Button>
                  </>
                ) : (
                  <span className="text-xs text-zinc-600">Locked</span>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
