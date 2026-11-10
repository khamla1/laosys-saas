import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { error: "ລະຫັດຜ່ານໃໝ່ຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ (Password must be at least 6 characters)" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If user has an existing password and currentPassword is provided, verify it
    // (If not provided, we allow reset if logged in via session)
    if (user.password && currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json(
          { error: "ລະຫັດຜ່ານປະຈຸບັນບໍ່ຖືກຕ້ອງ (Incorrect current password)" },
          { status: 400 }
        );
      }
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      success: true,
      message: "ປ່ຽນລະຫັດຜ່ານສຳເລັດແລ້ວ (Password updated successfully)",
    });
  } catch (error: any) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { error: "ເກີດຂໍ້ຜິດພາດໃນການປ່ຽນລະຫັດຜ່ານ" },
      { status: 500 }
    );
  }
}
