import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

    await prisma.accountRequest.update({
      where: { id: requestId },
      data: { status: "rejected" },
    });

    // Send rejection email via Resend
    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = require("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        const emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #dc2626; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">ແຈ້ງຜົນການກວດສອບຄຳຮ້ອງຂໍເປີດບັນຊີ</h1>
            </div>
            <div style="padding: 24px; color: #333;">
              <p>ສະບາຍດີ <strong>${accountRequest.name}</strong>,</p>
              <p>ຂໍຂອບໃຈທີ່ໃຫ້ຄວາມສົນໃຈໃນການເປີດບັນຊີຮ້ານຄ້າກັບພວກເຮົາ.</p>
              <p>ຫຼັງຈາກການກວດສອບຂໍ້ມູນແລ້ວ, ພວກເຮົາຂໍອະໄພທີ່ຕ້ອງແຈ້ງໃຫ້ຊາບວ່າ <strong>ຄຳຮ້ອງຂໍເປີດບັນຊີຂອງທ່ານບໍ່ຜ່ານການອະນຸມັດ</strong> ໃນຄັ້ງນີ້.</p>
              <p>ຫາກທ່ານມີຂໍ້ສົງໄສ ຫຼື ຕ້ອງການສອບຖາມຂໍ້ມູນເພີ່ມເຕີມ, ສາມາດຕິດຕໍ່ຝ່າຍບໍລິການລູກຄ້າຂອງພວກເຮົາໄດ້.</p>
              <p>ຂໍສະແດງຄວາມນັບຖື,<br/>ທີມງານ Laosys</p>
            </div>
          </div>
        `;

        const { error } = await resend.emails.send({
          from: "onboarding@resend.dev", 
          to: accountRequest.email, 
          subject: "❌ ແຈ້ງຜົນການກວດສອບຄຳຮ້ອງຂໍເປີດບັນຊີຮ້ານຄ້າ (Account Request Update)",
          html: emailHtml,
        });

        if (error) {
          console.error("Resend send error:", error);
        }
      }
    } catch (mailErr) {
      console.error("Failed to send rejection email:", mailErr);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin reject request error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
