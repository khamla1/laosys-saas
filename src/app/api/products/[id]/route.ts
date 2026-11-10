import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional().nullable(),
  price: z.number().min(0).optional(),
  stock: z.number().min(0).optional(),
  category: z.string().optional().nullable(),
  images: z.array(z.string()).optional(),
  reviewImages: z.array(z.string()).optional(),
  status: z.enum(["ACTIVE", "DELETED", "PENDING_DELETE", "ARCHIVED"]).optional(),
});

export async function GET(
  request: Request,
  context: any
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const organizationId = (session.user as any).organizationId;

    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Tenant Isolation
    if (role !== "ADMIN" && product.organizationId !== organizationId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("[API ERROR] [PRODUCT_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  context: any
) {
  const params = await context.params;
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const organizationId = (session.user as any).organizationId;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Tenant Isolation
    if (role !== "ADMIN" && product.organizationId !== organizationId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Immutable DELETED state guard: DELETED is final and active check
    if (product.status === "DELETED") {
      throw new Error("Product is not active");
    }

    const body = await request.json();
    
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 });
    }

    const { name, description, price, stock, category, images, reviewImages, status } = parsed.data;

    // Backend validation: block all edits to non-active products
    if (product.status !== "ACTIVE") {
      // Only allow ADMIN to update the status field
      const isStatusOnlyUpdate = role === "ADMIN" && status !== undefined && name === undefined && description === undefined && price === undefined && images === undefined && reviewImages === undefined;
      
      if (!isStatusOnlyUpdate) {
        throw new Error("Product is not active");
      }
    }

    if (role !== "ADMIN" && price !== undefined && price < 5000) {
      return NextResponse.json({ error: "Minimum price is ₭5,000" }, { status: 400 });
    }

    const dataToUpdate: any = {
      name,
      description,
      price,
      stock,
      category,
      images,
      reviewImages,
    };

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "Unknown";

    if (role === "ADMIN" && status) {
      dataToUpdate.status = status;
      
      const adminName = (session.user as any).name || (session.user as any).email || `Admin (${userId.slice(-6)})`;
      const adminAction = status === "DELETED" ? "APPROVE_DELETE" : "RESTORE_PRODUCT";
      const readableMessage = status === "DELETED" 
        ? `Admin ${adminName} approved delete` 
        : `Admin ${adminName} restored product ${product.name}`;

      await prisma.auditLog.create({
        data: {
          userId,
          organizationId: product.organizationId,
          ipAddress: ip,
          action: adminAction,
          details: JSON.stringify({
            message: readableMessage,
            productId: id,
            timestamp: new Date().toISOString()
          })
        }
      });
    } else {
      const userName = (session.user as any).name || (session.user as any).email || `User (${userId.slice(-6)})`;
      await prisma.auditLog.create({
        data: {
          userId,
          organizationId: product.organizationId,
          ipAddress: ip,
          action: "UPDATE_PRODUCT",
          details: `ແກ້ໄຂສິນຄ້າ "${product.name}" ໂດຍ ${userName}`,
          metadata: {
            entityType: "PRODUCT",
            entityId: id,
            refCode: product.name,
            changes: dataToUpdate,
            oldPrice: product.price,
            oldStock: product.stock,
          }
        }
      });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    console.error("[API ERROR] [PRODUCT_PUT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: any
) {
  const params = await context.params;
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const organizationId = (session.user as any).organizationId;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Tenant Isolation
    if (role !== "ADMIN" && product.organizationId !== organizationId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Prevent duplicate delete requests or final deleted operations
    if (product.status === "DELETED") {
      throw new Error("Product is not active");
    }

    if (product.status === "PENDING_DELETE") {
      return NextResponse.json({ error: "Product is already pending delete approval" }, { status: 400 });
    }

    // Backend validation: must be ACTIVE to request delete
    if (product.status !== "ACTIVE") {
      throw new Error("Product is not active");
    }

    let reason = null;
    try {
      const body = await request.json();
      reason = body.reason || null;
    } catch (e) {
      // Body may be empty
    }

    const userName = (session.user as any).name || (session.user as any).email || `User (${userId.slice(-6)})`;
    const readableMessage = `User ${userName} requested delete for product ${product.name}`;
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "Unknown";

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: { status: "PENDING_DELETE" },
      });

      await tx.auditLog.create({
        data: {
          userId,
          organizationId: product.organizationId,
          ipAddress: ip,
          action: "DELETE_PRODUCT",
          details: `ສົ່ງຄຳຮ້ອງລຶບສິນຄ້າ "${product.name}" ໂດຍ ${userName}${reason ? ` (ເຫດຜົນ: ${reason})` : ""}`,
          metadata: {
            entityType: "PRODUCT",
            entityId: id,
            refCode: product.name,
            reason,
          }
        }
      });
    });

    return NextResponse.json({ success: true, message: "Product marked for deletion" });
  } catch (error: any) {
    console.error("[API ERROR] [PRODUCT_DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
