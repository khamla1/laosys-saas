import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const telegramSchema = z.object({
  chatId: z.string().optional().nullable(),
  enabled: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = telegramSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 });
    }

    const { chatId, enabled } = parsed.data;
    const organizationId = (session?.user as any)?.id; // Enforce security: always use session ID

    // Validation: Only numbers (and optional leading minus sign for groups)
    if (enabled && chatId) {
      const isValidChatId = /^-?\d+$/.test(chatId);
      if (!isValidChatId) {
        return NextResponse.json({ error: "Telegram Chat ID must be a valid number" }, { status: 400 });
      }
    }

    // Prevent empty Chat ID when enabled
    if (enabled && (!chatId || chatId.trim() === "")) {
      return NextResponse.json({ error: "Chat ID cannot be empty when Telegram is enabled." }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: organizationId },
      data: {
        telegramChatId: chatId || null,
        telegramEnabled: enabled
      }
    });

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Unknown";
    await prisma.auditLog.create({
      data: {
        action: "UPDATE_TELEGRAM_SETTINGS",
        details: `Updated Telegram settings: Enabled=${enabled}`,
        userId: organizationId,
        organizationId: (session?.user as any)?.organizationId,
        ipAddress: ip,
      }
    });

    return NextResponse.json({ success: true, telegramChatId: updatedUser.telegramChatId, telegramEnabled: updatedUser.telegramEnabled });
  } catch (error: any) {
    console.error("[API ERROR] [TELEGRAM_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
