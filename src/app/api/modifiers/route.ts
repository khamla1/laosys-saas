import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const DEFAULT_PRESETS = [
  {
    name: "ລະດັບຄວາມຫວານ (Sweetness Level)",
    isRequired: true,
    minSelections: 1,
    maxSelections: 1,
    modifiers: [
      { name: "ຫວານ 100% (ມາດຕະຖານ)", price: 0 },
      { name: "ຫວານນ້ອຍ 50%", price: 0 },
      { name: "ຫວານໜ້ອຍຫຼາຍ 25%", price: 0 },
      { name: "ບໍ່ຫວານ 0%", price: 0 },
    ]
  },
  {
    name: "ຂະໜາດແກ້ວ (Cup / Serving Size)",
    isRequired: true,
    minSelections: 1,
    maxSelections: 1,
    modifiers: [
      { name: "ຂະໜາດມາດຕະຖານ (Regular 16oz)", price: 0 },
      { name: "ຂະໜາດໃຫຍ່ (Large 22oz)", price: 5000 },
      { name: "ແກ້ວໃຫຍ່ພິເສດ (Jumbo 32oz)", price: 10000 },
    ]
  },
  {
    name: "ທັອບປິ້ງພິເສດ (Extra Toppings)",
    isRequired: false,
    minSelections: 0,
    maxSelections: 5,
    modifiers: [
      { name: "ໄຂ່ມຸກບາບາວ (Boba Pearls)", price: 5000 },
      { name: "ວຸ້ນໝາກພ້າວ (Coconut Jelly)", price: 5000 },
      { name: "ວິບຄຣີມນົມສົດ (Whipped Cream)", price: 7000 },
      { name: "ເພີ່ມຊັອດກາເຟ (Extra Espresso Shot)", price: 8000 },
      { name: "ເນີຍແຂງ / ຊີສ (Cheese Foam)", price: 8000 },
    ]
  },
  {
    name: "ລະດັບຄວາມເຜັດ (Spiciness Level)",
    isRequired: false,
    minSelections: 0,
    maxSelections: 1,
    modifiers: [
      { name: "ບໍ່ເຜັດ (Non-Spicy / Mild)", price: 0 },
      { name: "ເຜັດປານກາງ (Medium)", price: 0 },
      { name: "ເຜັດຫຼາຍ (Hot & Spicy)", price: 0 },
      { name: "ເຜັດພິເສດ (Extra Hot)", price: 2000 },
    ]
  },
  {
    name: "ປະເພດຊີ້ນ / ເຄື່ອງຄຽງ (Protein / Meat Option)",
    isRequired: true,
    minSelections: 1,
    maxSelections: 1,
    modifiers: [
      { name: "ຊີ້ນໝູ (Pork)", price: 0 },
      { name: "ຊີ້ນໄກ່ (Chicken)", price: 0 },
      { name: "ຊີ້ນງົວ (Beef)", price: 10000 },
      { name: "ອາຫານທະເລ (Seafood)", price: 15000 },
    ]
  }
];

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;
    const { searchParams } = new URL(request.url);
    const withCatalog = searchParams.get("catalog") === "true";

    const modifierGroups = await prisma.modifierGroup.findMany({
      where: { organizationId },
      include: {
        modifiers: {
          orderBy: { price: "asc" },
        },
        products: {
          select: {
            id: true,
            name: true,
            images: true,
            category: true,
            price: true,
          }
        }
      },
      orderBy: { name: "asc" },
    });

    if (withCatalog) {
      const availableProducts = await prisma.product.findMany({
        where: { organizationId, status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          images: true,
          category: true,
          price: true,
        },
        orderBy: { name: "asc" },
        take: 300,
      });

      return NextResponse.json({
        groups: modifierGroups,
        availableProducts,
      });
    }

    return NextResponse.json(modifierGroups);
  } catch (error) {
    console.error("[MODIFIERS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const organizationId = (session.user as any).organizationId;
    const body = await request.json();

    // 1. Preset Batch Generation Action
    if (body.action === "SEED_PRESETS") {
      const createdGroups = [];
      for (const preset of DEFAULT_PRESETS) {
        // Check if group with same name already exists
        const existing = await prisma.modifierGroup.findFirst({
          where: { organizationId, name: preset.name }
        });

        if (!existing) {
          const group = await prisma.modifierGroup.create({
            data: {
              name: preset.name,
              isRequired: preset.isRequired,
              minSelections: preset.minSelections,
              maxSelections: preset.maxSelections,
              organizationId,
              modifiers: {
                create: preset.modifiers.map(m => ({
                  name: m.name,
                  price: m.price,
                }))
              }
            },
            include: {
              modifiers: true,
            }
          });
          createdGroups.push(group);
        }
      }

      return NextResponse.json({
        success: true,
        createdCount: createdGroups.length,
        groups: createdGroups
      });
    }

    // 2. Standard Group Creation
    const { name, isRequired, minSelections, maxSelections, productIds, modifiers } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const group = await prisma.modifierGroup.create({
      data: {
        name,
        isRequired: isRequired || false,
        minSelections: minSelections ? parseInt(minSelections) : 0,
        maxSelections: maxSelections ? parseInt(maxSelections) : null,
        organizationId,
        productIds: Array.isArray(productIds) ? productIds : [],
        ...(Array.isArray(modifiers) && modifiers.length > 0 ? {
          modifiers: {
            create: modifiers.map((m: any) => ({
              name: m.name,
              price: m.price ? parseFloat(m.price) : (m.priceAdjustment ? parseFloat(m.priceAdjustment) : 0),
            }))
          }
        } : {})
      },
      include: {
        modifiers: true,
        products: {
          select: { id: true, name: true, images: true, category: true }
        }
      }
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error("[MODIFIERS_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
