import crypto from "crypto";
import prisma from "./prisma";

// ==========================================
// 1. INPUT SANITIZATION & NOSQL PROTECTION
// ==========================================

/**
 * Sanitizes input strings to prevent XSS by escaping HTML special characters.
 */
export function sanitizeInput(str: string): string {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Recursively strips keys starting with "$" to prevent NoSQL query injection.
 */
export function sanitizeNoSql(input: any): any {
  if (input === null || typeof input !== "object") {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map(item => sanitizeNoSql(item));
  }
  const sanitized: any = {};
  for (const key in input) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      if (key.startsWith("$")) {
        // Drop the NoSQL operator key
        continue;
      }
      sanitized[key] = sanitizeNoSql(input[key]);
    }
  }
  return sanitized;
}

// ==========================================
// 2. WEB APPLICATION FIREWALL (WAF) ENGINE
// ==========================================

const ATTACK_PATTERNS = {
  sqlInjection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)|('|--|\/\*|\*\/)/i,
  xss: /(<script\b[^>]*>|javascript:|onload=|onerror=|onmouseover=|<iframe|<object)/i,
  pathTraversal: /(\.\.\/|\.\.\\)/i,
  commandInjection: /(\b(exec|spawn|fork|system|sh|bash|cmd|powershell)\b)|[;&|`$]/i,
  ssrf: /(localhost|127\.0\.0\.1|0\.0\.0\.0|169\.254\.169\.254)/i
};

/**
 * Checks request parameters and body for malicious attack signatures.
 */
export function checkWaf(path: string, query: string, bodyStr: string): { isThreat: boolean; reason?: string } {
  const payload = `${path} ${query} ${bodyStr}`;

  if (ATTACK_PATTERNS.xss.test(payload)) {
    return { isThreat: true, reason: "Cross-Site Scripting (XSS) payload detected" };
  }
  if (ATTACK_PATTERNS.sqlInjection.test(payload)) {
    return { isThreat: true, reason: "SQL Injection signature detected" };
  }
  if (ATTACK_PATTERNS.pathTraversal.test(payload)) {
    return { isThreat: true, reason: "Path Traversal attack signature detected" };
  }
  if (ATTACK_PATTERNS.commandInjection.test(payload)) {
    return { isThreat: true, reason: "Command Injection attempt detected" };
  }
  if (ATTACK_PATTERNS.ssrf.test(payload)) {
    return { isThreat: true, reason: "Server-Side Request Forgery (SSRF) signature detected" };
  }

  return { isThreat: false };
}

// ==========================================
// 3. MFA/2FA (TOTP) SECURITY ENGINE
// ==========================================

/**
 * Decodes standard Base32 encoded strings into a binary Buffer.
 */
function decodeBase32(base32: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = base32.toUpperCase().replace(/=+$/, "");
  let bits = "";
  for (let i = 0; i < cleaned.length; i++) {
    const val = alphabet.indexOf(cleaned[i]);
    if (val === -1) throw new Error("Invalid base32 character");
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/**
 * Generates a 6-digit TOTP (Time-based One-Time Password) code.
 */
export function generateTOTP(secret: string, windowOffset: number = 0): string {
  const key = decodeBase32(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const time = Math.floor(epoch / 30) + windowOffset;

  const buffer = Buffer.alloc(8);
  let tmp = time;
  for (let i = 7; i >= 0; i--) {
    buffer[i] = tmp & 0xff;
    tmp = tmp >> 8;
  }

  const hmac = crypto.createHmac("sha1", key);
  hmac.update(buffer);
  const hmacResult = hmac.digest();

  const offset = hmacResult[hmacResult.length - 1] & 0xf;
  const code =
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff);

  const otp = code % 1000000;
  return otp.toString().padStart(6, "0");
}

/**
 * Verifies a TOTP 2FA code with clock drift window allowance (±30 seconds).
 */
export function verifyTOTP(token: string, secret: string): boolean {
  for (let i = -1; i <= 1; i++) {
    if (generateTOTP(secret, i) === token) {
      return true;
    }
  }
  return false;
}

/**
 * Generates a random Base32 MFA Secret and otpauth URI.
 */
export function generateMfaSecret(email: string): { secret: string; uri: string } {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  for (let i = 0; i < 16; i++) {
    secret += alphabet[crypto.randomInt(0, 32)];
  }
  const uri = `otpauth://totp/Laosys:${email}?secret=${secret}&issuer=Laosys`;
  return { secret, uri };
}

// ==========================================
// 4. API RATE LIMITING (TOKEN BUCKET)
// ==========================================

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

const rateLimitCache = new Map<string, RateLimitBucket>();
const BUCKET_LIMIT = 60; // Max requests
const REFILL_RATE = 10; // Refill tokens per minute

/**
 * In-memory rate limiter based on the Token Bucket algorithm.
 */
export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rateLimitCache.get(ip) || { tokens: BUCKET_LIMIT, lastRefill: now };

  // Calculate elapsed time in minutes
  const elapsedMinutes = (now - bucket.lastRefill) / 60000;
  const refillTokens = Math.floor(elapsedMinutes * REFILL_RATE);

  if (refillTokens > 0) {
    bucket.tokens = Math.min(BUCKET_LIMIT, bucket.tokens + refillTokens);
    bucket.lastRefill = now;
  }

  if (bucket.tokens > 0) {
    bucket.tokens -= 1;
    rateLimitCache.set(ip, bucket);
    return false;
  }

  return true;
}

// ==========================================
// 5. SECURITY AUDIT LOGGING
// ==========================================

export async function logSecurityEvent(userId: string | null, action: string, details: string) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details: `${new Date().toISOString()} | ${details}`
      }
    });
  } catch (error) {
    console.error("Failed to write security audit log:", error);
  }
}

// ==========================================
// 6. THREAT DETECTION & RISK SCORING
// ==========================================

/**
 * Evaluates request metadata to assess threats and assign a risk score (0-100).
 */
export function calculateRiskScore(userAgent: string, ipCountry: string | null): number {
  let score = 0;

  // Suspicious user agents
  if (/sqlmap|nikto|hydra|dirbuster|nmap|curl|python|wget/i.test(userAgent)) {
    score += 50;
  }

  // Risky IP country codes
  if (ipCountry && ["KP", "IR", "SY", "RU"].includes(ipCountry.toUpperCase())) {
    score += 30;
  }

  return score;
}
