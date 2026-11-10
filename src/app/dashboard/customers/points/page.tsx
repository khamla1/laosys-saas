import { Construction } from "lucide-react";
import Link from "next/link";

export default function ComingSoonPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-blue-500/5">
        <Construction size={48} className="text-blue-500" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-3">Coming Soon</h1>
      <p className="text-zinc-400 max-w-md mx-auto text-lg">
        ຟີເຈີນີ້ຢູ່ໃນການພັດທະນາ (Feature under development). ໂດຍໄວ ທ່ານຈະສາມາດຈັດການຄະແນນສະສົມ, ສ່ວນຫຼຸດ ແລະ ຂອງລາງວັນ ໃຫ້ລູກຄ້າສະມາຊິກໄດ້ຢ່າງຄົບຊຸດ
      </p>
      <div className="mt-8">
        <Link href="/dashboard" className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
