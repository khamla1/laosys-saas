import { TeamClient } from "@/components/TeamClient";

export const metadata = {
  title: "ตารางซ้อมและแข่ง | Sports Complex",
};

export default function Page() {
  return <TeamClient defaultTab="schedule" />;
}
