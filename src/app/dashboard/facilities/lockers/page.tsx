import { FacilitiesClient } from "@/components/FacilitiesClient";

export const metadata = {
  title: "ຈັດການລັອກເກີ | Sports Complex",
};

export default function LockersPage() {
  return (
    <FacilitiesClient 
      typeFilter="LOCKER" 
      title="ຈັດການລັອກເກີ (Lockers)" 
      subtitle="ຈັດການ ແລະ ກວດສອບສະຖານະລັອກເກີສຳລັບລູກຄ້າ"
    />
  );
}
