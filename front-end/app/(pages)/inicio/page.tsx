"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useState } from "react";
import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CashFlowItem = { month: string; entrada: number; saida: number };
type FilialData = {
  cadastrados: number;
  ativos: number;
  inativos: number;
  inadimplentes: number;
  cashFlow: CashFlowItem[];
};
type FilialKey = "Filial A" | "Filial B" | "Filial C";

const filiais: FilialKey[] = ["Filial A", "Filial B", "Filial C"];

const cardsDataByFilial: Record<FilialKey, FilialData> = {
  "Filial A": {
    cadastrados: 1245,
    ativos: 182,
    inativos: 45,
    inadimplentes: 12,
    cashFlow: [
      { month: "Janeiro", entrada: 12000, saida: 5000 },
      { month: "Fevereiro", entrada: 10000, saida: 4000 },
      { month: "Março", entrada: 15000, saida: 6000 },
      { month: "Abril", entrada: 9000, saida: 3000 },
      { month: "Maio", entrada: 13000, saida: 7000 },
      { month: "Junho", entrada: 11000, saida: 4000 },
      { month: "Julho", entrada: 14000, saida: 5000 },
      { month: "Agosto", entrada: 12500, saida: 5500 },
      { month: "Setembro", entrada: 0, saida: 0 },
      { month: "Outubro", entrada: 0, saida: 0 },
      { month: "Novembro", entrada: 0, saida: 0 },
      { month: "Dezembro", entrada: 0, saida: 0 },
    ],
  },
  "Filial B": {
    cadastrados: 980,
    ativos: 150,
    inativos: 30,
    inadimplentes: 8,
    cashFlow: [
      { month: "Janeiro", entrada: 8000, saida: 3000 },
      { month: "Fevereiro", entrada: 9000, saida: 3500 },
      { month: "Março", entrada: 9500, saida: 4000 },
      { month: "Abril", entrada: 7000, saida: 2500 },
      { month: "Maio", entrada: 10000, saida: 4500 },
      { month: "Junho", entrada: 9000, saida: 3000 },
      { month: "Julho", entrada: 11000, saida: 3500 },
      { month: "Agosto", entrada: 10500, saida: 4000 },
      { month: "Setembro", entrada: 0, saida: 0 },
      { month: "Outubro", entrada: 0, saida: 0 },
      { month: "Novembro", entrada: 0, saida: 0 },
      { month: "Dezembro", entrada: 0, saida: 0 },
    ],
  },
  "Filial C": {
    cadastrados: 1100,
    ativos: 120,
    inativos: 25,
    inadimplentes: 5,
    cashFlow: [
      { month: "Janeiro", entrada: 10000, saida: 4000 },
      { month: "Fevereiro", entrada: 11000, saida: 4500 },
      { month: "Março", entrada: 12000, saida: 5000 },
      { month: "Abril", entrada: 9000, saida: 3500 },
      { month: "Maio", entrada: 13000, saida: 6000 },
      { month: "Junho", entrada: 11000, saida: 4000 },
      { month: "Julho", entrada: 14000, saida: 5000 },
      { month: "Agosto", entrada: 12500, saida: 5500 },
      { month: "Setembro", entrada: 0, saida: 0 },
      { month: "Outubro", entrada: 0, saida: 0 },
      { month: "Novembro", entrada: 0, saida: 0 },
      { month: "Dezembro", entrada: 0, saida: 0 },
    ],
  },
};

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);
  const [selectedFilial, setSelectedFilial] = useState<FilialKey>(filiais[0]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>(["Agosto"]);

  const { cadastrados, ativos, inativos, inadimplentes, cashFlow } =
    cardsDataByFilial[selectedFilial];

  const toggleMonth = (month: string) => {
    setSelectedMonths((prev) => {
      if (prev.includes(month)) {
        return prev.filter((m) => m !== month);
      } else if (prev.length < 4) {
        return [...prev, month];
      } else {
        return prev; // limita a 4 meses
      }
    });
  };

  const filteredData = cashFlow.filter((item: any) =>
    selectedMonths.includes(item.month)
  );

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-8">
      {/* Select de filial */}
      <div className="mb-6 flex items-center gap-4">
        <label className="font-medium text-gray-700" htmlFor="filial-select">
          Filial:
        </label>
        <select
          id="filial-select"
          value={selectedFilial}
          onChange={(e) => {
            setSelectedFilial(e.target.value as FilialKey);
            setSelectedMonths(["Agosto"]);
          }}
          className="border rounded px-3 py-2 text-gray-700 bg-white"
        >
          {filiais.map((filial) => (
            <option key={filial} value={filial}>
              {filial}
            </option>
          ))}
        </select>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-green-100 text-green-800 shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-700">
            Alunos Cadastrados
          </h2>
          <p className="mt-2 text-3xl font-bold">
            {cadastrados.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Alunos Cadastrados</p>
        </div>
        <div className="bg-green-100 text-green-800 shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-700">Alunos Ativos</h2>
          <p className="mt-2 text-3xl font-bold">{ativos.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Alunos Ativos</p>
        </div>
        <div className="bg-green-100 text-green-800 shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-700">
            Alunos Inativos
          </h2>
          <p className="mt-2 text-3xl font-bold">{inativos.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Alunos Inativos</p>
        </div>
        <div className="bg-green-100 text-green-800 shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-700">
            Pagamentos Inadimplentes
          </h2>
          <p className="mt-2 text-3xl font-bold">
            {inadimplentes.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Pagamentos Inadimplentes</p>
        </div>
      </div>

      {/* Seletor de meses */}
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          Selecionar até 4 meses:
        </h2>
        <div className="flex flex-wrap gap-2">
          {cashFlow.map((item: any) => (
            <button
              key={item.month}
              className={`px-4 py-2 rounded-full border ${
                selectedMonths.includes(item.month)
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
              onClick={() => toggleMonth(item.month)}
            >
              {item.month}
            </button>
          ))}
        </div>
      </div>

      {/* Gráfico de fluxo de caixa */}
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Fluxo de Caixa
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={filteredData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="entrada" fill="#4ade80" name="Entradas" />
            <Bar dataKey="saida" fill="#f87171" name="Saídas" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
