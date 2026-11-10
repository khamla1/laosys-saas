import { ModuleGuard } from "@/components/ModuleGuard";

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ModuleGuard moduleName="BOOKING">{children}</ModuleGuard>;
}
