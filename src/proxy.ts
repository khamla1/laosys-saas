import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getScreenById } from "@/lib/screens";

// NextAuth Middleware wrapper
const authMiddleware = withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const { token } = req.nextauth;

    // 1. RBAC Check (Protect Admin Routes)
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // 2. MFA Enforcer
    // If MFA is enabled for user but they haven't verified it in this session,
    // redirect them to the /mfa-verify page (unless they are already going there or verifying).
    const isMfaPage = pathname === "/mfa-verify" || pathname.startsWith("/api/auth/mfa");
    if (token?.mfaEnabled && !token?.mfaVerified && !isMfaPage) {
      return NextResponse.redirect(new URL("/mfa-verify", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export default async function middleware(req: NextRequest, event: any) {
  const { pathname, search } = req.nextUrl;

  // â”€â”€ 1. Clean Path Screen ID Routing (/screen/:id, /s/:id, or direct /:code without ?) â”€â”€
  let targetScreenId: string | null = null;
  const screenPathPrefixMatch = pathname.match(/^\/(?:screen|s)\/([A-Za-z0-9_-]+)$/i);
  if (screenPathPrefixMatch) {
    const candidate = screenPathPrefixMatch[1].toUpperCase();
    if (getScreenById(candidate)) {
      targetScreenId = candidate;
    }
  } else {
    const directCodeMatch = pathname.match(/^\/([A-Za-z0-9_-]+)$/);
    if (directCodeMatch) {
      const candidate = directCodeMatch[1].toUpperCase();
      if (getScreenById(candidate)) {
        targetScreenId = candidate;
      }
    }
  }

  // â”€â”€ 2. Standard Query Parameter Screen ID Routing (?screenId=XXXXXX) â”€â”€
  if (!targetScreenId) {
    const queryScreenId = req.nextUrl.searchParams.get("screenId");
    if (queryScreenId) {
      targetScreenId = queryScreenId.toUpperCase();
    }
  }

  if (targetScreenId) {
    const screenDef = getScreenById(targetScreenId);
    if (screenDef) {
      const hasSession =
        req.cookies.has("next-auth.session-token") ||
        req.cookies.has("__Secure-next-auth.session-token");

      // 1. If accessing protected dashboard/admin screen without login -> redirect to login
      if (screenDef.path.startsWith("/dashboard") || screenDef.path.startsWith("/admin")) {
        if (!hasSession) {
          const loginUrl = new URL("/login", req.url);
          loginUrl.searchParams.set("callbackUrl", `/${screenDef.screenId}`);
          return NextResponse.redirect(loginUrl);
        }
      }

      // 2. If query param ?screenId=... was used at root or dashboard, redirect to direct clean /:screenId
      if (req.nextUrl.searchParams.has("screenId")) {
        const cleanUrl = new URL(`/${screenDef.screenId}`, req.url);
        req.nextUrl.searchParams.forEach((val, key) => {
          if (key !== "screenId") cleanUrl.searchParams.set(key, val);
        });
        return NextResponse.redirect(cleanUrl);
      }

      // 3. For direct short route (/SCREEN_ID), rewrite internally to target page so address bar stays clean!
      const dest = new URL(screenDef.path, req.url);
      dest.searchParams.set("screenId", screenDef.screenId);
      return NextResponse.rewrite(dest);
    }
  }

  // ==========================================
  // A. WAF PAYLOAD INSPECTION & RATE LIMITING
  // ==========================================
  const payload = decodeURIComponent(pathname + search).toLowerCase();
  
  // Rate Limiting (100 req / 15m globally, 10 req / 5m for login)
  // Strict Trusted IP Extraction (Anti-Spoofing)
  const ip = req.headers.get('cf-connecting-ip') || 
             req.headers.get('x-vercel-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             req.headers.get('x-forwarded-for')?.split(',')[0] || 
             '127.0.0.1';
  const now = Date.now();
  
  (global as any).rateLimitMap = (global as any).rateLimitMap || new Map();
  const map = (global as any).rateLimitMap;

  const isLoginRoute = pathname.startsWith("/api/auth/callback/credentials") || pathname.startsWith("/api/login") || pathname.startsWith("/api/register");
  
  if (pathname.startsWith("/api/")) {
    console.log("[REQ]", ip, pathname);
  }
  
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = isLoginRoute ? 100 : 1000; // 100 for login, 1000 default
  const key = `${ip}_${isLoginRoute ? 'login' : 'api'}`;
  
  const windowStart = now - windowMs;
  let requestData = map.get(key);
  
  if (!requestData || requestData.lastReset < windowStart) {
    requestData = { count: 1, lastReset: now };
  } else {
    requestData.count++;
  }
  map.set(key, requestData);

  if (requestData.count > maxRequests) {
    // SECURITY AUDIT LOGGING: Rate Limit Exceeded
    console.warn(JSON.stringify({
      event: "SECURITY_ALERT",
      type: "RATE_LIMIT_EXCEEDED",
      ip: ip,
      path: pathname,
      timestamp: new Date().toISOString()
    }));
    return new NextResponse(JSON.stringify({ error: "Too Many Requests" }), { status: 429, headers: { "Content-Type": "application/json" } });
  }
  
  // â”€â”€ Skip WAF scan for NextAuth internal routes (prevent false-positive blocking) â”€â”€
  const isNextAuthRoute = pathname.startsWith("/api/auth");

  if (!isNextAuthRoute) {
    const hasSql = /(\b(select\s+.*\s+from|insert\s+into|delete\s+from|drop\s+(table|database)|union\s+(all\s+)?select|alter\s+table|create\s+(table|database)|truncate\s+table)\b)|('--|\/\*|\*\/)/i.test(payload);
    const hasXss = /(<script\b[^>]*>|javascript:|onload=|onerror=|<iframe|<object)/i.test(payload);
    const hasTraversal = /(\.\.\/|\.\.\\ )/i.test(payload);
    const hasCmd = /(\b(exec|spawn|fork|system|sh|bash|cmd|powershell)\b)/i.test(payload);

    if (hasSql || hasXss || hasTraversal || hasCmd) {
      console.warn(JSON.stringify({
        event: "SECURITY_ALERT",
        type: "WAF_PAYLOAD_BLOCKED",
        ip: ip,
        path: pathname,
        timestamp: new Date().toISOString()
      }));
      return new NextResponse("Blocked by Web Application Firewall (WAF) rule", { status: 403 });
    }
  }

  // â”€â”€ Public API Routes (NextAuth, Settings, Webhooks, Public Products) â”€â”€
  // Return early with clean NextResponse.next() so Next.js 16 Turbopack App Router executes route.ts properly
  const publicApiPrefixes = [
    "/api/v1/mobile",
    "/api/auth",
    "/api/public",
    "/api/shop",
    "/api/webhook",
    "/api/settings",
    "/api/buy",
    "/api/checkout",
    "/api/products",
    "/api/classes",
    "/api/request-account",
    "/api/promptpay",
    "/api/seed-businesses",
    "/api/seed-demo",
    "/api/cron"
  ];
  const isPublicApi = publicApiPrefixes.some(prefix => pathname.startsWith(prefix));
  if (isPublicApi) {
    return NextResponse.next();
  }

  // ==========================================
  // B. SECURE HEADERS SYSTEM (Non-API Pages)
  // ==========================================
  // Note: API & Global security headers are also handled in next.config.ts
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https:;"
  );

  // ==========================================
  // C. PROTECTED ROUTE FILTER (Default Deny)
  // ==========================================
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname === "/mfa-verify";

  if (isProtectedRoute) {
    const authRes = await authMiddleware(req as any, event);
    if (authRes) {
      authRes.headers.set("X-Frame-Options", "DENY");
      authRes.headers.set("X-Content-Type-Options", "nosniff");
      authRes.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      authRes.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
      return authRes;
    }
  }

  return response;
}

// Global Matcher to ensure WAF runs on all relevant requests
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
