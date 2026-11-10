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

    const organizationId = (session.user as any).organizationId || (session.user as any).id;

    // Get tables that belong to zones in this org
    const tables = await prisma.table.findMany({
      where: { 
        zone: {
          organizationId
        }
      },
      include: {
        zone: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(tables);
  } catch (error) {
    console.error("[TABLES_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const organizationId = (session.user as any).organizationId || (session.user as any).id;
    const body = await request.json();
    const { name, seats, zoneId, batchCount, prefix } = body;

    if (!zoneId) {
      return NextResponse.json({ error: "Zone is required" }, { status: 400 });
    }

    // Verify zone belongs to org
    const zone = await prisma.zone.findUnique({
      where: { id: zoneId }
    });

    if (!zone || zone.organizationId !== organizationId) {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (batchCount && Number(batchCount) > 0) {
      const count = Math.min(Number(batchCount), 30);
      const pre = prefix?.trim() || "T-";
      const seatsNum = seats ? parseInt(seats) : 4;

      const existingTables = await prisma.table.findMany({
        where: { zoneId },
        select: { name: true }
      });
      const existingNames = new Set(existingTables.map((t: { name: string }) => t.name));

      const tablesToCreate = [];
      let currentNum = 1;
      while (tablesToCreate.length < count && currentNum <= 99) {
        const tableName = `${pre}${currentNum < 10 ? '0' + currentNum : currentNum}`;
        if (!existingNames.has(tableName)) {
          tablesToCreate.push({
            name: tableName,
            seats: seatsNum,
            zoneId,
          });
          existingNames.add(tableName);
        }
        currentNum++;
      }

      if (tablesToCreate.length > 0) {
        await prisma.table.createMany({
          data: tablesToCreate
        });
      }

      return NextResponse.json({ success: true, count: tablesToCreate.length });
    }

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const table = await prisma.table.create({
      data: {
        name,
        seats: seats ? parseInt(seats) : 2,
        zoneId,
      },
    });

    return NextResponse.json(table);
  } catch (error) {
    console.error("[TABLES_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
