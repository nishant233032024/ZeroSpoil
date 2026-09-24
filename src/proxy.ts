import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import type { Role } from "@prisma/client";

const SESSION_COOKIE = "zerospoil_session";

type RouteRule = {
  prefix: string;
  roles: Role[];
};

const PROTECTED_ROUTES: RouteRule[] = [
  { prefix: "/donor", roles: ["DONOR", "ADMIN"] },
  { prefix: "/dispatch", roles: ["COURIER", "ADMIN"] },
  { prefix: "/admin", roles: ["ADMIN"] },
];

async function readRole(request: NextRequest): Promise<Role | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );
    if (typeof payload.role !== "string") return null;
    return payload.role as Role;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const rule = PROTECTED_ROUTES.find((entry) =>
    pathname.startsWith(entry.prefix),
  );

  if (!rule) {
    return NextResponse.next();
  }

  const role = await readRole(request);

  if (!role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!rule.roles.includes(role)) {
    const homeUrl = new URL("/", request.url);
    homeUrl.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/donor/:path*", "/dispatch/:path*", "/admin/:path*"],
};
