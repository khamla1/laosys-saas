import {
  verifyMobileRequest,
  mobileSuccess,
  mobileError,
  handleCorsOptions,
} from "@/lib/mobile-auth";
import prisma from "@/lib/prisma";

export async function OPTIONS() {
  return handleCorsOptions();
}

export async function GET(req: Request) {
  try {
    const auth = await verifyMobileRequest(req);
    if (!auth.authenticated || !auth.organizationId) {
      return mobileError(auth.error || "Unauthorized", 401);
    }

    const org = await prisma.organization.findUnique({
      where: { id: auth.organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        businessType: true,
        enabledModules: true,
        metadata: true,
        createdAt: true,
      },
    });

    if (!org) {
      return mobileError("Store organization not found", 404);
    }

    const meta = (org.metadata as any) || {};

    return mobileSuccess({
      message: "Connected successfully to Store API",
      authMethod: auth.authMethod,
      serverTime: new Date().toISOString(),
      apiVersion: "v1.0",
      store: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo: org.logo,
        businessType: org.businessType,
        phone: meta.phone || "",
        province: meta.province || "",
        district: meta.district || "",
        address: meta.fullAddress || meta.addressDetail || "",
        currency: {
          primary: "LAK",
          rateTHB: meta.rates?.thb || 650,
          rateUSD: meta.rates?.usd || 22000,
        },
        enabledModules: org.enabledModules,
      },
    });
  } catch (error: any) {
    console.error("[MOBILE_CONNECT_GET]", error);
    return mobileError("Internal server error", 500, error.message);
  }
}
