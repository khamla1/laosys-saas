import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import ShopClient from "./ShopClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const organization = await prisma.organization.findUnique({
    where: { slug },
    include: { storefront: true },
  });

  if (!organization) {
    return { title: "ຮ້ານຄ້າບໍ່ພົບໃນລະບົບ (Shop Not Found)" };
  }

  const metadataObj = organization.storefront?.metadata as any;
  const seo = metadataObj?.seo || {};

  const title = seo.metaTitle || organization.name || "LAOSYS Online Store";
  const description =
    seo.metaDescription ||
    `ຈຳໜ່າຍສິນຄ້າຄຸນນະພາບຈາກຮ້ານ ${organization.name} ພ້ອມບໍລິການຈັດສົ່ງທົ່ວປະເທດ`;
  const keywords = seo.metaKeywords || "ຮ້ານຄ້າອອນລາຍ, laosys, online shop";

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      siteName: organization.name,
      type: "website",
    },
  };
}

export default async function PublicShopPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tableId = sp?.table as string | undefined;

  const organization = await prisma.organization.findUnique({
    where: { slug },
    include: {
      storefront: true,
    },
  });

  if (!organization) {
    notFound();
  }

  const [products, coupons] = await Promise.all([
    prisma.product.findMany({
      where: {
        organizationId: organization.id,
        status: "ACTIVE",
      },
      include: {
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.coupon
      .findMany({
        where: {
          organizationId: organization.id,
          isActive: true,
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      })
      .catch(() => []),
  ]);

  const storefront =
    organization.storefront ||
    ({ theme: "light", bannerUrl: null, metadata: null } as any);
  const theme = storefront.theme || "light";

  // Normalize banners array
  let banners: { url: string; type: "image" | "video" }[] = [];
  if (
    storefront.metadata?.banners &&
    Array.isArray(storefront.metadata.banners) &&
    storefront.metadata.banners.length > 0
  ) {
    banners = storefront.metadata.banners;
  } else if (storefront.bannerUrl) {
    banners = [{ url: storefront.bannerUrl, type: "image" }];
  }

  return (
    <ShopClient
      store={{
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        phone: organization.phone || "",
        address: organization.address || "",
        banners,
        ecommerce: storefront.metadata?.ecommerce || {},
        seo: storefront.metadata?.seo || {},
      }}
      products={products}
      coupons={coupons}
      theme={theme}
      tableId={tableId}
    />
  );
}
