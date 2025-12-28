"use client";

import { useState } from "react";
import SignalsTable from "@/components/admin/SignalsTable";

export default function SignalsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Всички сигнали</h1>
        <p className="text-gray-600 mt-2">Управление на всички постъпили сигнали от граждани</p>
      </div>
      
      <SignalsTable />
    </div>
  );
}
