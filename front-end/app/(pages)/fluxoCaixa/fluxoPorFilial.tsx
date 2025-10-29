import React from "react";
import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MONTHS, PIE_COLORS } from "./shared";

interface FilialData {
  month: string;
  entrada: number;
}

interface ComparativeFilialData {
  [key: string]: number | string;
  month: string;
}

interface FluxoPorFilialProps {
  filialViewMode: "individual" | "comparativo";
  selectedFilial: string;
  selectedFiliaisForComparison: string[];
  individualFilialData: FilialData[];
  comparativeFilialData: ComparativeFilialData[];
  totalEntradaFilialIndividual: number;
  filiais: string[];
  filialSearch: string;
  setFilialSearch: (v: string) => void;
  filialPage: number;
  setFilialPage: (v: number) => void;
  paginatedFiliais: string[];
  totalFilialPages: number;
  toggleFilialForComparison: (filial: string) => void;
  setFilialViewMode: (mode: "individual" | "comparativo") => void;
  setSelectedFilial: (filial: string) => void;
  selectedMonths: string[];
  toggleMonth: (month: string) => void;
}

const FluxoPorFilial: React.FC<FluxoPorFilialProps> = ({
  filialViewMode,
  selectedFilial,
  selectedFiliaisForComparison,
  individualFilialData,
  comparativeFilialData,
  totalEntradaFilialIndividual,
  filiais,
  filialSearch,
  setFilialSearch,
  filialPage,
  setFilialPage,
  paginatedFiliais,
  totalFilialPages,
  toggleFilialForComparison,
  setFilialViewMode,
  setSelectedFilial,
  selectedMonths,
  toggleMonth,
}) => {
  return (
    <>
      {/* Controles de visualização das filiais */}
      <div className="bg-white shadow rounded-lg p-3 sm:p-4">
        <div className="flex flex-col gap-4">
          {/* Modo de visualização */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <label className="text-sm font-medium">Modo de visualização:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilialViewMode("individual")}
                className={`cursor-pointer px-3 py-1 rounded text-sm ${
                  filialViewMode === "individual"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                Individual
              </button>
              <button
                onClick={() => setFilialViewMode("comparativo")}
                className={`cursor-pointer px-3 py-1 rounded text-sm ${
                  filialViewMode === "comparativo"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                Comparativo
              </button>
            </div>
          </div>

          {/* Seleção individual de filial */}
          {filialViewMode === "individual" && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <label className="text-sm font-medium">Filial:</label>
              <select
                value={selectedFilial}
                onChange={(e) => setSelectedFilial(e.target.value)}
                className="border rounded px-3 py-2 text-sm min-w-[200px]"
              >
                {filiais.map((filial) => (
                  <option key={filial} value={filial}>
                    {filial}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Seleção múltipla para comparação */}
          {filialViewMode === "comparativo" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">
                  Filiais selecionadas ({selectedFiliaisForComparison.length}
                  /8):
                </label>
              </div>
              <div className="relative w-full sm:w-1/3">
                <input
                  type="text"
                  placeholder="Buscar filial..."
                  value={filialSearch}
                  onChange={(e) => {
                    setFilialSearch(e.target.value);
                    setFilialPage(1);
                  }}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm pl-8"
                />
                {/* Search icon omitted for brevity */}
              </div>
              <div className="border rounded p-3 max-h-60 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {paginatedFiliais.map((filial) => (
                    <label
                      key={filial}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFiliaisForComparison.includes(filial)}
                        onChange={() => toggleFilialForComparison(filial)}
                        disabled={
                          !selectedFiliaisForComparison.includes(filial) &&
                          selectedFiliaisForComparison.length >= 8
                        }
                        className="text-blue-500"
                      />
                      <span className="text-sm">{filial}</span>
                    </label>
                  ))}
                </div>
                {totalFilialPages > 1 && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="text-xs text-gray-600">
                      Página {filialPage} de {totalFilialPages} (
                      {paginatedFiliais.length} filiais)
                    </div>
                    <div className="flex gap-1">
                      <button
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                        onClick={() =>
                          setFilialPage(Math.max(1, filialPage - 1))
                        }
                        disabled={filialPage === 1}
                      >
                        Anterior
                      </button>
                      <button
                        className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                        onClick={() =>
                          setFilialPage(
                            Math.min(totalFilialPages, filialPage + 1)
                          )
                        }
                        disabled={filialPage === totalFilialPages}
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card de resumo */}
      {filialViewMode === "individual" && (
        <div className="bg-blue-100 text-blue-800 shadow rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600">
            Entradas - {selectedFilial} (período)
          </h3>
          <div className="mt-2 text-2xl font-bold text-blue-700">
            R$ {totalEntradaFilialIndividual.toLocaleString()}
          </div>
        </div>
      )}

      {/* Gráfico */}
      <div className="bg-white shadow rounded-lg p-3 sm:p-4">
        <h2 className="font-semibold mb-4">
          {filialViewMode === "individual"
            ? `Entradas por Mês - ${selectedFilial}`
            : "Comparativo de Entradas por Filial"}
        </h2>
        <ResponsiveContainer width="100%" height={480}>
          <BarChart
            data={
              filialViewMode === "individual"
                ? individualFilialData
                : comparativeFilialData
            }
            onClick={(e: any) => {
              if (e && e.activeLabel) {
                toggleMonth(e.activeLabel as string);
              }
            }}
          >
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value: any) => `R$ ${Number(value).toLocaleString()}`}
            />
            <Legend />
            {filialViewMode === "individual" ? (
              <Bar dataKey="entrada" name="Entradas" fill="#60a5fa" />
            ) : (
              selectedFiliaisForComparison.map((filial, index) => (
                <Bar
                  key={filial}
                  dataKey={filial}
                  name={filial}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                />
              ))
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

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
    </>
  );
};

export default FluxoPorFilial;
