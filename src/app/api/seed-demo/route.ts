import { NextResponse } from "next/server";
import { seedAllBusinesses } from "@/lib/seed-all";

export async function GET() {
  try {
    const result = await seedAllBusinesses();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error seeding demo (GET):", error);
    return NextResponse.json({ error: error.message || "Seeding demo failed" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await seedAllBusinesses();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error seeding demo (POST):", error);
    return NextResponse.json({ error: error.message || "Seeding demo failed" }, { status: 500 });
  }
}
