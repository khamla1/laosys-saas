import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { getAllStoreCustomersMerged, getOrUpsertStoreCustomer } from "@/lib/storeCustomer";
import { normalizeLaoPhone } from "@/lib/laoPhone";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ entity: string }> }
) {
  const { entity } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  if (!user?.organizationId && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orgId = user.organizationId;
  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "";
  const mode = url.searchParams.get("mode") || "";
  const store = url.searchParams.get("store") || "";
  const paymentMethod = url.searchParams.get("paymentMethod") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  try {
    switch (entity) {
      case "orders": {
        const where: any = { organizationId: orgId };
        if (search) {
          where.OR = [
            { customerName: { contains: search, mode: "insensitive" } },
            { customerPhone: { contains: search, mode: "insensitive" } },
          ];
        }
        if (status && status !== "ALL") where.status = status;
        if (paymentMethod && paymentMethod !== "ALL") where.paymentMethod = paymentMethod;
        const [data, total] = await Promise.all([
          prisma.order.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: { items: { include: { product: { select: { name: true } } } } } }),
          prisma.order.count({ where }),
        ]);
        return NextResponse.json({ data, total, page, limit });
      }
      case "products": {
        const where: any = { organizationId: orgId };
        if (search) where.name = { contains: search, mode: "insensitive" };
        if (status && status !== "ALL") where.status = status;
        const [data, total] = await Promise.all([
          prisma.product.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
          prisma.product.count({ where }),
        ]);
        return NextResponse.json({ data, total, page, limit });
      }
      case "customers": {
        let customers = await getAllStoreCustomersMerged({
          organizationId: orgId,
          isAdmin: mode === "leaderboard" ? isAdmin : false,
        });

        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const qDigits = q.replace(/\D/g, "");
          const parsedSearchPhone = normalizeLaoPhone(q);

          customers = customers.filter((c) => {
            const name = (c.customerName || c.name || "").toLowerCase();
            const phone = (c.customerPhone || c.phone || "").toLowerCase();
            const phoneDigits = phone.replace(/\D/g, "");
            const storeName = (c.storeName || "").toLowerCase();
            const couponsStr = [
              ...(c.claimedCoupons || []),
              ...(c.usedCoupons || []),
            ]
              .join(" ")
              .toLowerCase();

            return (
              name.includes(q) ||
              phone.includes(q) ||
              couponsStr.includes(q) ||
              (parsedSearchPhone.isValid && phoneDigits === parsedSearchPhone.normalized) ||
              (qDigits.length >= 3 && phoneDigits.includes(qDigits)) ||
              (isAdmin && storeName.includes(q))
            );
          });
        }

        if (isAdmin && store && store !== "ALL") {
          customers = customers.filter((c) => (c.storeName || "Unknown") === store);
        }

        const total = customers.length;
        const data = customers.slice(skip, skip + limit);
        return NextResponse.json({
          data,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        });
      }
      case "transactions": {
        const where: any = { organizationId: orgId };
        if (search) where.reference = { contains: search, mode: "insensitive" };
        if (status && status !== "ALL") where.status = status;
        const [data, total] = await Promise.all([
          prisma.transaction.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
          prisma.transaction.count({ where }),
        ]);
        return NextResponse.json({ data, total, page, limit });
      }
      case "stock": {
        const stockWhere: any = {
          product: {
            organizationId: orgId,
            ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
          },
        };
        const stocks = await prisma.stock.findMany({
          where: stockWhere,
          include: { product: { select: { name: true, organizationId: true } }, warehouse: { select: { name: true } } },
          skip,
          take: limit,
        });
        const total = await prisma.stock.count({ where: stockWhere });
        const data = stocks.map((s: any) => ({ id: s.id, productName: s.product.name, warehouseName: s.warehouse.name, quantity: s.quantity, productId: s.productId, warehouseId: s.warehouseId }));
        return NextResponse.json({ data, total, page, limit });
      }
      case "suppliers": {
        const where: any = { organizationId: orgId };
        if (search) where.name = { contains: search, mode: "insensitive" };
        const [data, total] = await Promise.all([
          prisma.supplier.findMany({ where, skip, take: limit, orderBy: { name: "asc" } }),
          prisma.supplier.count({ where }),
        ]);
        return NextResponse.json({ data, total, page, limit });
      }
      case "coupons": {
        const where: any = { organizationId: orgId };
        if (search) where.code = { contains: search, mode: "insensitive" };
        const [data, total] = await Promise.all([
          prisma.coupon.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
          prisma.coupon.count({ where }),
        ]);
        return NextResponse.json({ data, total, page, limit });
      }
      default:
        return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
    }
  } catch (e: any) {
    console.error("[DataEditor GET]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ entity: string }> }
) {
  const { entity } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orgId = user.organizationId;
  const body = await req.json();
  const { id, updates } = body;

  if (!id || !updates) {
    return NextResponse.json({ error: "Missing id or updates" }, { status: 400 });
  }

  try {
    let result: any;
    switch (entity) {
      case "orders":
        result = await prisma.order.update({ where: { id }, data: updates });
        break;
      case "products":
        result = await prisma.product.update({ where: { id }, data: updates });
        break;
      case "customers": {
        const parsedPhone = normalizeLaoPhone(updates.phone || id);
        const normPhone = parsedPhone.isValid ? parsedPhone.normalized : (updates.phone || id);
        await prisma.order.updateMany({
          where: { organizationId: orgId, customerPhone: id },
          data: {
            ...(updates.name && { customerName: updates.name }),
            ...(normPhone && { customerPhone: normPhone }),
            ...(updates.email && { customerEmail: updates.email }),
            ...(updates.address && { customerAddress: updates.address }),
          },
        });
        if (parsedPhone.isValid) {
          await getOrUpsertStoreCustomer(orgId, parsedPhone.normalized, {
            name: updates.name,
            address: updates.address,
            email: updates.email,
          }).catch(() => {});
        }
        result = { id, ...updates, phone: normPhone };
        break;
      }
      case "transactions":
        result = await prisma.transaction.update({ where: { id }, data: updates });
        break;
      case "stock":
        result = await prisma.stock.update({ where: { id }, data: updates });
        break;
      case "suppliers":
        result = await prisma.supplier.update({ where: { id }, data: updates });
        break;
      case "coupons":
        result = await prisma.coupon.update({ where: { id }, data: updates });
        break;
      default:
        return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
    }

    const entityTypeMap: Record<string, string> = {
      orders: "ORDER",
      products: "PRODUCT",
      customers: "CUSTOMER",
      transactions: "TRANSACTION",
      stock: "STOCK",
      suppliers: "SUPPLIER",
      coupons: "COUPON",
    };
    const mappedType = entityTypeMap[entity.toLowerCase()] || "DATA_EDITOR";
    const refCode = entity === "orders" ? `ORD-${id.slice(-6).toUpperCase()}` : `#${id.slice(-6).toUpperCase()}`;

    await recordAuditLog({
      action: `DATA_EDITOR_UPDATE_${entity.toUpperCase()}`,
      entityType: mappedType as any,
      entityId: id,
      organizationId: orgId,
      userId: user.id,
      details: `ແກ້ໄຂຂໍ້ມູນ ${entity} (${refCode}) ຜ່ານ Data Editor`,
      metadata: {
        refCode,
        entityType: mappedType,
        entityId: id,
        changes: updates,
        source: "DATA_EDITOR",
      },
    });

    return NextResponse.json({ data: result });
  } catch (e: any) {
    console.error("[DataEditor PATCH]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ entity: string }> }
) {
  const { entity } = await params;
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orgId = user.organizationId;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    let result: any;
    switch (entity) {
      case "orders":
        await prisma.orderItem.deleteMany({ where: { orderId: id } });
        result = await prisma.order.delete({ where: { id } });
        break;
      case "products":
        result = await prisma.product.delete({ where: { id } });
        break;
      case "transactions":
        result = await prisma.transaction.delete({ where: { id } });
        break;
      case "stock":
        result = await prisma.stock.delete({ where: { id } });
        break;
      case "suppliers":
        result = await prisma.supplier.delete({ where: { id } });
        break;
      case "coupons":
        result = await prisma.coupon.delete({ where: { id } });
        break;
      case "customers":
        return NextResponse.json({ error: "Cannot delete customers directly" }, { status: 400 });
      default:
        return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
    }

    const entityTypeMap: Record<string, string> = {
      orders: "ORDER",
      products: "PRODUCT",
      customers: "CUSTOMER",
      transactions: "TRANSACTION",
      stock: "STOCK",
      suppliers: "SUPPLIER",
      coupons: "COUPON",
    };
    const mappedType = entityTypeMap[entity.toLowerCase()] || "DATA_EDITOR";
    const refCode = entity === "orders" ? `ORD-${id.slice(-6).toUpperCase()}` : `#${id.slice(-6).toUpperCase()}`;

    await recordAuditLog({
      action: `DATA_EDITOR_DELETE_${entity.toUpperCase()}`,
      entityType: mappedType as any,
      entityId: id,
      organizationId: orgId,
      userId: user.id,
      details: `ລຶບຂໍ້ມູນ ${entity} (${refCode}) ຜ່ານ Data Editor`,
      metadata: {
        refCode,
        entityType: mappedType,
        entityId: id,
        source: "DATA_EDITOR",
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[DataEditor DELETE]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
