import Link from "next/link";
import { Leaf } from "lucide-react";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-[#09090B]/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-white">
          <Leaf className="h-5 w-5 text-emerald-500" />
          <span className="text-sm font-semibold tracking-tight">ZeroSpoil</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm" aria-label="Primary">
          {session?.role === "DONOR" || session?.role === "ADMIN" ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/donor/new">List Surplus</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/donor/batches">My Batches</Link>
              </Button>
            </>
          ) : null}
          {session?.role === "COURIER" || session?.role === "ADMIN" ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/dispatch">Dispatch</Link>
            </Button>
          ) : null}
          {session?.role === "ADMIN" ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin">Admin</Link>
            </Button>
          ) : null}

          {session ? (
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                Sign out · {session.role}
              </Button>
            </form>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
