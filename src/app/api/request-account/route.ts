import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, phone, address, businessType, province, district, village } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
    }

    // Build structured Lao address string if components provided
    let finalAddress = (address || "").trim();
    if (!finalAddress && (province || district || village)) {
      const parts: string[] = [];
      if (village && village.trim()) {
        const v = village.trim();
        parts.push(v.startsWith("ບ້ານ") ? v : `ບ້ານ ${v}`);
      }
      if (district && district.trim()) {
        const d = district.trim();
        parts.push(d.startsWith("ເມືອງ") || d.startsWith("ນະຄອນ") ? d : `ເມືອງ ${d}`);
      }
      if (province && province.trim()) {
        parts.push(province.trim());
      }
      finalAddress = parts.join(", ");
    }

    // Check if email already exists in User table
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 400 });
    }

    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const uniqueSlug = slugBase + '-' + crypto.randomBytes(3).toString("hex");
    const typeOfBusiness = businessType || "GENERIC";

    // Auto-approve: Create User, Organization, and log the Request in one transaction
    const { newRequest, user } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name,
          email: email,
          password: hashedPassword,
          role: "SELLER",
          status: "ACTIVE",
        },
      });

      const org = await tx.organization.create({
        data: {
          name: `${name}'s Store`,
          slug: uniqueSlug,
          // @ts-ignore
          businessType: typeOfBusiness,
          metadata: {
            address: finalAddress,
            province: province || "",
            district: district || "",
            village: village || "",
            phone: phone || "",
          },
        },
      });

      await tx.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          role: "OWNER",
        },
      });

      if (finalAddress) {
        await tx.setting.create({
          data: {
            key: "store_address",
            value: finalAddress,
            organizationId: org.id,
          },
        });
      }

      if (phone) {
        await tx.setting.create({
          data: {
            key: "store_phone",
            value: phone,
            organizationId: org.id,
          },
        });
      }

      // @ts-ignore
      const request = await tx.accountRequest.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone,
          address: finalAddress,
          businessType: typeOfBusiness,
          status: "approved", // auto-approved!
        },
      });

      return { newRequest: request, user };
    });

    // Send confirmation email via Resend
    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = require("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        const loginUrl = process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/login` : "http://localhost:3000/login";
        
        const emailHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e5e7eb;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">🎉 ຍິນດີຕ້ອນຮັບເຂົ້າສູ່ລະບົບ!</h1>
            <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">ບັນຊີຮ້ານຄ້າຂອງທ່ານພ້ອມໃຊ້ງານແລ້ວ (Auto-Approved)</p>
          </div>

          <!-- Body -->
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #374151; margin-top: 0;">ສະບາຍດີ <strong>${name}</strong>,</p>
            <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">
              ພວກເຮົາພ້ອມແລ້ວທີ່ຈະໃຫ້ທ່ານເລີ່ມຕົ້ນການຂາຍ! ລະບົບໄດ້ທຳການ <strong>ອະນຸມັດອັດຕະໂນມັດ</strong> ບັນຊີຮ້ານຄ້າຂອງທ່ານເປັນທີ່ຮຽບຮ້ອຍແລ້ວ. ດຽວນີ້ທ່ານສາມາດເຂົ້າໄປຈັດການສິນຄ້າ, ເບິ່ງລາຍງານຍອດຂາຍ ແລະ ຈັດການອໍເດີໄດ້ທັນທີ.
            </p>

            <!-- Credentials Box -->
            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; color: #0f172a; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">🔑 ຂໍ້ມູນສຳລັບເຂົ້າສູ່ລະບົບ (Login Credentials)</h3>
              <p style="margin: 0 0 10px 0; font-size: 15px; color: #334155;"><strong>ອີເມວ (Email):</strong> <span style="color: #0369a1;">${email}</span></p>
              <p style="margin: 0; font-size: 15px; color: #334155;"><strong>ລະຫັດຜ່ານ (Password):</strong> <span style="color: #059669; font-weight: bold;">(ລະຫັດຜ່ານທີ່ທ່ານໄດ້ຕັ້ງໄວ້ຕອນສະໝັກ)</span></p>
            </div>

            <!-- Next Steps -->
            <h3 style="color: #1f2937; font-size: 16px; margin-top: 30px;">🚀 ສິ່ງທີ່ທ່ານສາມາດເຮັດໄດ້ໃນຕອນນີ້:</h3>
            <ul style="color: #4b5563; font-size: 15px; line-height: 1.6; padding-left: 20px;">
              <li>ເຂົ້າສู่ລະບົບເພື່ອເລີ່ມຕົ້ນໃຊ້ງານ</li>
              <li>ເພີ່ມສິນຄ້າໃໝ່ເຂົ້າໃນຮ້ານຂອງທ່ານ</li>
              <li>ຕັ້ງຄ່າຂໍ້ມູນການຮັບຊຳລະເງິນ (QR Code)</li>
            </ul>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0 20px 0;">
              <a href="${loginUrl}" style="background-color: #059669; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.2);">
                ເຂົ້າສູ່ລະບົບ (Login Now)
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 13px; color: #64748b;">
              <strong>ຄຳເຕືອນຄວາມປອດໄພ:</strong> ກະລຸນາຢ່າແບ່ງປັນລະຫັດຜ່ານນີ້ໃຫ້ຜູ້ອື່ນເດັດຂາດ.
            </p>
          </div>
        </div>
        `;

        const { error } = await resend.emails.send({
          from: "onboarding@resend.dev", 
          to: email,
          subject: "🎉 ບັນຊີຮ້ານຄ້າຂອງທ່ານພ້ອມໃຊ້ງານແລ້ວ! (Account Auto-Approved)",
          html: emailHtml,
        });

        if (error) {
          console.error("Resend send error:", error);
        }
      }
    } catch (mailErr) {
      console.error("Failed to send email:", mailErr);
    }

    return NextResponse.json({ success: true, request: newRequest }, { status: 201 });
  } catch (error: any) {
    console.error("Account request error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
