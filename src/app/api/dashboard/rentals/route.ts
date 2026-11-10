import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { findEquipment, syncEquipmentStock } from "@/lib/rental-sync";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const [records, org] = await Promise.all([
      prisma.rentalOrder.findMany({
        where: { organizationId },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              metadata: true,
              businessType: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          metadata: true,
          businessType: true
        }
      })
    ]);

    const meta = (org?.metadata as any) || {};
    const store = {
      id: org?.id || organizationId,
      name: org?.name || "ຮ້ານຄ້າ",
      slug: org?.slug || "",
      logo: org?.logo || null,
      phone: meta.phone || meta.contactPhone || meta.tel || "",
      address: meta.address || meta.location || "",
      tagline: meta.tagline || meta.slogan || ""
    };

    return NextResponse.json({
      records,
      store
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const organizationId = (session.user as any).organizationId;
    if (!organizationId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

    const body = await req.json();
    const { 
      customerName, customerPhone, customerIDCard,
      itemName, quantity, rentDate, dueDate, rentalFee, depositAmount, fineAmount, notes, status,
      paymentMethod, equipmentId: clientEquipId
    } = body;

    if (!customerName?.trim() || !itemName?.trim() || !rentDate || !dueDate || rentalFee === undefined) {
      return NextResponse.json({ error: "ກະລຸນາຕື່ມຂໍ້ມູນລູກຄ້າ, ອຸປະກອນ, ວັນທີ ແລະ ຄ່າເຊົ່າໃຫ້ຄົບຖ້ວນ" }, { status: 400 });
    }

    const orderQty = Math.max(1, Number(quantity) || 1);
    const userObj = session.user as any;
    const feeNum = Number(rentalFee) || 0;
    const depositNum = Number(depositAmount) || 0;
    const methodStr = paymentMethod || "CASH";

    // 1. Check equipment stock robustly
    const equipment = await findEquipment(organizationId, clientEquipId, itemName);

    if (equipment) {
      const availUnits = equipment.availableQuantity !== null && equipment.availableQuantity !== undefined
        ? equipment.availableQuantity
        : Math.max(0, equipment.stockQuantity - (equipment.maintenanceQuantity || 0) - (equipment.rentedQuantity || 0));

      if (availUnits <= 0) {
        return NextResponse.json(
          { error: `ອຸປະກອນ "${equipment.name}" ໝົດຄັງແລ້ວ (ຍອດພ້ອມໃຫ້ເຊົ່າ: 0 ຊິ້ນ)` },
          { status: 400 }
        );
      }

      if (availUnits < orderQty) {
        return NextResponse.json(
          { error: `ຈຳນວນທີ່ຂໍເຊົ່າ (${orderQty} ຊິ້ນ) ເກີນຍອດພ້ອມໃຫ້ເຊົ່າໃນຄັງ (ຍັງເຫຼືອ ${availUnits} ຊິ້ນ)` },
          { status: 400 }
        );
      }
    }

    // 2. Link or create a Product so OrderItem can reference a valid productId
    let targetProductId = equipment?.productId;
    if (!targetProductId) {
      let rentalProduct = await prisma.product.findFirst({
        where: {
          organizationId,
          name: { contains: "ບໍລິການເຊົ່າ", mode: "insensitive" }
        }
      });

      if (!rentalProduct) {
        rentalProduct = await prisma.product.create({
          data: {
            name: `ບໍລິການເຊົ່າ: ${itemName.trim()}`,
            category: "RENTAL_SERVICE",
            price: feeNum,
            stock: 9999,
            status: "ACTIVE",
            organizationId
          }
        });
      }
      targetProductId = rentalProduct.id;
    }

    // 3. Automatically create an Order in the central store orders
    let createdOrderId: string | null = null;
    try {
      const storeOrder = await prisma.order.create({
        data: {
          totalAmount: feeNum,
          status: "COMPLETED",
          customerName: customerName.trim(),
          customerPhone: customerPhone?.trim() || null,
          customerNote: `ຄ່າເຊົ່າອຸປະກອນ: ${itemName.trim()} (ຈຳນວນ: ${orderQty}, ມັດຈຳ: ${depositNum.toLocaleString()} ₭)`,
          paymentMethod: methodStr,
          organizationId,
          metadata: {
            type: "RENTAL",
            itemName: itemName.trim(),
            quantity: orderQty,
            rentalFee: feeNum,
            depositAmount: depositNum,
            rentDate: new Date(rentDate).toISOString(),
            dueDate: new Date(dueDate).toISOString()
          },
          items: {
            create: [
              {
                quantity: orderQty,
                price: feeNum,
                productId: targetProductId
              }
            ]
          }
        }
      });
      createdOrderId = storeOrder.id;
    } catch (orderErr) {
      console.error("Auto Order Creation Error:", orderErr);
    }

    // 4. Create the RentalOrder with orderId link & audit trail
    const initialStatusHistory = [
      {
        id: `aud-${Date.now()}`,
        action: "ISSUE_RENTAL",
        fromStatus: null,
        toStatus: status || "ACTIVE",
        note: `ເປີດບິນເຊົ່າອຸປະກອນ ${itemName.trim()} ຈຳນວນ ${orderQty} ຊິ້ນ (ເຊື່ອມໂຍງອໍເດີ: ${createdOrderId || 'N/A'})`,
        changedBy: {
          id: userObj.id || null,
          name: userObj.name || userObj.email || "Staff",
          email: userObj.email || "",
          role: userObj.role || "STAFF"
        },
        changedAt: new Date().toISOString()
      }
    ];

    const record = await prisma.rentalOrder.create({
      data: {
        customerName: customerName.trim(),
        customerPhone: customerPhone?.trim() || null,
        customerIDCard: customerIDCard?.trim() || null,
        itemName: itemName.trim(),
        quantity: orderQty,
        rentDate: new Date(rentDate),
        dueDate: new Date(dueDate),
        rentalFee: feeNum,
        depositAmount: depositNum,
        fineAmount: Number(fineAmount) || 0,
        notes: notes?.trim() || null,
        status: status || "ACTIVE",
        orderId: createdOrderId,
        equipmentId: equipment?.id || null,
        paymentMethod: methodStr,
        statusHistory: initialStatusHistory,
        organizationId
      }
    });

    // 5. Sync equipment inventory and increment rent counter
    if (equipment) {
      await syncEquipmentStock(equipment.id, organizationId, {
        userObj,
        action: "RENTAL_ISSUE",
        note: `ໃຫ້ເຊົ່າແກ່ "${customerName.trim()}" ຈຳນວນ ${orderQty} ຊິ້ນ`,
        quantity: orderQty
      });

      try {
        await prisma.equipmentItem.update({
          where: { id: equipment.id },
          data: { totalRentCount: { increment: orderQty } }
        });
      } catch (_) {}
    }

    // 6. Write to AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          action: "RENTAL_ORDER_CREATED",
          details: `${userObj.name || userObj.email} ເປີດບິນເຊົ່າ "${itemName.trim()}" (ອໍເດີ #${createdOrderId || record.id.slice(-6)}) ໃຫ້ "${customerName.trim()}" ຄ່າເຊົ່າ ₭${feeNum.toLocaleString()}`,
          userId: userObj.id || null,
          organizationId,
          metadata: {
            rentalId: record.id,
            orderId: createdOrderId,
            itemName: itemName.trim(),
            quantity: orderQty,
            rentalFee: feeNum,
            depositAmount: depositNum
          }
        }
      });
    } catch (_) {}

    return NextResponse.json(record);
  } catch (error: any) {
    console.error("Rental POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
