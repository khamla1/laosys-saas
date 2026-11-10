import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { FOMOCheckoutFormV2 } from "@/components/FOMOCheckoutFormV2";
import { getEffectiveLimits } from "@/lib/saas";
import { AlertCircle } from "lucide-react";

export default async function BuyLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    include: { 
      products: true,
      organization: {
        include: {
          members: {
            where: { role: { in: ['OWNER', 'ADMIN'] } },
            include: { user: true },
            take: 1
          }
        }
      }
    }
  });

  if (!shareLink || shareLink.status !== "ACTIVE") {
    return <ExpiredView message="This link is invalid or has been disabled." />;
  }

  const now = new Date();
  if (shareLink.expiresAt < now) {
    return <ExpiredView message="This link has expired. The sale is over!" />;
  }

  if (!shareLink.products || shareLink.products.length === 0) {
    return <ExpiredView message="There are no products available in this link." />;
  }

  // Check if all products are out of stock
  if (shareLink.products.every(p => p.stock <= 0)) {
    return <ExpiredView message="All products in this link are currently out of stock." />;
  }

  const ownerUser = shareLink.organization?.members[0]?.user;

  // Check limits
  const limits = await getEffectiveLimits(ownerUser?.id || "");

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-2 sm:p-6 font-sans text-white">
      <div className="w-full max-w-7xl flex-1 flex flex-col justify-center">
        <FOMOCheckoutFormV2 
          token={shareLink.token} 
          expiresAt={shareLink.expiresAt.toISOString()} 
          products={shareLink.products as any[]} 
          paymentQrCode={ownerUser?.paymentQrCode ?? undefined}
          paymentAccountInfo={ownerUser?.paymentAccountInfo ?? undefined}
          promptPayId={ownerUser?.promptPayId ?? undefined}
          storeName={shareLink.organization?.name ?? undefined}
        />
        
        {limits.planName === "FREE" && (
          <div className="mt-8 mb-4 text-center">
            <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
              <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              </span>
              Powered by LAOSYS
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function ExpiredView({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-center font-sans">
      <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="h-10 w-10 text-red-500" />
      </div>
      <h1 className="text-4xl font-bold text-white mb-2">Link Expired</h1>
      <p className="text-zinc-400 max-w-md">{message}</p>
    </div>
  );
}
