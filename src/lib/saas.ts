import prisma from "@/lib/prisma";

export async function getEffectiveLimits(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      organizations: {
        take: 1,
        select: {
          organization: {
            select: {
              subscriptionStatus: true, 
              subscriptionExpiresAt: true,
              package: {
                select: {
                  name: true,
                  productLimit: true,
                  orderLimit: true,
                  staffLimit: true,
                }
              }
            }
          }
        }
      }
    }
  });

  const defaultFreeLimits = {
    planName: "FREE",
    productLimit: 10,
    orderLimit: 30,
    staffLimit: 1
  };

  if (!user || user.organizations.length === 0) return defaultFreeLimits;
  const org = user.organizations[0].organization;

  // Check Expiration / Grace Period
  let isActive = true;
  if (org.subscriptionStatus === "PAST_DUE") {
    if (org.subscriptionExpiresAt && new Date() > new Date(org.subscriptionExpiresAt)) {
      isActive = false;
    }
  } else if (org.subscriptionStatus === "CANCELED" || org.subscriptionStatus === "UNPAID") {
    isActive = false;
  }

  // If expired or no package, revert to FREE defaults
  if (!isActive || !org.package) {
    return defaultFreeLimits;
  }

  return {
    planName: org.package.name,
    productLimit: org.package.productLimit === -1 ? Infinity : org.package.productLimit,
    orderLimit: org.package.orderLimit === -1 ? Infinity : org.package.orderLimit,
    staffLimit: org.package.staffLimit === -1 ? Infinity : org.package.staffLimit
  };
}
