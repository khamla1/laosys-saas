import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateMfaSecret, verifyTOTP, logSecurityEvent, sanitizeNoSql } from "@/lib/security";

/**
 * GET: Generates an MFA secret and QR code URI for the logged-in user.
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const email = session.user.email || "user@laosys.site";
    const { secret, uri } = generateMfaSecret(email);

    // Return secret and a public QR code image generator URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`;

    return NextResponse.json({
      secret,
      qrCodeUrl,
      uri
    });
  } catch (error) {
    console.error("[MFA_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

/**
 * POST: Handles MFA setup verification and login OTP verification.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = (session.user as any).id;
    const rawBody = await request.json();
    const body = sanitizeNoSql(rawBody);
    const { action, token, secret } = body;

    if (!token) {
      return new NextResponse("Token is required", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // A. SETUP Action (Enabling MFA)
    if (action === "setup") {
      if (!secret) {
        return new NextResponse("Secret is required for setup", { status: 400 });
      }

      const isValid = verifyTOTP(token, secret);
      if (!isValid) {
        await logSecurityEvent(userId, "MFA_SETUP_FAILED", "Failed verification code during setup");
        return NextResponse.json({ success: false, error: "Invalid verification code" }, { status: 400 });
      }

      // Save secret and enable MFA
      await prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: true,
          mfaSecret: secret
        }
      });

      await logSecurityEvent(userId, "MFA_ENABLED", "Successfully enabled Multi-Factor Authentication");
      return NextResponse.json({ success: true });
    }

    // B. VERIFY Action (Verifying login session OTP)
    if (action === "verify") {
      if (!user.mfaEnabled || !user.mfaSecret) {
        return new NextResponse("MFA is not enabled for this user", { status: 400 });
      }

      const isValid = verifyTOTP(token, user.mfaSecret);
      if (!isValid) {
        await logSecurityEvent(userId, "MFA_VERIFY_FAILED", "Invalid OTP code entered during login verification");
        return NextResponse.json({ success: false, error: "Invalid verification code" }, { status: 400 });
      }

      await logSecurityEvent(userId, "MFA_VERIFY_SUCCESS", "Successful Multi-Factor Authentication verification");
      return NextResponse.json({ success: true });
    }

    return new NextResponse("Invalid action", { status: 400 });
  } catch (error) {
    console.error("[MFA_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
