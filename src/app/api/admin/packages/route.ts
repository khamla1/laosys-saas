import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const packages = await prisma.package.findMany({
      orderBy: { price: "asc" }
    });

    return NextResponse.json(packages);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { name, price, durationDays, productLimit, orderLimit, staffLimit, isActive, enabledModules } = body;

    if (!name || price === undefined || !durationDays) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Convert -1 to Infinity in frontend, but in DB we can store -1 or 9999999.
    // Let's store Infinity as a very large number or use a specific logic. Prisma doesn't support Infinity for Int.
    // Let's store -1 for Infinity.
    const pkg = await prisma.package.create({
      data: {
        name,
        price: Number(price),
        durationDays: Number(durationDays),
        productLimit: Number(productLimit),
        orderLimit: Number(orderLimit),
        staffLimit: Number(staffLimit),
        isActive: isActive ?? true,
        ...(Array.isArray(enabledModules) ? { enabledModules } : {})
      }
    });

    return NextResponse.json(pkg);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
