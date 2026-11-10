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

    const items = await prisma.secondHandItem.findMany({
      where: { organizationId },
      orderBy: { receiveDate: 'desc' }
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
    
    const body = await req.json();

    if (body.action === "SEED_PRESETS") {
      const PRESETS = [
        {
          itemCode: "2ND-SPO-001",
          name: "ໄມ້ຕີແບດ Yonex Astrox 99 Pro (ສະພາບ 95%)",
          category: "ອຸປະກອນກິລາ",
          image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&auto=format&fit=crop&q=80",
          description: "ໄມ້ແບດມິນຕັນສະພາບງາມຫຼາຍ ຮອຍຂີດຂ່ວນໜ້ອຍ ພ້ອມເອັນ BG80 26lbs ແລະ ກຣິບໃໝ່",
          condition: "SLIGHTLY_USED",
          buyPrice: 1500000,
          sellPrice: 2400000,
          status: "AVAILABLE"
        },
        {
          itemCode: "2ND-BIK-002",
          name: "ລົດຖີບເສັ້ນທາງ Trek Emonda SL6 (ສະພາບດີເລີດ)",
          category: "ຍານພາຫະນະ & ກິລາ",
          image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&auto=format&fit=crop&q=80",
          description: "ເຟຣມຄາບອນນ້ຳໜັກເບົາ ຊຸດຂັບເຄື່ອນ Shimano Ultegra 11-Speed ຢາງໃໝ່",
          condition: "SLIGHTLY_USED",
          buyPrice: 18000000,
          sellPrice: 24500000,
          status: "AVAILABLE"
        },
        {
          itemCode: "2ND-GYM-003",
          name: "ດໍາເບວປັບນ້ຳໜັກ Bowflex 552 (ຄູ່ 2-24kg)",
          category: "ອຸປະກອນຟິດເນສ",
          image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80",
          description: "ດໍາເບວປັບນ້ຳໜັກອັດຕະໂນມັດ 5-52.5 lbs ພ້ອມຖານວາງ ສະພາບໃຊ້ງານປົກກະຕິ 100%",
          condition: "USED",
          buyPrice: 3200000,
          sellPrice: 4800000,
          status: "AVAILABLE"
        },
        {
          itemCode: "2ND-SHO-004",
          name: "ເກີບແລ່ນ Nike Vaporfly Next% 2 (Size 42)",
          category: "ເກີບ & ເສື້ອຜ້າ",
          image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80",
          description: "ເກີບແລ່ນມາຣາທອນພື້ນຄາບອນ ໃສ່ຊ້ອມພຽງ 2 ຄັ້ງ ສະພາບຄືໃໝ່ 98%",
          condition: "SLIGHTLY_USED",
          buyPrice: 2100000,
          sellPrice: 3300000,
          status: "AVAILABLE"
        },
        {
          itemCode: "2ND-PHO-005",
          name: "ໄອໂຟນ 13 Pro 128GB Sierra Blue (ສູນແທ້)",
          category: "ໄອທີ & ໂທລະສັບ",
          image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop&q=80",
          description: "ແບັດເຕີຣີ 87% ບໍ່ເຄີຍແກະສ້ອມ ບໍ່ຕິດໄອຄາວ ສະແກນໜ້າ Face ID ປົກກະຕິ",
          condition: "USED",
          buyPrice: 8500000,
          sellPrice: 11500000,
          status: "AVAILABLE"
        },
        {
          itemCode: "2ND-CAM-006",
          name: "ກ້ອງ Sony A7 III + Kit Lens 28-70mm",
          category: "ກ້ອງ & ວິດີໂອ",
          image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&auto=format&fit=crop&q=80",
          description: "ຊັດເຕີພຽງ 12,xxx ຮູບ ເຊັນເຊີສະອາດ ພ້ອມແບັດ 2 ກ້ອນ ແລະ ແທ່ນສາກ",
          condition: "SLIGHTLY_USED",
          buyPrice: 16000000,
          sellPrice: 21000000,
          status: "SOLD"
        }
      ];

      let createdCount = 0;
      for (const p of PRESETS) {
        const existing = await prisma.secondHandItem.findFirst({
          where: { organizationId, itemCode: p.itemCode }
        });
        if (!existing) {
          await prisma.secondHandItem.create({
            data: {
              ...p,
              organizationId
            }
          });
          createdCount++;
        }
      }

      return NextResponse.json({ success: true, count: createdCount });
    }

    const { itemCode, name, category, image, description, condition, buyPrice, sellPrice, status } = body;

    const newItem = await prisma.secondHandItem.create({
      data: {
        itemCode: itemCode || `2ND-${Date.now().toString().slice(-6)}`,
        name,
        category,
        image,
        description,
        condition: condition || "USED",
        buyPrice: Number(buyPrice) || 0,
        sellPrice: Number(sellPrice) || 0,
        status: status || "AVAILABLE",
        organizationId
      }
    });

    return NextResponse.json(newItem);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
