import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "./prisma";
import bcrypt from "bcryptjs";
import { createDefaultOrganizationForUser } from "@/lib/onboarding";

/**
 * Extracts and formats client metadata (IP, OS, Browser, Device, Country)
 */
export function parseClientInfo(req: any) {
  const headers = req?.headers || {};

  // Extract client IP address taking into account Cloudflare, Nginx, and proxies
  const rawIp =
    headers["cf-connecting-ip"] ||
    headers["x-real-ip"] ||
    headers["x-forwarded-for"] ||
    "Unknown";
  const ipAddress = typeof rawIp === "string" ? rawIp.split(",")[0].trim() : "Unknown";

  const userAgent = typeof headers["user-agent"] === "string" ? headers["user-agent"] : "";
  const country = typeof headers["cf-ipcountry"] === "string" ? headers["cf-ipcountry"] : null;

  // Detect Operating System
  let os = "Unknown OS";
  if (/windows phone/i.test(userAgent)) os = "Windows Phone";
  else if (/windows nt 10/i.test(userAgent)) os = "Windows 10/11";
  else if (/windows nt 6.3/i.test(userAgent)) os = "Windows 8.1";
  else if (/windows nt 6.2/i.test(userAgent)) os = "Windows 8";
  else if (/windows nt 6.1/i.test(userAgent)) os = "Windows 7";
  else if (/windows nt/i.test(userAgent)) os = "Windows";
  else if (/android/i.test(userAgent)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(userAgent)) os = "iOS";
  else if (/macintosh|mac os x/i.test(userAgent)) os = "macOS";
  else if (/linux/i.test(userAgent)) os = "Linux";

  // Detect Web Browser
  let browser = "Unknown Browser";
  if (/edg([ea]|ios)?\//i.test(userAgent)) browser = "Microsoft Edge";
  else if (/opr\/|opera/i.test(userAgent)) browser = "Opera";
  else if (/samsungbrowser/i.test(userAgent)) browser = "Samsung Browser";
  else if (/chrome|crios/i.test(userAgent)) browser = "Google Chrome";
  else if (/firefox|fxios/i.test(userAgent)) browser = "Mozilla Firefox";
  else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = "Apple Safari";

  // Detect Device Category
  let device = "Desktop";
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    device = "Tablet";
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(userAgent)) {
    device = "Mobile";
  }

  return {
    ipAddress,
    userAgent,
    country,
    os,
    browser,
    device,
  };
}

