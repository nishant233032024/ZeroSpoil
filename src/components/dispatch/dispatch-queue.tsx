import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClaimButton } from "@/components/dispatch/claim-button";
import { CountdownBadge } from "@/components/dispatch/countdown-badge";
import { HandoffControls } from "@/components/dispatch/handoff-controls";
import type { DispatchBatchDTO } from "@/lib/types";
import type { Role } from "@prisma/client";

type Props = {
  batches: DispatchBatchDTO[];
  role: Role;
  viewerId: string;
};

function statusVariant(
  status: DispatchBatchDTO["status"],
): "default" | "emerald" | "amber" | "danger" {
  switch (status) {
    case "AVAILABLE":
      return "emerald";
    case "RESERVED":
    case "IN_TRANSIT":
      return "amber";
    case "EXPIRED":
      return "danger";
    default:
      return "default";
  }
}

export function DispatchQueue({ batches, role, viewerId }: Props) {
  if (batches.length === 0) {
    return (
      <p className="border border-dashed border-zinc-800 px-4 py-10 text-center text-sm text-zinc-500">
        No active batches in the recovery queue.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Batch</TableHead>
          <TableHead>Donor</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Window</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {batches.map((batch) => {
          const canHandoff =
            (role === "ADMIN" || batch.claimedById === viewerId) &&
            (batch.status === "RESERVED" || batch.status === "IN_TRANSIT");

          return (
            <TableRow key={batch.id}>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium text-white">{batch.title}</p>
                  <p className="text-xs text-zinc-500">
                    {batch.cuisine?.name
                      ? `${batch.cuisine.name} · `
                      : ""}
                    {batch.dish?.name
                      ? `${batch.dish.name} · `
                      : `${batch.category.replaceAll("_", " ")} · `}
                    {batch.pickupAddress}
                  </p>
                </div>
              </TableCell>
              <TableCell>{batch.donor.name}</TableCell>
              <TableCell>{batch.quantityKg} kg</TableCell>
              <TableCell>
                <CountdownBadge expiresAt={batch.expiresAt} />
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(batch.status)}>
                  {batch.status.replaceAll("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {batch.status === "AVAILABLE" ? (
                  <ClaimButton batch={batch} />
                ) : canHandoff ? (
                  <HandoffControls batchId={batch.id} status={batch.status} />
                ) : (
                  <span className="text-xs text-zinc-600">—</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
