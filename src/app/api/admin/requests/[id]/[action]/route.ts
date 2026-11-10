import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(
  req: Request,
  context: any
) {
  const params = await context.params;
  const { id: requestId, action } = params;

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const accountRequest = await prisma.accountRequest.findUnique({
      where: { id: requestId },
    });

    if (!accountRequest) {
      return NextResponse.json({ error: "Account request not found" }, { status: 404 });
    }

    if (action === "reject") {
      await prisma.accountRequest.update({
        where: { id: requestId },
        data: { status: "rejected" },
      });

      // Optional: Send rejection email if RESEND_API_KEY is available
      try {
        if (process.env.RESEND_API_KEY) {
          const { Resend } = require("resend");
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: "onboarding@resend.dev",
            to: accountRequest.email,
            subject: "❌ ແຈ້ງຜົນການກວດສອບຄຳຮ້ອງຂໍເປີດບັນຊີຮ້ານຄ້າ (Account Request Update)",
            html: `<p>ສະບາຍດີ ${accountRequest.name}, ຄຳຮ້ອງຂໍເປີດບັນຊີຂອງທ່ານບໍ່ຜ່ານການອະນຸມັດ.</p>`,
          });
        }
      } catch (e) {
        console.error("[REQUEST_REJECT_EMAIL_ERR]", e);
      }

      return NextResponse.json({ success: true, status: "rejected" });
    }

    if (action === "approve") {
      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email: accountRequest.email },
      });

      if (user) {
        // If user already exists, update request status and activate user
        await prisma.accountRequest.update({
          where: { id: requestId },
          data: { status: "approved" },
        });

        await prisma.user.update({
          where: { id: user.id },
          data: { status: "ACTIVE" },
        });

        return NextResponse.json({ success: true, message: "Account already exists and is now active." });
      }

      // Password hashing
      const rawPassword = crypto.randomBytes(6).toString("hex");
      let finalHashedPassword = accountRequest.password;
      if (!finalHashedPassword) {
        finalHashedPassword = await bcrypt.hash(rawPassword, 10);
      }

      const slugBase = accountRequest.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const uniqueSlug = slugBase + "-" + crypto.randomBytes(3).toString("hex");

      await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            name: accountRequest.name,
            email: accountRequest.email,
            password: finalHashedPassword,
            role: "SELLER",
            status: "ACTIVE",
          },
        });

        const org = await tx.organization.create({
          data: {
            name: accountRequest.storeName || accountRequest.name,
            slug: uniqueSlug,
            businessType: accountRequest.businessType || "RETAIL",
            status: "ACTIVE",
            metadata: {
              phone: accountRequest.phone || "",
              province: (accountRequest as any).province || "",
              district: (accountRequest as any).district || "",
              village: (accountRequest as any).village || "",
              addressDetail: (accountRequest as any).addressDetail || "",
              fullAddress: (accountRequest as any).fullAddress || "",
              approvedAt: new Date().toISOString(),
            },
          },
        });

        await tx.organizationMember.create({
          data: {
            organizationId: org.id,
            userId: newUser.id,
            role: "OWNER",
          },
        });

        // Store settings
        if ((accountRequest as any).fullAddress || accountRequest.phone) {
          const settingKeyAddress = `store_address_${org.id}`;
          const settingKeyPhone = `store_phone_${org.id}`;

          await tx.setting.upsert({
            where: { key: settingKeyAddress },
            update: { value: (accountRequest as any).fullAddress || "" },
            create: { key: settingKeyAddress, value: (accountRequest as any).fullAddress || "" },
          });

          await tx.setting.upsert({
            where: { key: settingKeyPhone },
            update: { value: accountRequest.phone || "" },
            create: { key: settingKeyPhone, value: accountRequest.phone || "" },
          });
        }

        await tx.accountRequest.update({
          where: { id: requestId },
          data: { status: "approved" },
        });
      });

      return NextResponse.json({ success: true, status: "approved" });
    }

    return NextResponse.json({ error: "Invalid action. Must be approve or reject." }, { status: 400 });
  } catch (error: any) {
    console.error("[ADMIN_REQUEST_ACTION_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
