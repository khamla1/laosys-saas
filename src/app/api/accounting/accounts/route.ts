import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const organizationId = (session?.user as any)?.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let accounts = await prisma.chartOfAccount.findMany({
      where: { organizationId },
      orderBy: { code: "asc" }
    });

    // Auto-seed basic accounts if none exist
    if (accounts.length === 0) {
      await prisma.chartOfAccount.createMany({
        data: [
          { code: "1000", name: "ຊັບສິນ (Assets)", type: "ASSET", organizationId },
          { code: "1100", name: "ເງິນສົດ (Cash)", type: "ASSET", organizationId },
          { code: "1200", name: "ເງິນຝາກທະນາຄານ (Bank)", type: "ASSET", organizationId },
          { code: "2000", name: "ໜີ້ສິນ (Liabilities)", type: "LIABILITY", organizationId },
          { code: "3000", name: "ທຶນ (Equity)", type: "EQUITY", organizationId },
          { code: "4000", name: "ລາຍຮັບ (Revenue)", type: "REVENUE", organizationId },
          { code: "4100", name: "ລາຍຮັບຈາກການຂາຍ (Sales)", type: "REVENUE", organizationId },
          { code: "5000", name: "ຄ່າໃຊ້ຈ່າຍ (Expenses)", type: "EXPENSE", organizationId },
          { code: "5100", name: "ຕົ້ນທຶນສິນຄ້າຂາຍ (COGS)", type: "EXPENSE", organizationId },
        ]
      });
      accounts = await prisma.chartOfAccount.findMany({
        where: { organizationId },
        orderBy: { code: "asc" }
      });
    }

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const organizationId = (session?.user as any)?.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { code, name, type } = body;

    if (!code || !name || !type) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const account = await prisma.chartOfAccount.create({
      data: {
        code,
        name,
        type,
        organizationId
      }
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create account:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Account code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
