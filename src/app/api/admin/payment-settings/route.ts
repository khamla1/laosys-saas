import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const role = (session.user as any).role;
    let targetUserId = (session.user as any).id;
    
    const url = new URL(request.url);
    const sellerId = url.searchParams.get("sellerId");
    
    if (sellerId && role === "ADMIN") {
      targetUserId = sellerId;
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { paymentQrCode: true, paymentAccountInfo: true, image: true }
    });

    return NextResponse.json(user || {});
  } catch (error) {
    console.error("GET Payment Settings Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const role = (session.user as any).role;
    let targetUserId = (session.user as any).id;
    
    const { paymentQrCode, paymentAccountInfo, sellerId, image } = await request.json();

    if (sellerId && role === "ADMIN") {
      targetUserId = sellerId;
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        paymentQrCode: paymentQrCode !== undefined ? paymentQrCode : undefined,
        paymentAccountInfo: paymentAccountInfo !== undefined ? paymentAccountInfo : undefined,
        image: image !== undefined ? image : undefined
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST Payment Settings Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
