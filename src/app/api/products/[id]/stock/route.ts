import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

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

    const { id } = params;
    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    // Fetch product to verify ownership/access
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Tenant Isolation
    const organizationId = (session.user as any).organizationId;
    let storeId = organizationId;
    if (role !== "ADMIN" && !storeId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (role !== "ADMIN" && product.organizationId !== storeId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch movements
    const movements = await prisma.stockMovement.findMany({
      where: { productId: id },
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(movements);
  } catch (error) {
    console.error("[STOCK_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: any
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    const body = await request.json();
    const { type, quantity, reason } = body;

    if (!type || quantity === undefined) {
      return new NextResponse("Type and Quantity are required", { status: 400 });
    }

    // Enforce allowed types in POST body (SALE must be automatic only, cannot be manually requested)
    if (!["ADD", "REMOVE", "ADJUST"].includes(type)) {
      return new NextResponse("Invalid movement type", { status: 400 });
    }

    // Role-based permission check: Cashier can only perform ADD and REMOVE
    if (role === "CASHIER" && type === "ADJUST") {
      return new NextResponse("Permission denied", { status: 403 });
    }

    // Transaction to ensure stock updates and movements are logged together
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch current product
      const product = await tx.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      if (product.status !== "ACTIVE") {
        throw new Error("Product is not active");
      }

      // Tenant isolation validation
      const organizationId = (session.user as any).organizationId;
      let storeId = organizationId;
      if (role !== "ADMIN" && !storeId) {
        throw new Error("Unauthorized");
      }

      if (role !== "ADMIN" && product.organizationId !== storeId) {
        throw new Error("Unauthorized");
      }

      let delta = 0;
      let newStock = product.stock;

      if (type === "ADD") {
        const qtyVal = parseInt(quantity);
        if (isNaN(qtyVal) || qtyVal <= 0) {
          throw new Error("Invalid quantity");
        }
        delta = qtyVal;
        newStock = product.stock + delta;
      } else if (type === "REMOVE") {
        const qtyVal = parseInt(quantity);
        if (isNaN(qtyVal) || qtyVal <= 0) {
          throw new Error("Invalid quantity");
        }
        if (product.stock < qtyVal) {
          throw new Error("Not enough stock remaining");
        }
        delta = -qtyVal;
        newStock = product.stock + delta;
      } else if (type === "ADJUST") {
        // In ADJUST mode, quantity represents the target stock override value (absolute)
        const targetStock = parseInt(quantity);
        if (isNaN(targetStock) || targetStock < 0) {
          throw new Error("Invalid target stock value");
        }
        if (!reason || reason.trim() === "") {
          throw new Error("Reason is required for stock adjustment overrides");
        }
        delta = targetStock - product.stock;
        newStock = targetStock;
      }

      if (newStock < 0) {
        throw new Error("Stock cannot be negative");
      }

      // 2. Create StockMovement
      const movement = await tx.stockMovement.create({
        data: {
          productId: id,
          userId,
          organizationId: product.organizationId,
          type,
          quantity: delta,
          reason: reason || null,
        }
      });

      // 3. Update Product stock
      const updatedProduct = await tx.product.update({
        where: { id },
        data: { stock: newStock }
      });

      return { movement, product: updatedProduct, delta };
    });

    await recordAuditLog({
      action: "STOCK_ADJUSTED",
      entityType: "STOCK",
      entityId: id,
      organizationId: result.product.organizationId,
      userId,
      details: `ປັບສະຕັອກສິນຄ້າ "${result.product.name}": ${result.movement.quantity > 0 ? `+${result.movement.quantity}` : result.movement.quantity} (ສະຕັອກໃໝ່: ${result.product.stock}) ${reason ? `[ເຫດຜົນ: ${reason}]` : ""}`,
      metadata: {
        entityType: "STOCK",
        entityId: id,
        refCode: result.product.name,
        type,
        delta: result.delta,
        newStock: result.product.stock,
        reason,
      }
    });

    return NextResponse.json({ movement: result.movement, product: result.product });
  } catch (error: any) {
    console.error("[STOCK_POST]", error);
    return new NextResponse(error.message || "Internal Error", { status: 400 });
  }
}
