"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEMOS = [
  { email: "donor@zerospoil.dev", label: "Donor" },
  { email: "courier@zerospoil.dev", label: "Courier" },
  { email: "admin@zerospoil.dev", label: "Admin" },
] as const;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("courier@zerospoil.dev");
  const [password, setPassword] = useState("password123");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await loginAction({ email, password });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      const role = result.data?.role;
      if (next !== "/") {
        router.push(next);
      } else if (role === "DONOR") {
        router.push("/donor/new");
      } else if (role === "COURIER") {
        router.push("/dispatch");
      } else if (role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {DEMOS.map((demo) => (
          <Button
            key={demo.email}
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setEmail(demo.email);
              setPassword("password123");
            }}
          >
            {demo.label}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-xs text-zinc-500">
        Demo password for all seeded accounts:{" "}
        <code className="text-zinc-300">password123</code>
      </p>
    </form>
  );
}
