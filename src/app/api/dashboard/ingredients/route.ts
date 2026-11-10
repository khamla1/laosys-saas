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

    const ingredients = await prisma.ingredient.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { recipeItems: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(ingredients);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const PRESET_INGREDIENTS = [
  { name: "ເມັດກາເຟ ອາຣາບິກ້າ (Arabica Coffee Beans)", sku: "ING-COF-01", unit: "g", costPerUnit: 250, stock: 5000, minStock: 1000 },
  { name: "ນົມສົດພາດສະເຈີໄຣສ໌ (Fresh Milk)", sku: "ING-MLK-01", unit: "ml", costPerUnit: 35, stock: 10000, minStock: 2000 },
  { name: "ນົມຂົ້ນຫວານ (Sweet Condensed Milk)", sku: "ING-CND-01", unit: "g", costPerUnit: 60, stock: 4000, minStock: 1000 },
  { name: "ຜົງຊາຂຽວມັດຈະ (Matcha Powder)", sku: "ING-MTC-01", unit: "g", costPerUnit: 600, stock: 1000, minStock: 200 },
  { name: "ຜົງໂກໂກ້ແທ້ (Cocoa Powder)", sku: "ING-CCA-01", unit: "g", costPerUnit: 350, stock: 2000, minStock: 500 },
  { name: "ນ້ຳຕານຊາຍຂາວ (White Sugar)", sku: "ING-SGR-01", unit: "g", costPerUnit: 25, stock: 10000, minStock: 2000 },
  { name: "ຊີ້ນໝູບົດ/ສັນຄໍ (Pork)", sku: "ING-PRK-01", unit: "g", costPerUnit: 90, stock: 15000, minStock: 3000 },
  { name: "ເຂົ້າຫອມມະລິ (Jasmine Rice)", sku: "ING-RCE-01", unit: "g", costPerUnit: 28, stock: 50000, minStock: 10000 },
  { name: "ໄຂ່ໄກ່ເບີ 2 (Chicken Eggs)", sku: "ING-EGG-01", unit: "piece", costPerUnit: 2500, stock: 120, minStock: 30 },
  { name: "ນ້ຳມັນພືດ (Cooking Oil)", sku: "ING-OIL-01", unit: "ml", costPerUnit: 30, stock: 5000, minStock: 1000 },
];

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const body = await req.json();

    if (body.action === "SEED_PRESETS") {
      let createdCount = 0;
      for (const item of PRESET_INGREDIENTS) {
        const existing = await prisma.ingredient.findFirst({
          where: { organizationId, name: item.name }
        });
        if (!existing) {
          await prisma.ingredient.create({
            data: {
              ...item,
              organizationId
            }
          });
          createdCount++;
        }
      }
      return NextResponse.json({ success: true, count: createdCount });
    }

    const { name, sku, unit, costPerUnit, stock, minStock } = body;

    if (!name || !unit || typeof costPerUnit !== 'number') {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        sku: sku || `ING-${Date.now().toString().slice(-4)}`,
        unit,
        costPerUnit,
        stock: stock ? parseFloat(stock) : 0,
        minStock: minStock ? parseFloat(minStock) : 0,
        organizationId
      }
    });

    return NextResponse.json(ingredient);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
