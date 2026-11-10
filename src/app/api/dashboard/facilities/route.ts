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

    const [items, org] = await Promise.all([
      prisma.facilityBooking.findMany({
        where: { organizationId },
        orderBy: { startTime: "asc" },
      }),
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          id: true,
          name: true,
          logo: true,
          metadata: true,
        },
      }),
    ]);

    const orgMeta = (org?.metadata as any) || {};
    const store = {
      name: org?.name || "ສະໜາມກິລາ & ຄອດມາດຕະຖານ",
      logo: org?.logo || null,
      phone: orgMeta.phone || orgMeta.tel || null,
      address: orgMeta.address || orgMeta.location || null,
      tagline: orgMeta.tagline || "Sports Complex & Facility Booking",
    };

    return NextResponse.json({ items, store });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const body = await req.json();

    // 1-Click Seed Presets for Facilities & Courts
    if (body.action === "SEED_PRESETS") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const presets = [
        {
          facilityName: "ສະໜາມບານເຕະ VIP 1 (ຫຍ້າທຽມໃນຮົ່ມ 7 ຄົນ · ₭200,000/ຊມ)",
          customerName: "ທີມ Lao Star FC (020 5567 8991)",
          startTime: new Date(today.getTime() + 18 * 3600 * 1000), // 18:00
          endTime: new Date(today.getTime() + 20 * 3600 * 1000),   // 20:00
          status: "CONFIRMED",
        },
        {
          facilityName: "ຄອດຕີດອກປີກໄກ່ Court A1 (ພື້ນຢາງມາດຕະຖານ · ₭60,000/ຊມ)",
          customerName: "ທ່ານ ສົມສັກ ໄຊຍະວົງ (020 9988 7766)",
          startTime: new Date(now.getTime() - 30 * 60 * 1000),     // 30 mins ago
          endTime: new Date(now.getTime() + 90 * 60 * 1000),      // +1.5 hrs
          status: "IN_USE",
        },
        {
          facilityName: "ຄອດຕີດອກປີກໄກ່ Court A2 (ພື້ນຢາງມາດຕະຖານ · ₭60,000/ຊມ)",
          customerName: "ສະໂມສອນ ດອກປີກໄກ່ນະຄອນຫຼວງ (020 7712 3456)",
          startTime: new Date(today.getTime() + 17 * 3600 * 1000),
          endTime: new Date(today.getTime() + 19 * 3600 * 1000),
          status: "CONFIRMED",
        },
        {
          facilityName: "ສະໜາມເທັນນິດ Hard Court 1 (ສະໜາມກາງແຈ້ງ · ₭120,000/ຊມ)",
          customerName: "ທ່ານ ອາລຸນເດດ ພົມມະຈັນ (020 5511 2233)",
          startTime: new Date(today.getTime() + 7 * 3600 * 1000),
          endTime: new Date(today.getTime() + 9 * 3600 * 1000),
          status: "COMPLETED",
        },
        {
          facilityName: "ສະໜາມບານບ້ວງ Indoor VIP (ມາດຕະຖານ FIBA · ₭150,000/ຊມ)",
          customerName: "ທີມ Vientiane Dunkers (020 5544 3322)",
          startTime: new Date(today.getTime() + 19.5 * 3600 * 1000),
          endTime: new Date(today.getTime() + 21.5 * 3600 * 1000),
          status: "CONFIRMED",
        },
        {
          facilityName: "ຫ້ອງສະຕູດີໂອໂຢຄະ & ຟິດເນັດ (ຫ້ອງແອ Studio 1 · ₭100,000/ຊມ)",
          customerName: "ຄູຝຶກ ນາງ ວັນນີ ພິມມະສອນ (020 2233 4455)",
          startTime: new Date(today.getTime() + 10 * 3600 * 1000),
          endTime: new Date(today.getTime() + 12 * 3600 * 1000),
          status: "COMPLETED",
        },
        {
          facilityName: "ສະໜາມບານເຕະ VIP 2 (ມາດຕະຖານ 7 ຄົນ · ₭250,000/ຊມ)",
          customerName: "ທີມ ຊ້າງແດງ United (020 9123 4567)",
          startTime: new Date(today.getTime() + 24 * 3600 * 1000 + 18 * 3600 * 1000), // tomorrow 18:00
          endTime: new Date(today.getTime() + 24 * 3600 * 1000 + 20 * 3600 * 1000),   // tomorrow 20:00
          status: "CONFIRMED",
        },
        {
          facilityName: "ຫ້ອງ VIP ປິ່ງປ່ອງ & ສະນຸກເກີ (VIP Table · ₭70,000/ຊມ)",
          customerName: "ທ່ານ ທອງຄຳ ແກ້ວມະນີ (020 5889 9001)",
          startTime: new Date(today.getTime() + 14 * 3600 * 1000),
          endTime: new Date(today.getTime() + 15.5 * 3600 * 1000),
          status: "CANCELLED",
        },
      ];

      const created = await Promise.all(
        presets.map((p) =>
          prisma.facilityBooking.create({
            data: {
              ...p,
              organizationId,
            },
          })
        )
      );

      return NextResponse.json({
        success: true,
        count: created.length,
        items: created,
      });
    }

    const { facilityName, customerName, startTime, endTime, status } = body;

    if (!facilityName || !customerName) {
      return NextResponse.json(
        { error: "ກະລຸນາປ້ອນຊື່ສະໜາມ/ຄອດ ແລະ ຊື່ລູກຄ້າໃຫ້ຄົບຖ້ວນ" },
        { status: 400 }
      );
    }

    const newItem = await prisma.facilityBooking.create({
      data: {
        facilityName,
        customerName,
        startTime: startTime ? new Date(startTime) : new Date(),
        endTime: endTime ? new Date(endTime) : new Date(Date.now() + 2 * 60 * 60 * 1000),
        status: status || "CONFIRMED",
        organizationId,
      },
    });

    return NextResponse.json(newItem);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
