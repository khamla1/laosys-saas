import React from "react";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import StoresClient from "./StoresClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ຄົ້ນຫາຮ້ານຄ້າ (LAOSYS Store Directory) | ຮ້ານອາຫານ & ຮ້ານຄ້າອອນລາຍ",
  description:
    "ສູນລວມຮ້ານຄ້າ, ຮ້ານອາຫານ, ແລະ ເວັບໄຊທ໌ຂາຍເຄື່ອງອອນລາຍ (E-Commerce) ທີ່ເປີດໃຫ້ບໍລິການເທິງລະບົບ LAOSYS ຄົ້ນຫາຊື່ຮ້ານ ແລະ ກົດເຂົ້າສູ່ໜ້າຮ້ານຄ້າໄດ້ທັນທີ.",
  keywords: ["LAOSYS stores", "ຮ້ານຄ້າລາວ", "ຄົ້ນຫາຮ້ານອາຫານ", "POS ລາວ", "E-Commerce ລາວ", "Store Directory"],
  openGraph: {
    title: "LAOSYS Store Directory | ຄົ້ນຫາຮ້ານຄ້າ & ໜ້າຮ້ານອອນລາຍ",
    description: "ສູນລວມຮ້ານອາຫານ ແລະ ຮ້ານຄ້າອອນລາຍທີ່ເປີດໃຫ້ບໍລິການເທິງລະບົບ LAOSYS",
    type: "website",
  },
};

export default async function StoresPage() {
  let stores: any[] = [];
  try {
    stores = await prisma.organization.findMany({
      include: {
        storefront: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (err) {
    console.error("Error fetching stores for directory:", err);
    stores = [];
  }

  return <StoresClient initialStores={stores} />;
}
