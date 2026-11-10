import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { recordAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const isAdmin = role === "ADMIN";
    let userOrgId = (session.user as any).organizationId;

    if (!userOrgId && !isAdmin) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizations: { take: 1, select: { organizationId: true } } },
      });
      userOrgId = user?.organizations?.[0]?.organizationId;
    }

    const body = await request.json();
    const { productIds, durationMinutes } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0 || !durationMinutes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Query products
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        ...(isAdmin ? {} : { organizationId: userOrgId }),
      },
      select: {
        id: true,
        name: true,
        status: true,
        organizationId: true,
      },
    });

    if (products.length === 0) {
      return NextResponse.json({ error: "ບໍ່ພົບສິນຄ້າທີ່ເລືອກ (Products not found)" }, { status: 404 });
    }

    if (products.length !== productIds.length) {
      return NextResponse.json({
        error: "ບາງສິນຄ້າບໍ່ພົບ ຫຼື ທ່ານບໍ່ມີສິດເຂົ້າເຖິງ (Some products were not found or access denied)",
      }, { status: 400 });
    }

    // Check product status
    const inactiveProducts = products.filter((p) => p.status !== "ACTIVE");
    if (inactiveProducts.length > 0) {
      const inactiveNames = inactiveProducts.map((p) => p.name).join(", ");
      return NextResponse.json({
        error: `ສິນຄ້າ "${inactiveNames}" ບໍ່ໄດ້ເປີດໃຊ້ງານ (Status: ${inactiveProducts[0].status})`,
      }, { status: 400 });
    }

    // Ensure all products belong to the same organization
    const orgIds = Array.from(new Set(products.map((p) => p.organizationId)));
    if (orgIds.length > 1) {
      return NextResponse.json({
        error: "ກະລຸນາເລືອກສິນຄ້າທີ່ມາຈາກຮ້ານດຽວກັນເທົ່ານັ້ນ ເພື່ອສ້າງລິ້ງ FOMO ດຽວກັນ",
      }, { status: 400 });
    }

    const targetOrgId = orgIds[0] || userOrgId;
    if (!targetOrgId) {
      return NextResponse.json({ error: "Organization not found for this product" }, { status: 400 });
    }

    // Generate token and expiry
    const token = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + durationMinutes * 60000);

    const shareLink = await prisma.shareLink.create({
      data: {
        token,
        expiresAt,
        productIds,
        organizationId: targetOrgId,
        status: "ACTIVE",
      },
    });

    // Record audit log
    try {
      await recordAuditLog({
        action: "CREATE",
        tableName: "ShareLink",
        recordId: shareLink.id,
        newData: {
          token,
          productCount: productIds.length,
          expiresAt,
          durationMinutes,
        },
        organizationId: targetOrgId,
        operatorName: (session.user as any).name || "User",
        operatorRole: isAdmin ? "ADMIN" : (session.user as any).orgRole || "STAFF",
      });
    } catch {
      // audit log error should not block link generation
    }

    return NextResponse.json({
      link: `/buy/${token}`,
      expiresAt: shareLink.expiresAt,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating share link:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
