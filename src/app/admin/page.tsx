import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminDeleteBatchButton } from "@/components/admin/admin-delete-batch-button";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login?next=/admin");
  }

  const [users, batches, handoffs] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.foodBatch.findMany({
      include: {
        donor: { select: { name: true } },
        claimedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.dispatchHandoff.count(),
  ]);

  const byStatus = batches.reduce<Record<string, number>>((acc, batch) => {
    acc[batch.status] = (acc[batch.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-10">
      <div className="space-y-2 border-b border-zinc-800 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Admin console</h1>
        <p className="text-sm text-zinc-400">
          Oversight of users, batch lifecycle, and completed handoffs.
        </p>
      </div>

      <div className="flex flex-wrap gap-6 text-sm">
        <Stat label="Users" value={String(users.length)} />
        <Stat label="Tracked batches" value={String(batches.length)} />
        <Stat label="Handoffs" value={String(handoffs)} />
        {Object.entries(byStatus).map(([status, count]) => (
          <Stat key={status} label={status} value={String(count)} />
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Users
        </h2>
        <Table>
          <caption className="sr-only">Registered platform users</caption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      user.role === "ADMIN"
                        ? "amber"
                        : user.role === "COURIER"
                          ? "emerald"
                          : "default"
                    }
                  >
                    {user.role}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Recent batches
        </h2>
        <Table>
          <caption className="sr-only">Recent food batches</caption>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Donor</TableHead>
              <TableHead>Courier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch) => (
              <TableRow key={batch.id}>
                <TableCell>{batch.title}</TableCell>
                <TableCell>{batch.donor.name}</TableCell>
                <TableCell>{batch.claimedBy?.name ?? "—"}</TableCell>
                <TableCell>{batch.status}</TableCell>
                <TableCell>{batch.riskLevel}</TableCell>
                <TableCell className="text-right">
                  <AdminDeleteBatchButton
                    batchId={batch.id}
                    title={batch.title}
                    deletable={["AVAILABLE", "EXPIRED", "DELIVERED"].includes(
                      batch.status,
                    )}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[7rem] border-l border-zinc-800 pl-4">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}
