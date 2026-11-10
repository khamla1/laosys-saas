import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getActiveModules, ModuleName, hasModule } from "@/lib/modules";

export async function ModuleGuard({
  children,
  moduleName,
}: {
  children: React.ReactNode;
  moduleName: ModuleName;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/");
  }

  const role = (session.user as any).role;
  if (role === "ADMIN") {
    return <>{children}</>;
  }

  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      organizations: {
        take: 1,
        select: { 
          organization: { 
            select: { 
              businessType: true,
              enabledModules: true,
              package: {
                select: {
                  enabledModules: true
                }
              }
            } 
          } 
        }
      }
    }
  });

  const org = user?.organizations?.[0]?.organization;
  
  if (!org) {
    redirect("/dashboard");
  }

  const activeModules = getActiveModules(
    org.businessType,
    org.enabledModules,
    org.package?.enabledModules
  );

  if (!hasModule(activeModules, moduleName)) {
    redirect("/dashboard?error=module_disabled");
  }

  return <>{children}</>;
}
