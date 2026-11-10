import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { updateUserSchema } from "@/lib/validations";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // 1. Authentication Check (Already handled partially by Middleware, but best practice to double-check here)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // 2. IDOR Protection (User can only fetch their own record)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        // Notice we DO NOT select passwords, lockout tokens, or sensitive internal data
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Fetch User Error:", error);
    // 3. Safe Error Handling: Do not leak DB stack traces
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();

    // 1. Zod Validation & Sanitization
    const validData = updateUserSchema.parse(body);

    // 2. IDOR Protection: Hardcode the `where` clause to the session user ID, 
    // ensuring they cannot update another user's profile even if they pass `id` in the body.
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: validData,
      select: {
        id: true,
        name: true,
        email: true,
      }
    });

    return NextResponse.json({ message: "Profile updated successfully", user: updatedUser });

  } catch (error) {
    // 3. Safe Error Handling
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors[0]?.message || "Validation Error" }, { status: 400 });
    }
    
    console.error("Update User Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
