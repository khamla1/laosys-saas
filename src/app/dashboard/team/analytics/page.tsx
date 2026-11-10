import { TeamClient } from "@/components/TeamClient";

export const metadata = {
  title: "วิเคราะห์สถิติทีม | Sports Complex",
};

export default function Page() {
  return <TeamClient defaultTab="analytics" />;
}
