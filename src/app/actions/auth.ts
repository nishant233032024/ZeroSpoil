"use server";

import { compare, hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  clearSessionCookie,
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validations";
import type { ActionResult, SessionUser } from "@/lib/types";

export async function loginAction(
  raw: unknown,
): Promise<ActionResult<SessionUser>> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: "Invalid email or password format." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (!user) {
    return { success: false, message: "Invalid credentials." };
  }

  const valid = await compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { success: false, message: "Invalid credentials." };
  }

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  const token = await createSessionToken(sessionUser);
  await setSessionCookie(token);

  return {
    success: true,
    message: `Signed in as ${user.role}.`,
    data: sessionUser,
  };
}

export async function registerAction(
  raw: unknown,
): Promise<ActionResult<SessionUser>> {
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid registration.",
    };
  }

  const email = parsed.data.email.toLowerCase();
  const passwordHash = await hash(parsed.data.password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name,
        passwordHash,
        role: parsed.data.role,
      },
    });

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = await createSessionToken(sessionUser);
    await setSessionCookie(token);

    return {
      success: true,
      message: `Welcome — registered as ${user.role}.`,
      data: sessionUser,
    };
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { success: false, message: "An account with that email exists." };
    }
    return { success: false, message: "Registration failed. Try again." };
  }
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
