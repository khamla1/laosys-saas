import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeLaoPhone } from "@/lib/laoPhone";

function editDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export async function GET(
  request: Request,
  context: any
) {
  const params = await context.params;
  try {
    const { slug } = params;
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q || q.length < 3) {
      return NextResponse.json(
        { error: "ກະລຸນາປ້ອນເບີໂທ ຫຼື ລະຫັດບິນຢ່າງໜ້ອຍ 3 ຕົວອັກສອນ" },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.findUnique({
      where: { slug },
    });

    if (!organization) {
      return NextResponse.json({ error: "ບໍ່ພົບຮ້ານຄ້າ" }, { status: 404 });
    }

    // Fetch recent orders for this store
    const recentOrders = await prisma.order.findMany({
      where: {
        organizationId: organization.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const cleanQ = q.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const digitsOnlyQ = q.replace(/\D/g, "");
    const parsedQueryPhone = normalizeLaoPhone(q);

    const matched = recentOrders
      .filter((o) => {
        // 1. Order ID match (full or last 6 characters)
        const idMatch = o.id.toLowerCase().includes(cleanQ) || (cleanQ.length >= 4 && o.id.slice(-6).toLowerCase() === cleanQ);

        // 2. Customer Phone match
        const phoneClean = (o.customerPhone || "").replace(/[^0-9]/g, "");
        const ordPhoneParsed = normalizeLaoPhone(o.customerPhone);

        // 2A. Normalized Lao phone exact match
        const normalizedPhoneMatch =
          parsedQueryPhone.isValid &&
          ordPhoneParsed.isValid &&
          parsedQueryPhone.normalized === ordPhoneParsed.normalized;

        // 2B. Substring match
        const substringPhoneMatch =
          (cleanQ.length >= 4 && phoneClean.includes(cleanQ)) ||
          (phoneClean.length >= 4 && cleanQ.includes(phoneClean));

        // 2C. Suffix match (e.g. user entered last 6-8 digits, or phone ends with query)
        const suffixPhoneMatch =
          (digitsOnlyQ.length >= 6 && phoneClean.endsWith(digitsOnlyQ)) ||
          (phoneClean.length >= 6 && digitsOnlyQ.endsWith(phoneClean));

        // 2D. Fuzzy typo match (Levenshtein distance <= 1 for phone typos like missing/extra digit)
        const fuzzyPhoneMatch =
          digitsOnlyQ.length >= 7 &&
          phoneClean.length >= 7 &&
          (editDistance(digitsOnlyQ, phoneClean) <= 1 ||
           (digitsOnlyQ.startsWith("020") && phoneClean.startsWith("020") && editDistance(digitsOnlyQ.slice(3), phoneClean.slice(3)) <= 1));

        const phoneMatch =
          normalizedPhoneMatch || substringPhoneMatch || suffixPhoneMatch || fuzzyPhoneMatch;

        // 3. Customer Name match
        const nameMatch = (o.customerName || "").toLowerCase().includes(q.toLowerCase());

        return idMatch || phoneMatch || nameMatch;
      })
      .slice(0, 10)
      .map((o) => ({
        id: o.id,
        shortId: o.id.slice(-6).toUpperCase(),
        status: o.status,
        totalAmount: o.totalAmount,
        discountAmount: o.discountAmount,
        paymentMethod: o.paymentMethod,
        paymentSlipUrl: o.paymentSlipUrl,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        customerAddress: o.customerAddress,
        customerNote: o.customerNote,
        createdAt: o.createdAt,
        items: o.items.map((it) => ({
          id: it.id,
          quantity: it.quantity,
          price: it.price,
          productName: it.product?.name || "ສິນຄ້າ",
          productImage: it.product?.images?.[0] || null,
        })),
      }));

    return NextResponse.json({ orders: matched });
  } catch (error) {
    console.error("[SHOP_TRACK_ORDER]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
