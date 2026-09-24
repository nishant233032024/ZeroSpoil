"use client";

import { useEffect, useState } from "react";
import { formatRemaining } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Props = {
  expiresAt: string;
};

export function CountdownBadge({ expiresAt }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const remainingMs = new Date(expiresAt).getTime() - now;
  const urgent = remainingMs > 0 && remainingMs < 90 * 60_000;
  const expired = remainingMs <= 0;

  if (expired) {
    return <Badge variant="danger">Expired</Badge>;
  }

  return (
    <Badge variant={urgent ? "amber" : "emerald"}>
      {urgent ? "Critical · " : "Fresh · "}
      {formatRemaining(remainingMs)}
    </Badge>
  );
}
