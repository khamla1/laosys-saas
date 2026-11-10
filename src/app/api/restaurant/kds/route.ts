import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function resolveProductImage(name: string = "", category: string = "", images?: string[]): string {
  if (images && images.length > 0 && images[0]) {
    return images[0];
  }
  const n = (name || "").toLowerCase();
  const c = (category || "").toLowerCase();

  if (n.includes('candle') || n.includes('ທຽນ')) return "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&q=80";
  if (n.includes('tote') || n.includes('ກະເປົ໋າ') || n.includes('bag')) return "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80";
  if (n.includes('stanley') || n.includes('quencher') || n.includes('ແກ້ວ') || n.includes('ຈອກ') || n.includes('cup') || n.includes('tumbler')) return "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=600&q=80";
  if (n.includes('gift') || n.includes('ຊຸດຂອງຂວັນ') || n.includes('set') || n.includes('ພຣີມຽມ')) return "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80";
  if (n.includes('coffee') || n.includes('ກາເຟ')) return "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=600&q=80";
  if (n.includes('matcha') || n.includes('tea') || n.includes('ຊາ')) return "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&q=80";
  if (n.includes('cake') || n.includes('ເຄັກ')) return "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80";
  if (n.includes('rice') || n.includes('ເຂົ້າ')) return "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80";
  if (n.includes('burger') || n.includes('fries')) return "https://images.unsplash.com/photo-1576107232684-1279f3908581?w=600&q=80";
  if (n.includes('noodle') || n.includes('ເຝີ') || n.includes('ໝີ່')) return "https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=600&q=80";
  if (n.includes('badminton') || n.includes('ແບັດມິນຕັນ') || n.includes('ໄມ້ແບັດ') || n.includes('racket')) return "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80";
  if (n.includes('shuttlecock') || n.includes('ລູກຂົນໄກ່')) return "https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=600&q=80";
  if (n.includes('shoe') || n.includes('ເກີບ')) return "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80";
  if (n.includes('shirt') || n.includes('jersey') || n.includes('ເສື້ອ')) return "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80";
  if (c.includes('beverage') || c.includes('drink') || c.includes('ເຄື່ອງດື່ມ')) return "https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&q=80";
  if (c.includes('bakery') || c.includes('dessert') || c.includes('ເບເກີຣີ')) return "https://images.unsplash.com/photo-1563805042-7684c8a9e1cb?w=600&q=80";
  return "https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&q=80";
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = (session.user as any).organizationId || (session.user as any).id;

    // Fetch all pending/preparing order items
    const items = await prisma.orderItem.findMany({
      where: {
        order: {
          organizationId,
          status: { in: ["PENDING"] } // Ensure the order is active
        },
        status: { in: ["PENDING", "PREPARING", "READY"] }
      },
      include: {
        product: {
          select: { id: true, name: true, images: true, category: true, price: true }
        },
        order: {
          select: {
            id: true,
            createdAt: true,
            customerName: true,
            customerNote: true,
            table: { select: { name: true } }
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    });

    const itemsWithImages = items.map(item => {
      const resolvedImg = resolveProductImage(
        item.product?.name,
        item.product?.category || "",
        item.product?.images
      );
      return {
        ...item,
        product: {
          ...item.product,
          images: item.product?.images && item.product.images.length > 0 ? item.product.images : [resolvedImg],
          resolvedImage: resolvedImg,
        }
      };
    });

    return NextResponse.json(itemsWithImages);
  } catch (error: any) {
    console.error("KDS API Error:", error);
    return NextResponse.json({ error: "Failed to fetch KDS items" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = (session.user as any).organizationId || (session.user as any).id;
    const body = await request.json();
    const { itemId, status } = body;

    if (!itemId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify organization ownership
    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { order: true }
    });

    if (!item || item.order.organizationId !== organizationId) {
      return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
    }

    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: { status }
    });

    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error("KDS API Update Error:", error);
    return NextResponse.json({ error: "Failed to update item status" }, { status: 500 });
  }
}
