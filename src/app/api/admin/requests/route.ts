import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");

    const where: any = {};
    if (statusParam && statusParam !== "ALL" && statusParam !== "all") {
      where.status = statusParam;
    }

    const requests = await prisma.accountRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error("Admin fetch requests error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
