import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Printer, ShoppingBag } from "lucide-react";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true
        }
      },
      organization: true, // seller info
      table: true
    }
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 print:p-0 print:bg-white font-sans text-black">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            margin: 0;
            size: 80mm auto;
          }
          body, html {
            width: 80mm;
            margin: 0;
            padding: 0;
            background: white !important;
          }
          .receipt-container {
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />

      {/* Action Bar (Hidden when printing) */}
      <div className="fixed top-4 right-4 print:hidden z-50 flex gap-2">
        <button 
          id="print-btn"
          className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl shadow-lg border border-zinc-700 flex items-center gap-2 transition-all font-medium text-sm"
        >
          <Printer size={16} />
          ພິມບິນ (Print)
        </button>
        <script dangerouslySetInnerHTML={{__html: `
          document.getElementById('print-btn').addEventListener('click', () => window.print());
        `}} />
      </div>

      {/* Printable Receipt Paper */}
      <div className="receipt-container w-full max-w-[80mm] bg-white shadow-2xl text-black mx-auto font-mono relative overflow-hidden">
        
        {/* Receipt Zigzag Top (CSS Trick) */}
        <div className="h-3 w-full bg-[radial-gradient(circle,transparent,transparent_50%,#fff_50%,#fff_100%)] bg-[length:10px_10px] bg-repeat-x -mt-1 hidden print:block"></div>
        
        <div className="p-6">
          <div className="text-center mb-6 flex flex-col items-center">
            <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mb-3">
              <ShoppingBag size={24} />
            </div>
            <h1 className="text-xl font-bold uppercase tracking-widest">{order.organization?.name || "SaaS Store"}</h1>
            <p className="text-gray-500 text-xs mt-1 font-sans">ໃບບິນຮັບເງິນ / ໃບກຳກັບພາສີ</p>
            <p className="text-gray-500 text-xs mt-2">ລະຫັດບິນ: {order.id.slice(-8).toUpperCase()}</p>
            <p className="text-gray-500 text-xs">{new Date(order.createdAt).toLocaleString()}</p>
          </div>

        <div className="border-t border-b border-dashed border-gray-300 py-3 mb-4 space-y-1.5 text-xs">
          <p><span className="font-semibold">ລູກຄ້າ:</span> {order.customerName}</p>
          {order.table && <p><span className="font-semibold">ໂຕະ (Table):</span> {order.table.name}</p>}
          {order.customerPhone && <p><span className="font-semibold">ເບີໂທ:</span> {order.customerPhone}</p>}
          {order.customerAddress && <p className="whitespace-pre-wrap"><span className="font-semibold">ທີ່ຢູ່:</span> {order.customerAddress}</p>}
          {order.customerNote && <p className="whitespace-pre-wrap"><span className="font-semibold">ໝາຍເຫດ:</span> {order.customerNote}</p>}
        </div>

        <table className="w-full text-xs mb-4">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2">ລາຍການ</th>
              <th className="text-right py-2">ຈຳນວນ</th>
              <th className="text-right py-2">ລາຄາລວມ</th>
            </tr>
          </thead>
          <tbody>
            {order.items.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-4 text-gray-500">ບໍ່ມີລາຍການສິນຄ້າໃນບິນນີ້</td>
              </tr>
            ) : (
              order.items.map(item => (
                <tr key={item.id}>
                  <td className="py-2 pr-2">{item.product ? item.product.name : "ສິນຄ້າຖືກລຶບແລ້ວ"}</td>
                  <td className="text-right py-2 align-top">{item.quantity}</td>
                  <td className="text-right py-2 align-top">{(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

          <div className="border-t border-dashed border-gray-400 pt-3 space-y-2 mb-8 text-base">
            <div className="flex justify-between font-bold">
              <span>ຍອດລວມ</span>
              <span><span className="text-sm font-sans font-medium mr-[1px]">₭</span>{order.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-600">
              <span>ສະຖານະ</span>
              <span>
                {(() => {
                  switch (order.status) {
                    case "PENDING": return "ລໍຖ້າດຳເນີນການ";
                    case "PAID": return "ຊຳລະແລ້ວ";
                    case "SHIPPED": return "ສົ່ງແລ້ວ";
                    case "COMPLETED": return "ສຳເລັດ";
                    case "CANCELLED": return "ຍົກເລີກ";
                    default: return order.status;
                  }
                })()}
              </span>
            </div>
          </div>

          <div className="text-center text-xs text-gray-600 space-y-2">
            <p className="font-bold">*** ຂອບໃຈທີ່ອຸດໜູນ ***</p>
            <p>ແລ້ວພົບກັນໃໝ່ເດີ້!</p>
            <p className="mt-4 text-[10px] text-gray-400">ລະບົບໂດຍ QuickCart</p>
          </div>
        </div>

        {/* Receipt Zigzag Bottom */}
        <div className="h-3 w-full bg-[radial-gradient(circle,transparent,transparent_50%,#fff_50%,#fff_100%)] bg-[length:10px_10px] bg-repeat-x rotate-180 -mb-1 hidden print:block"></div>
      </div>
    </div>
  );
}
