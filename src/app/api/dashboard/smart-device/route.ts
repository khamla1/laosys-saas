import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const items = await prisma.smartDevice.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    const user = session.user as any;
    
    const body = await req.json();
    let { 
      deviceCode, name, type, model, serialNumber, 
      image, location, status, batteryLevel, firmwareVer, assignedAthlete 
    } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "ກະລຸນາປ້ອນຊື່ອຸປະກອນ ແລະ ປະເພດອຸປະກອນ" }, { status: 400 });
    }

    if (!deviceCode) {
      const typePrefix = type.substring(0, 3).toUpperCase();
      const randNum = Math.floor(1000 + Math.random() * 9000);
      deviceCode = `DEV-${typePrefix}-${randNum}`;
    }

    if (!serialNumber) {
      serialNumber = `SN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    }

    const existingCode = await prisma.smartDevice.findUnique({ where: { deviceCode } });
    if (existingCode) {
      return NextResponse.json({ error: "ລະຫັດອຸປະກອນນີ້ມີໃນລະບົບແລ້ວ" }, { status: 400 });
    }

    const currentStatus = status || "ONLINE";
    const initialHistory = [
      {
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        action: "REGISTER_DEVICE",
        fromStatus: null,
        toStatus: currentStatus,
        note: `ລົງທະບຽນອຸປະກອນໃໝ່ ${name} (${deviceCode})`,
        changedBy: {
          id: user.id || null,
          name: user.name || "Admin",
          email: user.email || "",
          role: user.role || "ADMIN"
        },
        changedAt: new Date().toISOString()
      }
    ];

    const newItem = await prisma.smartDevice.create({
      data: {
        deviceCode,
        name,
        type,
        model: model || "Standard Model",
        serialNumber,
        image: image || null,
        location: location || null,
        status: currentStatus,
        batteryLevel: batteryLevel !== undefined ? Number(batteryLevel) : 100,
        firmwareVer: firmwareVer || "v1.0.0",
        assignedAthlete: assignedAthlete || null,
        lastSync: new Date(),
        statusHistory: initialHistory,
        syncHistory: [
          {
            id: `sync-${Date.now()}`,
            syncedAt: new Date().toISOString(),
            dataPoints: 100,
            status: "INITIALIZED",
            syncedBy: user.name || "System"
          }
        ],
        organizationId
      }
    });

    try {
      await (prisma as any).auditLog?.create({
        data: {
          action: "CREATE_SMART_DEVICE",
          entity: "SmartDevice",
          entityId: newItem.id,
          userId: user.id || "system",
          userName: user.name || "Admin",
          organizationId,
          details: `ເພີ່ມອຸປະກອນອັດສະລິຍະ ${name} (${deviceCode})`
        }
      });
    } catch (_) {}

    return NextResponse.json(newItem);
  } catch (error: any) {
    console.error("SmartDevice POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
