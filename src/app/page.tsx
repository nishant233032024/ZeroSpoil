import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Timer, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-none border-b border-zinc-800 pb-16 pt-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(245,158,11,0.08),_transparent_45%)]"
        />
        <div className="relative max-w-2xl space-y-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
            ZeroSpoil
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Perishable surplus recovered before it spoils.
          </h1>
          <p className="max-w-xl text-base text-zinc-400">
            Connect kitchens to shelters with AI-safe shelf-life windows and
            race-condition-safe courier claims — a logistics engine, not a
            listing board.
          </p>
          <div className="flex flex-wrap gap-3">
            {session ? (
              <Button asChild size="lg">
                <Link href={session.role === "DONOR" ? "/donor/new" : "/dispatch"}>
                  Open workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg">
                <Link href="/login">
                  Enter platform
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" size="lg">
              <Link href="/dispatch">Live dispatch queue</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-8 md:grid-cols-3">
        <Feature
          icon={<ShieldCheck className="h-5 w-5 text-emerald-400" />}
          title="Atomic claims"
          body="Conditional SQL updates ensure only one courier reserves an AVAILABLE batch."
        />
        <Feature
          icon={<Timer className="h-5 w-5 text-amber-400" />}
          title="AI shelf-life"
          body="Category, temperature, prep time, and storage feed a structured safe-window engine."
        />
        <Feature
          icon={<Truck className="h-5 w-5 text-emerald-400" />}
          title="Role-aware routes"
          body="DONOR, COURIER, and ADMIN access enforced at the Next.js 16 proxy boundary."
        />
      </section>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="space-y-3 border-t border-zinc-800 pt-5">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <p className="text-sm leading-relaxed text-zinc-400">{body}</p>
    </div>
  );
}
