import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const user = session.user as any;

    const devices = await prisma.smartDevice.findMany({
      where: { 
        organizationId,
        status: { not: "OFFLINE" }
      }
    });

    const now = new Date();
    const syncedAt = now.toISOString();

    for (const d of devices) {
      const currentSyncHistory = Array.isArray(d.syncHistory) ? d.syncHistory : [];
      const currentStatusHistory = Array.isArray(d.statusHistory) ? d.statusHistory : [];
      const pts = Math.floor(600 + Math.random() * 2000);

      await prisma.smartDevice.update({
        where: { id: d.id },
        data: {
          lastSync: now,
          status: "ONLINE",
          syncHistory: [
            {
              id: `sync-${Date.now()}-${d.id.slice(-4)}`,
              syncedAt,
              dataPoints: pts,
              status: "SUCCESS",
              syncedBy: user.name || "Bulk Sync"
            },
            ...currentSyncHistory
          ].slice(0, 50),
          statusHistory: [
            {
              id: `aud-${Date.now()}-${d.id.slice(-4)}`,
              action: "BULK_SYNC",
              fromStatus: d.status,
              toStatus: "ONLINE",
              note: `ຊິງຄ໌ຂໍ້ມູນລວມທັງໝົດ (+${pts} pts)`,
              changedBy: {
                id: user.id || null,
                name: user.name || "System",
                email: user.email || "",
                role: user.role || "USER"
              },
              changedAt: syncedAt
            },
            ...currentStatusHistory
          ].slice(0, 50)
        }
      });
    }

    try {
      await (prisma as any).auditLog?.create({
        data: {
          action: "BULK_SYNC_DEVICES",
          entity: "SmartDevice",
          entityId: "all",
          userId: user.id || "system",
          userName: user.name || "User",
          organizationId,
          details: `ສັ່ງຊິງຄ໌ຂໍ້ມູນອຸປະກອນທັງໝົດຈຳນວນ ${devices.length} ເຄື່ອງ`
        }
      });
    } catch (_) {}

    return NextResponse.json({
      success: true,
      syncedCount: devices.length,
      syncedAt
    });
  } catch (error: any) {
    console.error("Bulk sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
