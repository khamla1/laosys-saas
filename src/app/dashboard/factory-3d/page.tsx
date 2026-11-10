import React from "react";
import FactoryProductionLine3D from "@/components/FactoryProductionLine3D";

export const metadata = {
  title: "3D Factory Production Line | Dashboard",
};

export default function DashboardFactory3DPage() {
  return (
    <div className="w-full">
      <FactoryProductionLine3D />
    </div>
  );
}
