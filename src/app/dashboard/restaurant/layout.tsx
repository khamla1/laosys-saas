import { ModuleGuard } from "@/components/ModuleGuard";

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ModuleGuard moduleName="RESTAURANT">{children}</ModuleGuard>;
}
