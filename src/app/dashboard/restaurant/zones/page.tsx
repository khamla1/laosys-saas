import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ZonesClient from "./ZonesClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ZonesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;
  const orgId = (session.user as any).organizationId || userId;
  
  let sellerSettings = null;
  if (userId) {
    try {
      sellerSettings = await prisma.user.findUnique({
        where: { id: userId },
        select: { paymentQrCode: true, promptPayId: true, paymentAccountInfo: true }
      });
    } catch (err) {
      console.error("Error fetching seller settings in zones:", err);
    }
  }

  let orgSlug = "";
  let finalPromptPayId = sellerSettings?.promptPayId;
  let finalPaymentAccountInfo = sellerSettings?.paymentAccountInfo;
  let finalPaymentQrCode = sellerSettings?.paymentQrCode;

  if (orgId) {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { slug: true, metadata: true }
      });
      if (org) {
        orgSlug = org.slug || "";
        const orgPayment = (org.metadata as any)?.payment;
        finalPromptPayId = orgPayment?.promptPayId || finalPromptPayId;
        finalPaymentAccountInfo = orgPayment?.paymentAccountInfo || finalPaymentAccountInfo;
      }
    } catch (err) {
      console.error("Error fetching organization in zones:", err);
    }
  }

  return (
    <div className="container mx-auto py-4 sm:py-6 px-3 sm:px-4">
      <ZonesClient 
        orgSlug={orgSlug} 
        paymentQrCode={finalPaymentQrCode ?? undefined}
        promptPayId={finalPromptPayId ?? undefined}
        paymentAccountInfo={finalPaymentAccountInfo ?? undefined}
      />
    </div>
  );
}
