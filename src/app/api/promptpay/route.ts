import { NextResponse } from "next/server";
import generatePayload from "promptpay-qr";
import qrcode from "qrcode";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const amountStr = searchParams.get("amount");

  if (!id) {
    return new NextResponse("Missing PromptPay ID", { status: 400 });
  }

  const amount = amountStr ? parseFloat(amountStr) : undefined;

  try {
    const payload = generatePayload(id, { amount });
    const qrImageBuffer = await qrcode.toBuffer(payload, {
      errorCorrectionLevel: "H",
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    return new NextResponse(qrImageBuffer as any, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Failed to generate PromptPay QR:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
