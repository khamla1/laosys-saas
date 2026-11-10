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

    const categories = await prisma.category.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });

    const products = await prisma.product.findMany({
      where: { organizationId },
      select: { category: true }
    });

    const countMap: Record<string, number> = {};
    products.forEach(p => {
      if (p.category) {
        countMap[p.category] = (countMap[p.category] || 0) + 1;
      }
    });

    const categoriesWithCount = categories.map(cat => ({
      ...cat,
      productCount: countMap[cat.name] || countMap[cat.id] || 0
    }));

    return NextResponse.json(categoriesWithCount);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const INDUSTRY_PRESETS: Record<string, Array<{ name: string; description: string; image?: string }>> = {
  RESTAURANT_CAFE: [
    { name: "ກາເຟ & ເຄື່ອງດື່ມຮ້ອນ (Coffee & Hot Drinks)", description: "ເອສເປຣສໂຊ, ລາເຕ້, ຄາປູຊິໂນ, ຊາຮ້ອນ", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&auto=format&fit=crop&q=80" },
    { name: "ຊາ & ເຄື່ອງດື່ມເຢັນ (Tea & Cold Drinks)", description: "ຊາຂຽວມັດຈະ, ຊານົມໄຕ້ຫວັນ, ນ້ຳໝາກໄມ້ສົດ", image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80" },
    { name: "ອາຫານຈານດຽວ (Main Courses)", description: "ເຂົ້າຜັດ, ຜັດກະເພົາ, ເຝີ, ເຂົ້າປຽກ, ສະເຕັກ", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80" },
    { name: "ຂອງກິນຫຼິ້ນ / ອາຫານວ່າງ (Appetizers & Snacks)", description: "ມັນຝຣັ່ງທອດ, ປີກໄກ່ທອດ, ຢໍຈືນ, ສະຫຼັດ", image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=400&auto=format&fit=crop&q=80" },
    { name: "ຂອງຫວານ & ເບເກີຣີ (Desserts & Bakery)", description: "ເຄັກ, ຄຣົວຊອງ, ໂທສຕ໌, ບິງຊູ, ໄອສະຄຣີມ", image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&auto=format&fit=crop&q=80" },
  ],
  RETAIL_MINIMART: [
    { name: "ເຂົ້າໜົມ & ຂອງຂົບຄ້ຽວ (Snacks & Confectionery)", description: "ມັນຝຣັ່ງກອບ, ເຂົ້າໜົມປັງ, ຊັອກໂກແລັດ, ລູກອົມ", image: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&auto=format&fit=crop&q=80" },
    { name: "ເຄື່ອງດື່ມບັນຈຸຂວດ/ກະປ໋ອງ (Bottled Beverages)", description: "ນ້ຳດື່ມ, ນ້ຳອັດລົມ, ເຄື່ອງດື່ມຊູກຳລັງ, ນົມກ່ອງ", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80" },
    { name: "ເຄື່ອງໃຊ້ປະຈຳວັນ (Personal Care & Household)", description: "ຢາຖູແຂ້ວ, ສະບູ, ແຊມພູ, ຜົງຊັກຟອກ, ກະດາດທິຊຊູ", image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&auto=format&fit=crop&q=80" },
    { name: "ອາຫານແຫ້ງ & ເຄື່ອງປຸງ (Groceries & Seasonings)", description: "ໝີ່ໄວໄວ, ປາກະປ໋ອງ, ນ້ຳມັນພືດ, ນ້ຳປາ, ຊອດປຸງລົດ", image: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=400&auto=format&fit=crop&q=80" },
  ],
  FASHION_APPAREL: [
    { name: "ເສື້ອຍືດ & ເສື້ອເຊີດ (T-Shirts & Shirts)", description: "ເສື້ອໂປໂລ, ເສື້ອເຊີດແຂນຍາວ, ເສື້ອຍືດຄໍກົມ", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80" },
    { name: "ໂສ້ງ & ກະໂປງ (Pants & Skirts)", description: "ໂສ້ງຢີນສ໌, ໂສ້ງສະແລັກ, ໂສ້ງຂາສັ້ນ, ກະໂປງແຟຊັ່ນ", image: "https://images.unsplash.com/photo-1542272604-780c96856592?w=400&auto=format&fit=crop&q=80" },
    { name: "ເກີບ & ຖົງຕີນ (Shoes & Footwear)", description: "ເກີບຜ້າໃບ, ເກີບໜັງ, ເກີບແຕະ, ຖົງຕີນກິລາ", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&auto=format&fit=crop&q=80" },
    { name: "ກະເປົາ & ເຄື່ອງປະດັບ (Bags & Accessories)", description: "ກະເປົາສະພາຍ, ສາຍແອວ, ໝວກ, ແວ່ນຕາກັນແດດ", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&auto=format&fit=crop&q=80" },
  ],
  SPORTS_FITNESS: [
    { name: "ອຸປະກອນອອກກຳລັງກາຍ (Gym & Fitness Gear)", description: "ດໍາເບວ, ເສື່ອໂຢຄະ, ສາຍແຮງຕ້ານ, ໂຟມໂຣລເລີ", image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80" },
    { name: "ຊຸດກິລາ (Sportswear & Apparel)", description: "ເສື້ອກິລາ, ໂສ້ງວອມ, ສະປອດບຣາ, ຜ້າຮັດຂໍ້ມື", image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&auto=format&fit=crop&q=80" },
    { name: "ອຸປະກອນແບດມິນຕັນ & ເທນນິສ (Rackets & Balls)", description: "ໄມ້ຕີແບດ, ລູກຂົນໄກ່, ໄມ້ເທນນິສ, ລູກບານ", image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&auto=format&fit=crop&q=80" },
    { name: "ອາຫານເສີມ & ໂພຊະນາການ (Supplements & Nutrition)", description: "ເວໂປຣຕິນ, ຄຣີເອທີນ, ວິຕາມິນລວມ, ບາພະລັງງານ", image: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=400&auto=format&fit=crop&q=80" },
  ],
  TECH_ELECTRONICS: [
    { name: "ສະມາດໂຟນ & ແທັບເລັດ (Smartphones & Tablets)", description: "ໂທລະສັບມືຖື, ແທັບເລັດ, ໄອແພັດ", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop&q=80" },
    { name: "ອຸປະກອນເສີມໄອທີ (Accessories & Gadgets)", description: "ສາຍສາກ, ຫົວສາກໄວ, ພາວເວີແບງ, ຟີມກັນຮອຍ, ເຄສ", image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&auto=format&fit=crop&q=80" },
    { name: "ຫູຟັງ & ລຳໂພງ (Audio & Headphones)", description: "ຫູຟັງບລູທູດ, ລຳໂພງໄຮ້ສາຍ, ຫູຟັງ Gaming", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80" },
  ]
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const body = await req.json();

    if (body.action === "SEED_PRESETS") {
      const industry = body.industry || "RESTAURANT_CAFE";
      const presetList = INDUSTRY_PRESETS[industry] || INDUSTRY_PRESETS.RESTAURANT_CAFE;
      let createdCount = 0;

      for (const item of presetList) {
        const existing = await prisma.category.findFirst({
          where: { organizationId, name: item.name }
        });
        if (!existing) {
          await prisma.category.create({
            data: {
              name: item.name,
              description: item.description,
              image: item.image || null,
              status: "ACTIVE",
              organizationId
            }
          });
          createdCount++;
        }
      }

      return NextResponse.json({ success: true, count: createdCount });
    }

    const { name, description, image, status } = body;

    if (!name || !name.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        image: image?.trim() || null,
        status: status || "ACTIVE",
        organizationId
      }
    });

    return NextResponse.json(category);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
