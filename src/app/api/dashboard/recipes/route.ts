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

    const url = new URL(req.url);
    const productId = url.searchParams.get("productId");

    const whereClause: any = { organizationId };
    if (productId) {
      whereClause.productId = productId;
    }

    const items = await prisma.recipeItem.findMany({
      where: whereClause,
      include: {
        ingredient: true,
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            images: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
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
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const body = await req.json();

    const { productId, ingredientId, quantity } = body;

    if (!productId || !ingredientId || quantity === undefined) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Check if item already exists
    const existing = await prisma.recipeItem.findFirst({
      where: {
        organizationId,
        productId,
        ingredientId
      }
    });

    if (existing) {
      const updated = await prisma.recipeItem.update({
        where: { id: existing.id },
        data: {
          quantity: parseFloat(quantity)
        },
        include: {
          ingredient: true
        }
      });
      return NextResponse.json(updated);
    }

    const item = await prisma.recipeItem.create({
      data: {
        productId,
        ingredientId,
        quantity: parseFloat(quantity),
        organizationId
      },
      include: {
        ingredient: true
      }
    });

    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
