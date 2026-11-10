import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { NextResponse } from "next/server";

export interface MobileAuthResult {
  authenticated: boolean;
  organizationId?: string;
  organizationName?: string;
  userId?: string;
  authMethod?: "API_KEY" | "SESSION";
  isAdmin?: boolean;
  error?: string;
}

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key, x-api-key",
};

/**
 * Handle CORS preflight OPTIONS request
 */
export function handleCorsOptions() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * Standard JSON response for Mobile APIs with CORS headers
 */
export function mobileSuccess(data: any, status = 200) {
  return NextResponse.json(
    { success: true, ...data },
    {
      status,
      headers: CORS_HEADERS,
    }
  );
}

/**
 * Standard Error response for Mobile APIs with CORS headers
 */
export function mobileError(message: string, status = 400, details?: any) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details ? { details } : {}),
    },
    {
      status,
      headers: CORS_HEADERS,
    }
  );
}

/**
 * Verifies mobile request using either:
 * 1. X-API-Key or Bearer token header
 * 2. Active NextAuth session cookie (for Admin/Dashboard testing)
 */
export async function verifyMobileRequest(req?: Request): Promise<MobileAuthResult> {
  let apiKey: string | null = null;

  if (req) {
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      apiKey = authHeader.substring(7).trim();
    }
    if (!apiKey) {
      apiKey = req.headers.get("x-api-key") || req.headers.get("X-API-Key");
    }
    if (!apiKey) {
      try {
        const url = new URL(req.url);
        apiKey = url.searchParams.get("apiKey") || url.searchParams.get("key");
      } catch {
        // ignore url parse error
      }
    }
  }

  // 1. Authenticate via API Key
  if (apiKey) {
    // Look up organization matching this apiKey in metadata
    const orgs = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        metadata: true,
      },
    });

    const matchingOrg = orgs.find((org: any) => {
      const meta = org.metadata as any;
      if (!meta) return false;
      if (meta.apiKey && meta.apiKey === apiKey) return true;
      if (Array.isArray(meta.apiKeys) && meta.apiKeys.includes(apiKey)) return true;
      return false;
    });

    if (matchingOrg) {
      return {
        authenticated: true,
        organizationId: matchingOrg.id,
        organizationName: matchingOrg.name,
        authMethod: "API_KEY",
        isAdmin: false,
      };
    }

    // Check system admin master API key if configured in settings
    try {
      const systemSetting = await prisma.setting.findFirst({
        where: { key: "MASTER_API_KEY" },
      });
      if (systemSetting && systemSetting.value === apiKey) {
        const defaultOrg = orgs[0];
        return {
          authenticated: true,
          organizationId: defaultOrg?.id,
          organizationName: defaultOrg?.name,
          authMethod: "API_KEY",
          isAdmin: true,
        };
      }
    } catch {
      // ignore
    }

    return {
      authenticated: false,
      error: "Invalid or unrecognized API Key. Please verify your API Key in Admin Settings.",
    };
  }

  // 2. Authenticate via active NextAuth session
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const userId = (session.user as any).id;
      const role = (session.user as any).role;
      const isAdmin = role === "ADMIN";
      let organizationId = (session.user as any).organizationId;

      if (!organizationId && !isAdmin) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { organizations: { take: 1, select: { organizationId: true } } },
        });
        organizationId = user?.organizations?.[0]?.organizationId;
      }

      if (organizationId || isAdmin) {
        let orgName = "Store";
        if (organizationId) {
          const org = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { name: true },
          });
          if (org) orgName = org.name;
        }

        return {
          authenticated: true,
          organizationId: organizationId || undefined,
          organizationName: orgName,
          userId,
          isAdmin,
          authMethod: "SESSION",
        };
      }
    }
  } catch {
    // session lookup error
  }

  return {
    authenticated: false,
    error: "Unauthorized: Missing API Key or valid session. Please provide 'X-API-Key' or 'Authorization: Bearer <API_KEY>' header.",
  };
}

/**
 * Retrieves the current API key for an organization, or generates a fresh one if missing.
 */
export async function getOrCreateApiKey(orgId: string): Promise<string> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, metadata: true },
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  const meta = (org.metadata as any) || {};
  if (meta.apiKey && typeof meta.apiKey === "string" && meta.apiKey.length > 10) {
    return meta.apiKey;
  }

  // Generate new secure key
  const newKey = "sk_live_" + crypto.randomBytes(16).toString("hex");
  const updatedMeta = { ...meta, apiKey: newKey, apiKeyCreatedAt: new Date().toISOString() };

  await prisma.organization.update({
    where: { id: orgId },
    data: { metadata: updatedMeta },
  });

  return newKey;
}

/**
 * Regenerates a new API key for an organization.
 */
export async function regenerateApiKey(orgId: string): Promise<string> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, metadata: true },
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  const meta = (org.metadata as any) || {};
  const newKey = "sk_live_" + crypto.randomBytes(16).toString("hex");
  const updatedMeta = {
    ...meta,
    apiKey: newKey,
    apiKeyRotatedAt: new Date().toISOString(),
  };

  await prisma.organization.update({
    where: { id: orgId },
    data: { metadata: updatedMeta },
  });

  return newKey;
}
