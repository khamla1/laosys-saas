import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AlertTriangle, Package, TrendingDown } from "lucide-react";
import Link from "next/link";

export default async function LowStockAlertsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const organizationId = (session.user as any).organizationId;
  const role = (session.user as any).role;

  // fetch low stock products
  const products = await prisma.product.findMany({
    where: {
      ...(role !== "ADMIN" ? { organizationId } : {}),
      status: "ACTIVE"
    },
    orderBy: { stock: 'asc' }
  });

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">ສິນຄ້າໃກ້ໝົດ (Low Stock Alerts)</h1>
            <p className="text-sm text-zinc-400">ລາຍການສິນຄ້າທີ່ຄວນສັ່ງຊື້ເພີ່ມ (ສະຕັອກຕ່ຳກວ່າຈຸດທີ່ກຳນົດໄວ້)</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/50">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-zinc-300">ພົບສິນຄ້າໃກ້ໝົດ {lowStockProducts.length} ລາຍການ</span>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="text-xs uppercase bg-zinc-950/50 border-b border-zinc-800/80 text-zinc-500">
              <tr>
                <th className="px-6 py-4 font-semibold">ຊື່ສິນຄ້າ (Product)</th>
                <th className="px-6 py-4 font-semibold">ຈຳນວນເຫຼືອ (Current Stock)</th>
                <th className="px-6 py-4 font-semibold">ຈຸດສັ່ງຊື້ (Min Stock)</th>
                <th className="px-6 py-4 font-semibold">ສະຖານະ</th>
                <th className="px-6 py-4 text-right">ຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {lowStockProducts.map(product => (
                <tr key={product.id} className="hover:bg-zinc-800/20 transition-colors group">
                  <td className="px-6 py-4 font-medium text-zinc-300">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-zinc-500" />
                      {product.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${product.stock === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-400">{product.minStock}</td>
                  <td className="px-6 py-4">
                    {product.stock === 0 ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-red-500/10 text-red-400 border-red-500/20">ໝົດແລ້ວ (Out of Stock)</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-500/10 text-amber-400 border-amber-500/20">ໃກ້ໝົດ (Low Stock)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href="/dashboard/products">
                      <button className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-medium transition-colors">
                        ອັບເດດສະຕັອກ
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
              {lowStockProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Package className="w-6 h-6 text-emerald-500" />
                      </div>
                      <p className="text-zinc-400 text-lg">ສະຕັອກສິນຄ້າປົກກະຕິດີ</p>
                      <p className="text-zinc-500 text-sm">ບໍ່ມີສິນຄ້າໃດທີ່ຕ່ຳກວ່າຈຸດສັ່ງຊື້</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
