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

    const journals = await prisma.journalEntry.findMany({
      where: { organizationId },
      include: {
        lines: {
          include: { account: true }
        }
      },
      orderBy: { date: "desc" }
    });

    return NextResponse.json(journals);
  } catch (error) {
    console.error("Failed to fetch journals:", error);
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
    const { date, description, reference, lines } = body;

    if (!description || !lines || lines.length < 2) {
      return NextResponse.json({ error: "Description and at least two lines are required" }, { status: 400 });
    }

    // Validate Debit = Credit
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      totalDebit += parseFloat(line.debit) || 0;
      totalCredit += parseFloat(line.credit) || 0;
    }

    // Use a small epsilon to handle floating point inaccuracies
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json({ error: "Total Debit must equal Total Credit" }, { status: 400 });
    }

    if (totalDebit === 0) {
      return NextResponse.json({ error: "Entry must have a non-zero value" }, { status: 400 });
    }

    const journal = await prisma.journalEntry.create({
      data: {
        date: date ? new Date(date) : new Date(),
        description,
        reference,
        organizationId,
        lines: {
          create: lines.map((l: any) => ({
            accountId: l.accountId,
            debit: parseFloat(l.debit) || 0,
            credit: parseFloat(l.credit) || 0,
            description: l.description || null
          }))
        }
      },
      include: {
        lines: true
      }
    });

    return NextResponse.json(journal, { status: 201 });
  } catch (error) {
    console.error("Failed to create journal:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
