import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";

export default function LoginPage() {
  return (
    <div className="mx-auto grid max-w-3xl gap-10 md:grid-cols-2">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-zinc-400">
            Use a seeded demo account or your own registered donor/courier login.
          </p>
        </div>
        <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </div>
      <div className="space-y-6 border-t border-zinc-800 pt-8 md:border-l md:border-t-0 md:pl-10 md:pt-0">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">Register</h2>
          <p className="text-sm text-zinc-400">
            Admin accounts are seeded only. Self-serve roles: Donor or Courier.
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
