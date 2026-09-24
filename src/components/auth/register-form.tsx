"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { registerAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"DONOR" | "COURIER">("DONOR");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await registerAction({ name, email, password, role });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.push(role === "DONOR" ? "/donor/new" : "/dispatch");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-label="Create account">
      <div className="space-y-2">
        <Label htmlFor="reg-name">Name / kitchen</Label>
        <Input
          id="reg-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="organization"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-email">Email</Label>
        <Input
          id="reg-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-password">Password (min 8)</Label>
        <Input
          id="reg-password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-role">Role</Label>
        <select
          id="reg-role"
          className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white"
          value={role}
          onChange={(e) => setRole(e.target.value as "DONOR" | "COURIER")}
        >
          <option value="DONOR">Donor (kitchen)</option>
          <option value="COURIER">Courier</option>
        </select>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating…" : "Create account"}
      </Button>
    </form>
  );
}
