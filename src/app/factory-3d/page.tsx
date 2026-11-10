import React from "react";
import FactoryProductionLine3D from "@/components/FactoryProductionLine3D";

export const metadata = {
  title: "3D Automated Factory Production Line | Industrial Digital Twin",
  description:
    "Interactive 3D automated manufacturing and logistics production line simulation with robotic arms, roller conveyors, optical sorters, and rotary stretch wrapper.",
};

export default function Factory3DPage() {
  return (
    <main className="min-h-screen bg-zinc-950 p-2 sm:p-4">
      <FactoryProductionLine3D />
    </main>
  );
}
