import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const orgId = (session.user as any).organizationId;

  const [user, member] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        image: true,
        paymentQrCode: true,
        paymentAccountInfo: true,
        promptPayId: true,
        lineNotifyToken: true,
        telegramChatId: true,
        telegramEnabled: true,
      },
    }),
    orgId
      ? prisma.organization.findUnique({
          where: { id: orgId },
          select: { id: true, name: true, businessType: true, metadata: true },
        })
      : prisma.organizationMember.findFirst({
          where: { userId },
          include: { organization: true },
        }),
  ]);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const org = orgId ? member : (member as any)?.organization;
  const orgMeta = (org?.metadata as any) || {};

  return NextResponse.json({
    ...user,
    storeName: org?.name || "",
    storePhone: orgMeta.phone || "",
    province: orgMeta.province || "",
    district: orgMeta.district || "",
    village: orgMeta.village || "",
    addressDetail: orgMeta.addressDetail || "",
    fullAddress: orgMeta.fullAddress || "",
    rateTHB: orgMeta.rates?.thb || 650,
    rateUSD: orgMeta.rates?.usd || 22000,
    receiptHeader: orgMeta.receiptHeader || "LAOSYS RESTAURANT & POS",
    receiptFooter: orgMeta.receiptFooter || "ຂໍຂອບໃຈທີ່ມາອຸດໜູນ • Thank you for your support!",
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  let orgId = (session.user as any).organizationId;
  const data = await req.json();

  try {
    if (!orgId) {
      const member = await prisma.organizationMember.findFirst({
        where: { userId },
        select: { organizationId: true },
      });
      orgId = member?.organizationId;
    }

    // Update user profile fields
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        image: data.image !== undefined ? data.image : undefined,
        paymentQrCode: data.paymentQrCode !== undefined ? data.paymentQrCode : undefined,
        paymentAccountInfo: data.paymentAccountInfo !== undefined ? data.paymentAccountInfo : undefined,
        promptPayId: data.promptPayId !== undefined ? data.promptPayId : undefined,
        lineNotifyToken: data.lineNotifyToken !== undefined ? data.lineNotifyToken : undefined,
        telegramChatId: data.telegramChatId !== undefined ? data.telegramChatId : undefined,
        telegramEnabled: data.telegramEnabled !== undefined ? data.telegramEnabled : undefined,
      },
    });

    // Update organization metadata if orgId is available
    if (orgId) {
      const existingOrg = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { metadata: true, name: true },
      });

      const currentMeta = (existingOrg?.metadata as any) || {};
      const newFullAddress = [data.village, data.district, data.province, data.addressDetail]
        .filter(Boolean)
        .join(", ");

      const updatedMetadata = {
        ...currentMeta,
        phone: data.storePhone !== undefined ? data.storePhone : currentMeta.phone,
        province: data.province !== undefined ? data.province : currentMeta.province,
        district: data.district !== undefined ? data.district : currentMeta.district,
        village: data.village !== undefined ? data.village : currentMeta.village,
        addressDetail: data.addressDetail !== undefined ? data.addressDetail : currentMeta.addressDetail,
        fullAddress: newFullAddress || currentMeta.fullAddress,
        rates: {
          thb: data.rateTHB ? Number(data.rateTHB) : currentMeta.rates?.thb || 650,
          usd: data.rateUSD ? Number(data.rateUSD) : currentMeta.rates?.usd || 22000,
        },
        receiptHeader: data.receiptHeader !== undefined ? data.receiptHeader : currentMeta.receiptHeader,
        receiptFooter: data.receiptFooter !== undefined ? data.receiptFooter : currentMeta.receiptFooter,
      };

      await prisma.organization.update({
        where: { id: orgId },
        data: {
          name: data.storeName ? data.storeName.trim() : undefined,
          metadata: updatedMetadata,
        },
      });

      // Also upsert store_address and store_phone in Setting table
      if (data.storePhone) {
        await prisma.setting.upsert({
          where: { key: `store_phone_${orgId}` },
          update: { value: data.storePhone },
          create: { key: `store_phone_${orgId}`, value: data.storePhone },
        });
      }
      if (newFullAddress) {
        await prisma.setting.upsert({
          where: { key: `store_address_${orgId}` },
          update: { value: newFullAddress },
          create: { key: `store_address_${orgId}`, value: newFullAddress },
        });
      }
    }

    await recordAuditLog({
      action: "SETTINGS_UPDATED",
      entityType: "SETTING",
      entityId: orgId || userId,
      organizationId: orgId,
      userId,
      details: `ອັບເດດຂໍ້ມູນຮ້ານ & ການຕັ້ງຄ່າການຊຳລະເງິນ`,
      metadata: {
        storeName: data.storeName,
        storePhone: data.storePhone,
        rates: { thb: data.rateTHB, usd: data.rateUSD }
      }
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("Error updating seller settings:", error);
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 });
  }
}
