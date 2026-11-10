import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import CashierClient from "./CashierClient";

export default async function CashierPage(
  props: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
  }
) {
  const searchParams = await props.searchParams;
  const action = searchParams?.action as string | undefined;


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
      console.error("Error fetching seller settings:", err);
    }
  }

  let orgSlug = "";
  let finalPromptPayId = sellerSettings?.promptPayId;
  let finalPaymentAccountInfo = sellerSettings?.paymentAccountInfo;
  let finalPaymentQrCode = sellerSettings?.paymentQrCode;
  let storeInfo = {
    name: "RESTAURANT & BAR",
    slug: "",
    logo: null as string | null,
    phone: "",
    address: "",
    exchangeRateThb: 650,
    exchangeRateUsd: 22000,
    receiptHeader: "",
    receiptFooter: ""
  };

  if (orgId) {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { name: true, slug: true, logo: true, metadata: true }
      });
      if (org) {
        orgSlug = org.slug || "";
        const meta = (org.metadata as any) || {};
        storeInfo = {
          name: org.name || "RESTAURANT & BAR",
          slug: org.slug || "",
          logo: org.logo || null,
          phone: meta.phone || meta.contactPhone || meta.tel || "",
          address: meta.address || meta.location || "",
          exchangeRateThb: Number(meta.exchangeRateThb) || 650,
          exchangeRateUsd: Number(meta.exchangeRateUsd) || 22000,
          receiptHeader: meta.receiptHeader || "",
          receiptFooter: meta.receiptFooter || ""
        };
        const orgPayment = meta.payment;
        finalPromptPayId = orgPayment?.promptPayId || finalPromptPayId;
        finalPaymentAccountInfo = orgPayment?.paymentAccountInfo || finalPaymentAccountInfo;
      }
    } catch (err) {
      console.error("Error fetching organization for cashier:", err);
    }
  }

  return (
    <div className="container mx-auto py-4 px-2 sm:px-4">
      <CashierClient 
        orgSlug={orgSlug} 
        storeInfo={storeInfo}
        paymentQrCode={finalPaymentQrCode ?? undefined}
        promptPayId={finalPromptPayId ?? undefined}
        paymentAccountInfo={finalPaymentAccountInfo ?? undefined}
      />
    </div>
  );
}
