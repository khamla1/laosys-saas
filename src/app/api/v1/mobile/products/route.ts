import {
  verifyMobileRequest,
  mobileSuccess,
  mobileError,
  handleCorsOptions,
} from "@/lib/mobile-auth";
import prisma from "@/lib/prisma";

export async function OPTIONS() {
  return handleCorsOptions();
}

export async function GET(req: Request) {
  try {
    const auth = await verifyMobileRequest(req);
    if (!auth.authenticated || !auth.organizationId) {
      return mobileError(auth.error || "Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const lowStockOnly = searchParams.get("lowStockOnly") === "true";
    const categoryId = searchParams.get("categoryId");
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "30", 10), 1), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const skip = (page - 1) * limit;

    const whereClause: any = {
      organizationId: auth.organizationId,
      status: "ACTIVE",
    };

    if (lowStockOnly) {
      whereClause.stock = { lte: 5 };
    }

    if (categoryId) {
      whereClause.category = categoryId;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where: whereClause }),
      prisma.product.findMany({
        where: whereClause,
        orderBy: [{ stock: "asc" }, { updatedAt: "desc" }],
        skip,
        take: limit,
      }),
    ]);

    const formatted = products.map((p) => {
      const meta = (p.metadata as any) || {};
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        costPrice: meta.costPrice || null,
        stock: p.stock,
        barcode: meta.barcode || null,
        category: p.category || "ທົ່ວໄປ",
        image: p.images?.[0] || null,
        isLowStock: p.stock <= (p.minStock || 5),
        isOutOfStock: p.stock <= 0,
        updatedAt: p.updatedAt,
      };
    });

    return mobileSuccess({
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      products: formatted,
    });
  } catch (error: any) {
    console.error("[MOBILE_PRODUCTS_GET]", error);
    return mobileError("Failed to fetch products", 500, error.message);
  }
}
