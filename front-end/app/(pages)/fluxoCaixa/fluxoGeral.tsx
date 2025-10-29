import React from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MONTHS, PIE_COLORS } from "./shared";

// Tipos
export type Transaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  paymentMethod: string;
  type: "entrada" | "saida";
  value: number;
  month: string;
  filial: string;
};

export type Category = {
  id: string;
  name: string;
};

interface FluxoGeralProps {
  selectedMonths: string[];
  transactions: Transaction[];
  categories: Category[];
  allCashFlowData: { month: string; entrada: number; saida: number }[];
  pieData: { name: string; value: number }[];
  filteredGeneralData: { month: string; entrada: number; saida: number }[];
  filteredTransactions: Transaction[];
  totalEntrada: number;
  totalSaida: number;
  saldo: number;
  pageItems: Transaction[];
  page: number;
  totalPages: number;
  toggleMonth: (month: string) => void;
  exportToCSV: (data: Transaction[]) => void;
  copyTable: (data: Transaction[]) => void;
  setPage: (page: number) => void;
}

const FluxoGeral: React.FC<FluxoGeralProps> = ({
  selectedMonths,
  filteredGeneralData,
  totalEntrada,
  totalSaida,
  saldo,
  pieData,
  toggleMonth,
}) => {
  return (
    <>
      {/* Seleção de meses */}
      <div className="bg-white shadow rounded-lg p-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex flex-wrap gap-2 items-center">
            <label className="text-sm font-medium mr-2">Meses:</label>
            {MONTHS.map((month: string) => (
              <button
                key={month}
                onClick={() => toggleMonth(month)}
                className={`px-3 py-1 rounded-full text-xs sm:text-sm border ${
                  selectedMonths.includes(month)
                    ? "bg-green-500 text-white"
                    : "bg-gray-100"
                }`}
              >
                {month}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cartões resumo - Geral */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="bg-green-100 text-green-800 shadow rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600">
            Entradas (período)
          </h3>
          <div className="mt-2 text-2xl font-bold text-green-700">
            R$ {totalEntrada.toLocaleString()}
          </div>
        </div>
        <div className="bg-red-100 text-red-800 shadow rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600">
            Saídas (período)
          </h3>
          <div className="mt-2 text-2xl font-bold text-red-600">
            R$ {totalSaida.toLocaleString()}
          </div>
        </div>
        <div
          className={`shadow rounded-lg p-4 ${
            saldo >= 0 ? "bg-green-50" : "bg-red-50"
          }`}
        >
          <h3 className="text-sm font-medium text-gray-600">Saldo (período)</h3>
          <div className="mt-2 text-2xl font-bold">
            {saldo >= 0 ? "+" : "-"} R$ {Math.abs(saldo).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Gráficos - Geral */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-3 sm:p-4">
          <h2 className="font-semibold mb-4">Fluxo de Caixa Geral</h2>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart
              data={filteredGeneralData}
              onClick={(e: any) => {
                if (e && e.activeLabel) {
                  toggleMonth(e.activeLabel as string);
                }
              }}
            >
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: any) =>
                  `R$ ${Number(value).toLocaleString()}`
                }
              />
              <Legend />
              <Bar dataKey="entrada" name="Entradas" fill="#34d399" />
              <Bar dataKey="saida" name="Saídas" fill="#f87171" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white shadow rounded-lg p-3 sm:p-4">
          <h2 className="font-semibold mb-4">Gráfico por Categoria</h2>
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              <Tooltip
                formatter={(value: any) =>
                  `R$ ${Number(value).toLocaleString()}`
                }
              />
              <Legend />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label={({ name, percent }: any) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
};

export default FluxoGeral;
