import prisma from "@/lib/prisma";

export async function findEquipment(
  organizationId: string,
  equipmentId?: string | null,
  itemName?: string | null
) {
  if (equipmentId) {
    const eq = await prisma.equipmentItem.findFirst({
      where: { id: equipmentId, organizationId }
    });
    if (eq) return eq;
  }

  if (!itemName) return null;
  const cleanName = itemName.trim();

  // 1. Exact match
  let eq = await prisma.equipmentItem.findFirst({
    where: { organizationId, name: cleanName }
  });
  if (eq) return eq;

  // 2. Fetch all equipment in this org and match in JS (immune to MongoDB regex/collation issues on Lao characters)
  const allInOrg = await prisma.equipmentItem.findMany({
    where: { organizationId }
  });

  const lowerName = cleanName.toLowerCase();
  const baseName = cleanName.replace(/\s*\(.*?\)\s*/g, "").trim().toLowerCase();

  eq = allInOrg.find(e => e.name.trim().toLowerCase() === lowerName) ||
       allInOrg.find(e => {
         const eBase = e.name.replace(/\s*\(.*?\)\s*/g, "").trim().toLowerCase();
         return (baseName && eBase === baseName) || e.name.includes(cleanName) || cleanName.includes(e.name);
       }) ||
       null;

  return eq;
}

export async function syncEquipmentStock(
  equipmentId: string,
  organizationId: string,
  options?: {
    userObj?: any;
    action?: string;
    note?: string;
    quantity?: number;
  }
) {
  try {
    const equip = await prisma.equipmentItem.findUnique({
      where: { id: equipmentId }
    });
    if (!equip) return null;

    // Active or Overdue rentals
    const activeOrders = await prisma.rentalOrder.findMany({
      where: {
        organizationId,
        status: { in: ["ACTIVE", "OVERDUE"] },
        OR: [
          { equipmentId: equip.id },
          { itemName: equip.name }
        ]
      }
    });

    const totalRented = activeOrders.reduce((sum, o) => sum + (o.quantity || 1), 0);
    const maint = equip.maintenanceQuantity || 0;
    const stock = equip.stockQuantity || 0;
    const newAvail = Math.max(0, stock - maint - totalRented);
    const newStatus = newAvail > 0 ? "AVAILABLE" : (totalRented > 0 ? "RENTED" : (maint > 0 ? "MAINTENANCE" : "AVAILABLE"));

    const historyEntry = options?.action ? {
      id: `hist-${Date.now()}`,
      action: options.action,
      fromStatus: equip.status,
      toStatus: newStatus,
      quantity: options.quantity !== undefined ? options.quantity : totalRented,
      availableUnits: newAvail,
      maintenanceUnits: maint,
      rentedUnits: totalRented,
      note: options.note || "ປັບປຸງຍອດອຸປະກອນໃຫ້ຖືກຕ້ອງຕາມບິນເຊົ່າ",
      changedBy: {
        id: options.userObj?.id || null,
        name: options.userObj?.name || options.userObj?.email || "Staff",
        email: options.userObj?.email || "",
        role: options.userObj?.role || options.userObj?.orgRole || "STAFF"
      },
      changedAt: new Date().toISOString()
    } : null;

    const existingHist = Array.isArray(equip.statusHistory) ? (equip.statusHistory as any[]) : [];
    const statusHistory = historyEntry ? [historyEntry, ...existingHist] : (equip.statusHistory as any);

    const updated = await prisma.equipmentItem.update({
      where: { id: equip.id },
      data: {
        rentedQuantity: totalRented,
        availableQuantity: newAvail,
        status: newStatus,
        statusHistory
      }
    });

    return updated;
  } catch (error) {
    console.error("syncEquipmentStock error:", error);
    return null;
  }
}
