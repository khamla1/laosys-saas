import {
  verifyMobileRequest,
  mobileSuccess,
  mobileError,
  handleCorsOptions,
  getOrCreateApiKey,
  regenerateApiKey,
} from "@/lib/mobile-auth";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function OPTIONS() {
  return handleCorsOptions();
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return mobileError("Unauthorized - Please log in to manage API keys", 401);
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    let organizationId = (session.user as any).organizationId;

    if (!organizationId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizations: { take: 1, select: { organizationId: true } } },
      });
      organizationId = user?.organizations?.[0]?.organizationId;
    }

    if (!organizationId) {
      return mobileError("No organization associated with this account", 400);
    }

    const apiKey = await getOrCreateApiKey(organizationId);
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, slug: true, metadata: true },
    });

    const meta = (org?.metadata as any) || {};

    return mobileSuccess({
      organizationId,
      storeName: org?.name,
      apiKey,
      createdAt: meta.apiKeyCreatedAt || null,
      rotatedAt: meta.apiKeyRotatedAt || null,
    });
  } catch (error: any) {
    console.error("[MOBILE_KEYS_GET]", error);
    return mobileError("Failed to retrieve API key", 500, error.message);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return mobileError("Unauthorized - Please log in to regenerate API keys", 401);
    }

    const userId = (session.user as any).id;
    let organizationId = (session.user as any).organizationId;

    if (!organizationId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { organizations: { take: 1, select: { organizationId: true } } },
      });
      organizationId = user?.organizations?.[0]?.organizationId;
    }

    if (!organizationId) {
      return mobileError("No organization found", 400);
    }

    const newKey = await regenerateApiKey(organizationId);

    return mobileSuccess({
      message: "API key successfully regenerated",
      organizationId,
      apiKey: newKey,
      rotatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[MOBILE_KEYS_POST]", error);
    return mobileError("Failed to regenerate API key", 500, error.message);
  }
}
