import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(
  request: Request,
  context: any
) {
  const params = await context.params;
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser || !targetUser.email) {
      return new NextResponse("User not found or no email", { status: 404 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        identifier: targetUser.email,
        token,
        expires: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes validity
      }
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error("[IMPERSONATE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
