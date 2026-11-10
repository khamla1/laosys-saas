import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveModules, hasModule } from "@/lib/modules";
import prisma from "@/lib/prisma";

export default async function DataEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as any).role;
  const orgId = (session.user as any).organizationId;

  // Super Admin can always access
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") {
    return <>{children}</>;
  }

  // Check organization active modules
  if (orgId) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { package: true }
    });
    if (org) {
      const activeModules = getActiveModules(
        org.businessType,
        org.enabledModules,
        org.package?.enabledModules
      );
      if (hasModule(activeModules, "DATA_EDITOR" as any)) {
        return <>{children}</>;
      }
    }
  }

  // Redirect unauthorized users away from Data Editor
  redirect("/dashboard");
}
