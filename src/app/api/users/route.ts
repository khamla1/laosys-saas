import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email format").max(150),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "SELLER",
        status: "ACTIVE",
      },
    });

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "Unknown";
    const adminId = (session.user as any).id;

    await prisma.auditLog.create({
      data: {
        action: "CREATE_USER",
        details: `Admin created user ${email}`,
        userId: adminId,
        organizationId: (session.user as any).organizationId || undefined,
        ipAddress: ip,
      }
    });

    return NextResponse.json(
      { message: "Seller created successfully", user: { id: newUser.id, email: newUser.email } },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API ERROR] [USERS_POST]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
