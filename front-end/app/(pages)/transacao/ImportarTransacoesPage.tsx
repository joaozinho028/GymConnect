"use client";

import UploadFile from "@/components/UploadFile/UploadFileComponent";
import { useState } from "react";

export default function ImportarTransacoesPage() {
  const [banner, setBanner] = useState<string | File | undefined>(undefined);

  return (
    <div className="p-6 w-full">
      {/* Formulário */}
      <div className="bg-white rounded-xl shadow-sm p-6 border space-y-4 h-full">
        <h2 className="text-lg font-semibold">Importar transações</h2>
        <UploadFile
          label="Arquivo CSV ou Excel"
          value={banner}
          onChange={(val) => setBanner(val ?? undefined)}
        />
        <div className="flex justify-end">
          <button
            type="button"
            className="mt-4 px-6 py-2 bg-blue-600 cursor-pointer text-white rounded hover:bg-blue-700 transition"
            onClick={() => alert("Importação em desenvolvimento")}
            disabled={!banner}
          >
            Importar
          </button>
        </div>
      </div>
    </div>
  );
}
