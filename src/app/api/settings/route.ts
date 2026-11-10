import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const result = await prisma.$runCommandRaw({
      find: "Setting",
      filter: {}
    });
    
    const settings = (result as any).cursor?.firstBatch || [];
    const settingsMap = settings.reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.value }), {});
    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error("GET Settings Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    
    if (role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || typeof value !== "string") {
      return new NextResponse("Key and Value are required", { status: 400 });
    }

    await prisma.$runCommandRaw({
      update: "Setting",
      updates: [
        {
          q: { key },
          u: { $set: { key, value, updatedAt: new Date() } },
          upsert: true
        }
      ]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST Settings Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
