import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: Request,
  context: any
) {
  const params = await context.params;
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { status, name, email, password } = body;

    const dataToUpdate: any = {};

    if (status) {
      if (!["ACTIVE", "SUSPENDED", "BLOCKED"].includes(status)) {
        return new NextResponse("Invalid status", { status: 400 });
      }
      dataToUpdate.status = status;
    }

    if (name) dataToUpdate.name = name;
    if (email) dataToUpdate.email = email;
    if (password) {
      // Hash password
      const bcrypt = require("bcryptjs");
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[USER_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: any
) {
  const params = await context.params;
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // To prevent MongoDB relation constraint errors,
    // we must manually delete dependent records in the correct order.
    const deletedUser = await prisma.$transaction(async (tx) => {
      // Get user's organizations
      const memberships = await tx.userOrganization.findMany({
        where: { userId: id },
        select: { organizationId: true }
      });
      const orgIds = memberships.map((m: any) => m.organizationId);

      if (orgIds.length > 0) {
        await tx.orderItem.deleteMany({ where: { order: { organizationId: { in: orgIds } } } });
        await tx.transaction.deleteMany({ where: { organizationId: { in: orgIds } } });
        await tx.order.deleteMany({ where: { organizationId: { in: orgIds } } });
        await tx.product.deleteMany({ where: { organizationId: { in: orgIds } } });
        await tx.subscriptionRequest.deleteMany({ where: { organizationId: { in: orgIds } } });
      }
      
      // Delete user-level records
      await tx.userOrganization.deleteMany({ where: { userId: id } });
      if (orgIds.length > 0) {
        await tx.organization.deleteMany({ where: { id: { in: orgIds } } });
      }
      return await tx.user.delete({ where: { id: id } });
    });

    return NextResponse.json(deletedUser);
  } catch (error) {
    console.error("[USER_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
