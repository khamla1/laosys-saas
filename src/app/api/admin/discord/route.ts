import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getDiscordConfig, invalidateDiscordConfigCache } from "@/lib/discord";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const config = await getDiscordConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error("[GET_DISCORD_SETTINGS_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      enabled,
      webhook1,
      webhook1Name,
      webhook2,
      webhook2Name,
      bot1Name,
      bot1Avatar,
      bot2Name,
      bot2Avatar,
      routeOrders,
      routeSecurity,
      routeAudit,
      routeRequests,
    } = body;

    const updates = [
      { key: "discord_enabled", value: String(Boolean(enabled)) },
      { key: "discord_webhook_1", value: String(webhook1 || "").trim() },
      { key: "discord_webhook_1_name", value: String(webhook1Name || "").trim() },
      { key: "discord_webhook_2", value: String(webhook2 || "").trim() },
      { key: "discord_webhook_2_name", value: String(webhook2Name || "").trim() },
      { key: "discord_bot_name_1", value: String(bot1Name || "LAOSYS Commercial Engine").trim() },
      { key: "discord_bot_avatar_1", value: String(bot1Avatar || "https://img.icons8.com/3d-fluency/375/shopping-cart.png").trim() },
      { key: "discord_bot_name_2", value: String(bot2Name || "LAOSYS Sentinel Guard").trim() },
      { key: "discord_bot_avatar_2", value: String(bot2Avatar || "https://img.icons8.com/3d-fluency/375/shield.png").trim() },
      { key: "discord_route_orders", value: String(routeOrders || "WEBHOOK_1") },
      { key: "discord_route_security", value: String(routeSecurity || "WEBHOOK_2") },
      { key: "discord_route_audit", value: String(routeAudit || "WEBHOOK_2") },
      { key: "discord_route_requests", value: String(routeRequests || "BOTH") },
    ];

    for (const item of updates) {
      await (prisma as any).$runCommandRaw({
        update: "Setting",
        updates: [
          {
            q: { key: item.key },
            u: { $set: { key: item.key, value: item.value, updatedAt: new Date() } },
            upsert: true,
          },
        ],
      });
    }

    invalidateDiscordConfigCache();
    const updated = await getDiscordConfig();

    return NextResponse.json({
      success: true,
      message: "ບັນທຶກການຕັ້ງຄ່າ Discord Webhooks & Bot Logos ສຳເລັດແລ້ວ!",
      config: updated,
    });
  } catch (error) {
    console.error("[POST_DISCORD_SETTINGS_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
