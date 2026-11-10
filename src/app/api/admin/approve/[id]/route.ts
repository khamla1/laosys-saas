import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import crypto from "crypto";

export async function POST(
  req: Request,
  context: any
) {
  const params = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const requestId = params.id;
    const accountRequest = await prisma.accountRequest.findUnique({
      where: { id: requestId },
    });

    if (!accountRequest || accountRequest.status !== "pending") {
      return NextResponse.json({ error: "Invalid or already processed request" }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: accountRequest.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 400 });
    }

    // Use stored password if exists, otherwise fallback to random
    const rawPassword = crypto.randomBytes(6).toString("hex");
    let finalHashedPassword = accountRequest.password;
    
    if (!finalHashedPassword) {
      finalHashedPassword = await bcrypt.hash(rawPassword, 10);
    }

    // Create User, Organization, and Update Request in a transaction
    const slugBase = accountRequest.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const uniqueSlug = slugBase + '-' + crypto.randomBytes(3).toString("hex");

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
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
          name: `${accountRequest.name}'s Store`,
          slug: uniqueSlug,
          businessType: (accountRequest as any).businessType || "GENERIC",
          metadata: {
            address: accountRequest.address || "",
            phone: accountRequest.phone || "",
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

      if (accountRequest.address) {
        await tx.setting.create({
          data: {
            key: "store_address",
            value: accountRequest.address,
            organizationId: org.id,
          },
        });
      }

      if (accountRequest.phone) {
        await tx.setting.create({
          data: {
            key: "store_phone",
            value: accountRequest.phone,
            organizationId: org.id,
          },
        });
      }

      await tx.accountRequest.update({
        where: { id: requestId },
        data: { status: "approved" },
      });
    });

    // Send email via Resend
    const loginUrl = process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/login` : "http://localhost:3000/login";
    
    const emailHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e5e7eb;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">🎉 ຍິນດີຕ້ອນຮັບເຂົ້າສູ່ລະບົບ!</h1>
            <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">ຄຳຮ້ອງຂໍເປີດບັນຊີຂອງທ່ານຖືກອະນຸມັດແລ້ວ</p>
          </div>

          <!-- Body -->
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #374151; margin-top: 0;">ສະບາຍດີ <strong>${accountRequest.name}</strong>,</p>
            <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">
              ພວກເຮົາພ້ອມແລ້ວທີ່ຈະໃຫ້ທ່ານເລີ່ມຕົ້ນການຂາຍ! ຜູ້ເບິ່ງແຍງລະບົບໄດ້ທຳການກວດສອບ ແລະ <strong>ອະນຸມັດ</strong> ບັນຊີຮ້ານຄ້າຂອງທ່ານເປັນທີ່ຮຽບຮ້ອຍແລ້ວ. ດຽວນີ້ທ່ານສາມາດເຂົ້າໄປຈັດການສິນຄ້າ, ເບິ່ງລາຍງານຍອດຂາຍ ແລະ ຈັດການອໍເດີໄດ້ທັນທີ.
            </p>

            <!-- Credentials Box -->
            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; color: #0f172a; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">🔑 ຂໍ້ມູນສຳລັບເຂົ້າສູ່ລະບົບ (Login Credentials)</h3>
              <p style="margin: 0 0 10px 0; font-size: 15px; color: #334155;"><strong>ອີເມວ (Email):</strong> <span style="color: #0369a1;">${accountRequest.email}</span></p>
              ${!accountRequest.password ? 
                `<p style="margin: 0; font-size: 15px; color: #334155;"><strong>ລະຫັດຜ່ານ (Password):</strong> <span style="background-color: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 16px; color: #0f172a; font-weight: bold;">${rawPassword}</span></p>` 
                : `<p style="margin: 0; font-size: 15px; color: #334155;"><strong>ລະຫັດຜ່ານ (Password):</strong> <span style="color: #059669; font-weight: bold;">(ລະຫັດຜ່ານທີ່ທ່ານໄດ້ຕັ້ງໄວ້ຕອນສະໝັກ)</span></p>`
              }
            </div>

            <!-- Next Steps -->
            <h3 style="color: #1f2937; font-size: 16px; margin-top: 30px;">🚀 ສິ່ງທີ່ທ່ານສາມາດເຮັດໄດ້ໃນຕອນນີ້:</h3>
            <ul style="color: #4b5563; font-size: 15px; line-height: 1.6; padding-left: 20px;">
              <li>ປ່ຽນລະຫັດຜ່ານໃໝ່ເພື່ອຄວາມປອດໄພ</li>
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
              <strong>ຄຳເຕືອນຄວາມປອດໄພ:</strong> ກະລຸນາຢ່າແບ່ງປັນລະຫັດຜ່ານນີ້ໃຫ້ຜູ້ອື່ນເດັດຂາດ.<br/>
              ຖ້າທ່ານບໍ່ໄດ້ຮ້ອງຂໍເປີດບັນຊີ, ກະລຸນາບໍ່ສົນໃຈອີເມວສະບັບນີ້.
            </p>
          </div>
        </div>
      `;

    try {
      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { data, error } = await resend.emails.send({
          from: "onboarding@resend.dev", // Default testing email from Resend
          to: accountRequest.email, // In free tier testing, this MUST be the verified email of the Resend account
          subject: "🎉 ຄຳຮ້ອງຂໍເປີດບັນຊີຂອງທ່ານຖືກອະນຸມັດແລ້ວ! (Account Approved)",
          html: emailHtml,
        });
        
        if (error) {
          console.error("Resend API error:", error);
        } else {
          console.log("Email sent successfully via Resend:", data);
        }
      } else {
        console.warn("RESEND_API_KEY not set in environment. Skipping email sending.");
      }
    } catch (mailErr) {
      console.error("Failed to send email via Resend:", mailErr);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin approve request error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