export const authOptions: NextAuthOptions = {
  // @ts-ignore
  trustHost: true,
  adapter: PrismaAdapter(prisma as any),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        token: { label: "Token", type: "text" }
      },
      async authorize(credentials, req) {
        const clientInfo = parseClientInfo(req);

        if (credentials?.token) {
          const tokenRecord = await prisma.verificationToken.findFirst({
            where: { token: credentials.token }
          });
          if (!tokenRecord || tokenRecord.expires < new Date()) {
            throw new Error("Invalid or expired token");
          }
          const user = await prisma.user.findUnique({
            where: { email: tokenRecord.identifier },
            include: {
              organizations: {
                take: 1,
                select: {
                  organizationId: true,
                  role: true,
                  organization: { select: { id: true, name: true, slug: true } }
                }
              }
            }
          });
          if (!user) throw new Error("User not found");
          
          await prisma.verificationToken.delete({ where: { id: tokenRecord.id } });
          
          const orgId = user.organizations?.[0]?.organizationId || null;
          const storeName = user.organizations?.[0]?.organization?.name || "Super Admin Store";

          // Audit log admin impersonation login
          try {
            await prisma.auditLog.create({
              data: {
                userId: user.id,
                organizationId: orgId,
                action: "ADMIN_IMPERSONATION_LOGIN",
                details: `ເຂົ້າສູ່ລະບົບດ້ວຍ Token (Admin Impersonation): ${user.name || user.email} [${clientInfo.device} • ${clientInfo.browser} on ${clientInfo.os} • IP: ${clientInfo.ipAddress}]`,
                ipAddress: clientInfo.ipAddress,
                metadata: {
                  entityType: "AUTH",
                  loginMethod: "admin_token",
                  userEmail: user.email,
                  userName: user.name,
                  userRole: user.role,
                  storeId: orgId,
                  storeName,
                  ...clientInfo,
                  timestamp: new Date().toISOString(),
                }
              }
            });
          } catch (e) {
            console.error("Failed to write impersonation audit log:", e);
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: orgId,
            orgRole: user.organizations?.[0]?.role || null,
            mfaEnabled: user.mfaEnabled,
            mfaVerified: true, // Auto-verified since it's admin impersonation
          };
        }

        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            organizations: {
              take: 1,
              select: {
                organizationId: true,
                role: true,
                organization: { select: { id: true, name: true, slug: true } }
              }
            }
          }
        });

        if (!user || !user.password) {
          // Log failed login attempt with non-existent user or no password set
          try {
            await prisma.auditLog.create({
              data: {
                action: "FAILED_LOGIN",
                details: `ພະຍາຍາມເຂົ້າສູ່ລະບົບດ້ວຍອີເມວທີ່ບໍ່ມີໃນລະບົບ: ${credentials.email} [IP: ${clientInfo.ipAddress}]`,
                ipAddress: clientInfo.ipAddress,
                metadata: {
                  entityType: "AUTH",
                  attemptEmail: credentials.email,
                  failureReason: "User not found or no password",
                  ...clientInfo,
                  timestamp: new Date().toISOString(),
                }
              }
            });
          } catch (e) {
            console.error("Failed to write audit log:", e);
          }
          throw new Error("Invalid credentials");
        }

        // Account Lockout check
        const now = new Date();
        if (user.lockoutUntil && user.lockoutUntil > now) {
          const waitMinutes = Math.ceil((user.lockoutUntil.getTime() - now.getTime()) / 60000);

          try {
            await prisma.auditLog.create({
              data: {
                userId: user.id,
                organizationId: user.organizations?.[0]?.organizationId || null,
                action: "ACCOUNT_LOCKED",
                details: `ພະຍາຍາມເຂົ້າສູ່ລະບົບໃນຂະນະທີ່ບັນຊີຖືກລັອກ (ເຫຼືອອີກ ${waitMinutes} ນາທີ): ${user.email} [IP: ${clientInfo.ipAddress}]`,
                ipAddress: clientInfo.ipAddress,
                metadata: {
                  entityType: "AUTH",
                  attemptEmail: credentials.email,
                  waitMinutes,
                  lockedUntil: user.lockoutUntil.toISOString(),
                  ...clientInfo,
                  timestamp: new Date().toISOString(),
                }
              }
            });
          } catch (e) {
            console.error("Failed to write lockout audit log:", e);
          }

          throw new Error(`Account temporarily locked. Try again in ${waitMinutes} minute(s).`);
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          // Increment failed attempts and trigger lockout if >= 5
          const newAttempts = user.failedLoginAttempts + 1;
          const isLockoutTriggered = newAttempts >= 5;
          const lockoutTime = isLockoutTriggered ? new Date(Date.now() + 15 * 60 * 1000) : null;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: newAttempts,
              lockoutUntil: lockoutTime
            }
          });

          // Log failed login event
          try {
            await prisma.auditLog.create({
              data: {
                userId: user.id,
                organizationId: user.organizations?.[0]?.organizationId || null,
                action: isLockoutTriggered ? "ACCOUNT_LOCKED" : "FAILED_LOGIN",
                details: isLockoutTriggered
                  ? `ບັນຊີຖືກລັອກຊົ່ວຄາວ 15 ນາທີ ຍ້ອນໃສ່ລະຫັດຜິດ 5 ຄັ້ງ (${user.email}) [IP: ${clientInfo.ipAddress}]`
                  : `ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ ຄັ້ງທີ ${newAttempts}/5 (${user.email}) [IP: ${clientInfo.ipAddress}]`,
                ipAddress: clientInfo.ipAddress,
                metadata: {
                  entityType: "AUTH",
                  attemptEmail: credentials.email,
                  attemptNumber: newAttempts,
                  isLockoutTriggered,
                  failureReason: "Incorrect password",
                  storeName: user.organizations?.[0]?.organization?.name || "ທົ່ວລະບົບ",
                  ...clientInfo,
                  timestamp: new Date().toISOString(),
                }
              }
            });
          } catch (e) {
            console.error("Failed to write audit log:", e);
          }

          if (isLockoutTriggered) {
            throw new Error("Too many failed attempts. Account locked for 15 minutes.");
          }
          throw new Error("Invalid credentials");
        }

        if (user.status === "BLOCKED" || user.status === "SUSPENDED") {
          try {
            await prisma.auditLog.create({
              data: {
                userId: user.id,
                organizationId: user.organizations?.[0]?.organizationId || null,
                action: "BLOCKED_LOGIN_ATTEMPT",
                details: `ພະຍາຍາມເຂົ້າສູ່ລະບົບດ້ວຍບັນຊີທີ່ຖືກລະງັບ (${user.status}): ${user.email} [IP: ${clientInfo.ipAddress}]`,
                ipAddress: clientInfo.ipAddress,
                metadata: {
                  entityType: "AUTH",
                  userStatus: user.status,
                  ...clientInfo,
                  timestamp: new Date().toISOString(),
                }
              }
            });
          } catch (e) {
            console.error("Failed to write blocked audit log:", e);
          }
          throw new Error(`Account is ${user.status.toLowerCase()}`);
        }

        // Log successful login and reset attempts
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockoutUntil: null,
            lastLoginAt: new Date()
          }
        });

        // Migration/Failsafe: If user has no organization, create one automatically
        let orgId = user.organizations?.[0]?.organizationId || null;
        let storeName = user.organizations?.[0]?.organization?.name || null;
        
        if (!orgId) {
          const newOrg = await createDefaultOrganizationForUser(user);
          orgId = newOrg.id;
          storeName = newOrg.name;
        } else if (!storeName) {
          storeName = "Super Admin's Store";
        }

        const orgRole = user.organizations?.[0]?.role || user.role || "STAFF";

        // Log successful login with complete details
        try {
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              organizationId: orgId,
              action: "SUCCESSFUL_LOGIN",
              details: `ເຂົ້າສູ່ລະບົບສຳເລັດ: ${user.name || user.email} (${user.role}) [${clientInfo.device} • ${clientInfo.browser} on ${clientInfo.os} • IP: ${clientInfo.ipAddress}]`,
              ipAddress: clientInfo.ipAddress,
              metadata: {
                entityType: "AUTH",
                loginMethod: "credentials",
                userEmail: user.email,
                userName: user.name,
                userRole: user.role,
                orgRole,
                storeId: orgId,
                storeName,
                ...clientInfo,
                timestamp: new Date().toISOString(),
              }
            }
          });
        } catch (e) {
          console.error("Failed to write audit log:", e);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: orgId,
          orgRole: orgRole,
          mfaEnabled: user.mfaEnabled,
          mfaVerified: false, // Must verify TOTP if mfaEnabled is true
        };
      }
    })
  ],
  events: {
    async signOut(message) {
      try {
        const token = message?.token;
        if (token?.id) {
          await prisma.auditLog.create({
            data: {
              userId: token.id as string,
              organizationId: (token.organizationId as string) || null,
              action: "LOGOUT",
              details: `ອອກຈາກລະບົບ (Logout): ${(token as any).name || (token as any).email || "User"}`,
              metadata: {
                entityType: "AUTH",
                userId: token.id,
                email: (token as any).email,
                role: (token as any).role,
                timestamp: new Date().toISOString(),
              }
            }
          });
        }
      } catch (e) {
        console.error("Failed to log signOut event:", e);
      }
    }
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.organizationId = (user as any).organizationId;
        token.orgRole = (user as any).orgRole;
        token.mfaEnabled = (user as any).mfaEnabled;
        token.mfaVerified = (user as any).mfaVerified;
      }
      
      // Allow dynamic token updates for MFA verification
      if (trigger === "update" && session) {
        if (session.mfaVerified !== undefined) {
          token.mfaVerified = session.mfaVerified;
        }
        if (session.mfaEnabled !== undefined) {
          token.mfaEnabled = session.mfaEnabled;
        }
        if (session.organizationId !== undefined && token.role === "ADMIN") {
          token.organizationId = session.organizationId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).organizationId = token.organizationId;
        (session.user as any).orgRole = token.orgRole;
        (session.user as any).mfaEnabled = token.mfaEnabled;
        (session.user as any).mfaVerified = token.mfaVerified;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};
