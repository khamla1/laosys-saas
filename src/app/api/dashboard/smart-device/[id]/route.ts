import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    const { id } = await params;

    const existing = await prisma.smartDevice.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json(existing);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    const user = session.user as any;
    const { id } = await params;

    const existing = await prisma.smartDevice.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    const body = await req.json();
    const { action, auditNote } = body;

    const currentStatusHistory = Array.isArray(existing.statusHistory) ? existing.statusHistory : [];
    const currentSyncHistory = Array.isArray(existing.syncHistory) ? existing.syncHistory : [];

    // Handle Quick Action: SYNC
    if (action === "SYNC") {
      const randomPoints = Math.floor(500 + Math.random() * 2500);
      const syncRecord = {
        id: `sync-${Date.now()}`,
        syncedAt: new Date().toISOString(),
        dataPoints: randomPoints,
        status: "SUCCESS",
        syncedBy: user.name || "User"
      };

      const statusAudit = {
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        action: "SYNC_DATA",
        fromStatus: existing.status,
        toStatus: "ONLINE",
        note: `ຊິງຄ໌ຂໍ້ມູນອຸປະກອນສຳເລັດ (+${randomPoints} data points)`,
        changedBy: {
          id: user.id || null,
          name: user.name || "User",
          email: user.email || "",
          role: user.role || "USER"
        },
        changedAt: new Date().toISOString()
      };

      const updated = await prisma.smartDevice.update({
        where: { id },
        data: {
          lastSync: new Date(),
          status: "ONLINE",
          syncHistory: [syncRecord, ...currentSyncHistory].slice(0, 50),
          statusHistory: [statusAudit, ...currentStatusHistory].slice(0, 50)
        }
      });

      return NextResponse.json(updated);
    }

    // Normal Update or Status Change
    const newStatus = body.status !== undefined ? body.status : existing.status;
    const statusChanged = newStatus !== existing.status;

    const statusAudit = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action: statusChanged ? "STATUS_CHANGE" : "UPDATE_DEVICE",
      fromStatus: existing.status,
      toStatus: newStatus,
      note: auditNote || (statusChanged ? `ປ່ຽນສະຖານະຈາກ ${existing.status} ເປັນ ${newStatus}` : "ອັບເດດຂໍ້ມູນອຸປະກອນ"),
      changedBy: {
        id: user.id || null,
        name: user.name || "Admin",
        email: user.email || "",
        role: user.role || "ADMIN"
      },
      changedAt: new Date().toISOString()
    };

    const updated = await prisma.smartDevice.update({
      where: { id },
      data: {
        deviceCode: body.deviceCode ?? existing.deviceCode,
        name: body.name ?? existing.name,
        type: body.type ?? existing.type,
        model: body.model ?? existing.model,
        serialNumber: body.serialNumber ?? existing.serialNumber,
        image: body.image !== undefined ? body.image : existing.image,
        location: body.location !== undefined ? body.location : existing.location,
        status: newStatus,
        batteryLevel: body.batteryLevel !== undefined ? Number(body.batteryLevel) : existing.batteryLevel,
        firmwareVer: body.firmwareVer ?? existing.firmwareVer,
        assignedAthlete: body.assignedAthlete !== undefined ? body.assignedAthlete : existing.assignedAthlete,
        statusHistory: [statusAudit, ...currentStatusHistory].slice(0, 50)
      }
    });

    try {
      await (prisma as any).auditLog?.create({
        data: {
          action: "UPDATE_SMART_DEVICE",
          entity: "SmartDevice",
          entityId: id,
          userId: user.id || "system",
          userName: user.name || "Admin",
          organizationId,
          details: `ອັບເດດອຸປະກອນ ${updated.name} (ສະຖານະ: ${newStatus})`
        }
      });
    } catch (_) {}

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("SmartDevice PUT Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    const user = session.user as any;
    const { id } = await params;

    const existing = await prisma.smartDevice.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    await prisma.smartDevice.delete({ where: { id } });

    try {
      await (prisma as any).auditLog?.create({
        data: {
          action: "DELETE_SMART_DEVICE",
          entity: "SmartDevice",
          entityId: id,
          userId: user.id || "system",
          userName: user.name || "Admin",
          organizationId,
          details: `ລົບອຸປະກອນ ${existing.name} (${existing.deviceCode})`
        }
      });
    } catch (_) {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
