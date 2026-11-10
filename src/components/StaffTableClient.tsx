"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Mail, Shield, CalendarDays } from "lucide-react";
import { PaginationControls } from "@/components/PaginationControls";
import { DeleteStaffButton } from "@/app/dashboard/staff/DeleteStaffButton";

export function StaffTableClient({ staff }: { staff: any[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalPages = Math.ceil(staff.length / itemsPerPage);
  const paginatedStaff = staff.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
            <TableHead className="text-zinc-400">ຊື່ (Name)</TableHead>
            <TableHead className="text-zinc-400">ອີເມວ (Email)</TableHead>
            <TableHead className="text-zinc-400">ບົດບາດ (Role)</TableHead>
            <TableHead className="text-zinc-400">ວັນທີເພີ່ມ (Date Added)</TableHead>
            <TableHead className="text-right text-zinc-400">ຈັດການ (Actions)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedStaff.length === 0 ? (
            <TableRow className="border-zinc-800">
              <TableCell colSpan={5} className="text-center text-zinc-500 py-8">
                ຍັງບໍ່ມີບັນຊີພະນັກງານ.
              </TableCell>
            </TableRow>
          ) : (
            paginatedStaff.map((employee, idx) => (
              <TableRow 
                key={employee.id} 
                className="border-zinc-800/50 hover:border-blue-500/30 hover:bg-blue-500/5 hover:shadow-[inset_0_0_20px_rgba(59,130,246,0.03)] cursor-pointer transition-all duration-300 group animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-8 before:bg-blue-500 before:rounded-r-full before:opacity-0 hover:before:opacity-100 before:transition-opacity before:shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                style={{ animationDelay: `${(idx % 10) * 50}ms` }}
              >
                <TableCell className="font-medium text-zinc-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                    <User size={16} />
                  </div>
                  {employee.name}
                </TableCell>
                <TableCell className="text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-zinc-500" />
                    {employee.email}
                  </div>
                </TableCell>
                <TableCell className="text-zinc-300">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-purple-400" />
                    {employee.orgRole === "MANAGER" ? "ผู้จัดการ (Manager)" :
                     employee.orgRole === "ACCOUNTANT" ? "พนักงานบัญชี (Accountant)" :
                     employee.orgRole === "KITCHEN" ? "พนักงานครัว (Kitchen)" :
                     "พนักงานขาย (Cashier)"}
                  </div>
                </TableCell>
                <TableCell className="text-zinc-400">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={14} className="text-zinc-500" />
                    {new Date(employee.createdAt).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DeleteStaffButton id={employee.id} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <PaginationControls 
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={staff.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(size) => {
          setItemsPerPage(size);
          setCurrentPage(1);
        }}
      />
    </>
  );
}
