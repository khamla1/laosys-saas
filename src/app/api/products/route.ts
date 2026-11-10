import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getEffectiveLimits } from "@/lib/saas";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().max(1000).optional().nullable(),
  price: z.number().min(0, "Price must be positive"),
  stock: z.number().int().min(0).optional(),
  category: z.string().optional().nullable(),
  images: z.array(z.string()).optional(),
  reviewImages: z.array(z.string()).optional(),
  metadata: z.any().optional(),
});


export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Tenant Isolation: Only get products for this user (Seller)
    // If ADMIN, maybe we want to allow getting all?
    // According to specs: Admin sees all, Seller sees own.
    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const organizationId = (session.user as any).organizationId || userId;

    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page");

    // Preserve legacy array response when 'page' parameter is not passed
    if (!pageParam) {
      const includeAll = searchParams.get("includeAllStatuses") === "true";
      const where: any = {};

      if (!includeAll) {
        where.status = { not: "DELETED" };
      }

      if (role !== "ADMIN") {
        if (organizationId && userId && organizationId !== userId) {
          where.OR = [
            { organizationId: organizationId },
            { organizationId: userId }
          ];
        } else {
          where.organizationId = organizationId || userId;
        }
      }

      const products = await prisma.product.findMany({
        where,
        take: 200,
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(products);
    }

    const page = Math.max(1, parseInt(pageParam, 10) || 1);
    const rawLimit = parseInt(searchParams.get("limit") || "10", 10) || 10;
    const limit = Math.min(Math.max(rawLimit, 1), 1000);
    const skip = (page - 1) * limit;
    const search = (searchParams.get("search") || "").trim();
    const category = searchParams.get("category") || "";
    const statusParam = searchParams.get("status") || "";
    const sellerId = searchParams.get("sellerId") || "";
    const includeAllStatuses = searchParams.get("includeAllStatuses") === "true";
    const includeRelations = searchParams.get("includeRelations") === "true";
    const includeStats = searchParams.get("stats") === "true";

    const where: any = {};

    // Status filter
    if (statusParam && statusParam !== "ALL") {
      where.status = statusParam;
    } else if (includeAllStatuses) {
      where.status = { not: "DELETED" };
    } else {
      where.status = "ACTIVE";
    }

    // Tenant / Seller filter
    if (role === "ADMIN") {
      if (sellerId && sellerId !== "ALL") {
        where.organizationId = sellerId;
      }
    } else {
      where.organizationId = organizationId;
    }

    // Category filter
    if (category && category !== "ALL") {
      where.category = category;
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        ...(includeRelations
          ? {
              include: {
                organization: {
                  select: { id: true, name: true },
                },
              },
            }
          : {}),
      }),
      prisma.product.count({ where }),
    ]);

    let stats: any = undefined;
    if (includeStats) {
      const baseWhere: any = {
        status: "ACTIVE",
        ...(role === "ADMIN" ? {} : { organizationId }),
      };
      const allForStats = await prisma.product.findMany({
        where: baseWhere,
        select: { stock: true, price: true, metadata: true },
      });
      const totalSKUs = allForStats.length;
      let totalValue = 0;
      let lowStockCount = 0;
      let outOfStockCount = 0;
      for (const p of allForStats) {
        const inStock = p.stock ?? 0;
        const minStock = (p.metadata as any)?.minStock || 10;
        const costPrice = p.price || 0;
        totalValue += inStock * costPrice;
        if (inStock === 0) outOfStockCount++;
        else if (inStock <= minStock) lowStockCount++;
      }
      stats = { totalSKUs, totalValue, lowStockCount, outOfStockCount };
    }

    return NextResponse.json({
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      ...(stats ? { stats } : {}),
    });
  } catch (error) {
    console.error("[PRODUCTS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const organizationId = (session.user as any).organizationId || userId;
    const body = await request.json();
    
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 });
    }

    const { name, description, price, stock, category, images, reviewImages, metadata } = parsed.data;

    const role = (session.user as any).role;
    if (role !== "ADMIN" && price < 5000) {
      return NextResponse.json({ error: "Minimum price is ₭5,000" }, { status: 400 });
    }

    // SaaS Feature Enforcement: Check Subscription Limits
    const limits = await getEffectiveLimits(userId);

    if (limits.productLimit !== Infinity) {
      const productCount = await prisma.product.count({
        where: { organizationId }
      });
      if (productCount >= limits.productLimit) {
        return NextResponse.json(
          { error: `Product limit reached for ${limits.planName} plan. Please upgrade.` },
          { status: 403 }
        );
      }
    }

    // Tenant Isolation: Ensure product is created with the current user's ID
    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          name,
          description,
          category: category || null,
          price,
          stock: stock || 0,
          images: images || [],
          reviewImages: reviewImages || [],
          metadata: metadata || null,
          organizationId,
        },
      });

      // If variants or sizes were selected in metadata, create ProductVariants automatically
      if (metadata && Array.isArray(metadata.variants) && metadata.variants.length > 0) {
        for (const v of metadata.variants) {
          await tx.productVariant.create({
            data: {
              productId: p.id,
              name: `Size: ${v.size || v.name}`,
              sku: `${p.name.slice(0, 3).toUpperCase()}-${v.size || v.name}`,
              price: Number(v.price) || price,
              stock: Number(v.stock) >= 0 ? Number(v.stock) : Math.max(1, Math.floor((stock || 0) / metadata.variants.length)),
              barcode: v.barcode || metadata.barcode || null,
            }
          });
        }
      } else if (metadata && Array.isArray(metadata.sizes) && metadata.sizes.length > 0) {
        for (const sizeName of metadata.sizes) {
          await tx.productVariant.create({
            data: {
              productId: p.id,
              name: `Size: ${sizeName}`,
              sku: `${p.name.slice(0, 3).toUpperCase()}-${sizeName}`,
              price: price,
              stock: Math.max(1, Math.floor((stock || 0) / metadata.sizes.length)),
              barcode: metadata.barcode || null,
            }
          });
        }
      }

      if (stock && stock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: p.id,
            userId,
             organizationId,
            type: "ADD",
            quantity: stock,
            reason: "ເພີ່ມສິນຄ້າເລີ່ມຕົ້ນ (Initial stock added)",
          }
        });
      }

      const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "Unknown";
      
      await tx.auditLog.create({
        data: {
          action: "CREATE_PRODUCT",
          details: `Created product ${p.name}`,
          userId: userId,
          organizationId,
          ipAddress: ip,
        }
      });

      return p;
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("[API ERROR] [PRODUCTS_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
