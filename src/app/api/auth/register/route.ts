import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { z } from "zod";
import { createDefaultOrganizationForUser } from "@/lib/onboarding";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Zod Input Validation & Sanitization
    const { name, email, password } = registerSchema.parse(body);

    // 2. Check for duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 409 }
      );
    }

    // 3. Hash Password (bcrypt salt rounds = 12 for higher security)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create User
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "SELLER", // Default role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    // 5. Audit Log (Security Tracking)
    await prisma.auditLog.create({
      data: {
        userId: newUser.id,
        action: "USER_REGISTERED",
        details: "New user registered via secure API",
      }
    });

    // 6. Automatic Onboarding: Create Organization, Storefront, Zones, Tables, and Sample Products
    await createDefaultOrganizationForUser(newUser);

    return NextResponse.json(
      { message: "User registered successfully", user: newUser },
      { status: 201 }
    );

  } catch (error) {
    // Hide internal Zod/Prisma errors from client, only return safe messages
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors[0]?.message || "Validation Error" }, { status: 400 });
    }
    
    console.error("Registration Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
