"use client";

import ModalComponent from "@/components/Modal/ModalComponent";
import { parseISO } from "date-fns";
import { Copy, Search } from "lucide-react";
import { useMemo, useState } from "react";
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
import TransacaoPage from "../transacao/TransacaoPage";

// Types
type Transaction = {
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

type Category = {
  id: string;
  name: string;
};

// Constantes
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// Simulando muitas filiais para teste
const filiais = Array.from(
  { length: 50 },
  (_, i) =>
    `Filial ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) || ""}`
);

const PIE_COLORS = [
  "#60a5fa",
  "#34d399",
  "#f97316",
  "#f87171",
  "#a78bfa",
  "#fb7185",
  "#fbbf24",
  "#a3a3a3",
];

// Dados fictícios expandidos para todas as filiais
const generateInitialData = () => {
  const data: Record<
    string,
    { month: string; entrada: number; saida: number }[]
  > = {};

  filiais.forEach((filial, index) => {
    data[filial] = MONTHS.map((month, monthIndex) => ({
      month,
      entrada: Math.floor(Math.random() * 15000) + 5000 + index * 100, // Varia entre 5000-20000
      saida: Math.floor(Math.random() * 8000) + 2000 + index * 50, // Varia entre 2000-10000
    }));
  });

  return data;
};

const initialData = generateInitialData();

// Preenche meses faltantes
const fillMissingMonths = (
  data: { month: string; entrada: number; saida: number }[]
) =>
  MONTHS.map(
    (month) =>
      data.find((m) => m.month === month) || { month, entrada: 0, saida: 0 }
  );

// Dados consolidados para fluxo geral
const allCashFlowData = MONTHS.map((month) => {
  const entrada = Object.values(initialData).reduce(
    (sum, arr) => sum + (arr.find((m) => m.month === month)?.entrada || 0),
    0
  );
  const saida = Object.values(initialData).reduce(
    (sum, arr) => sum + (arr.find((m) => m.month === month)?.saida || 0),
    0
  );
  return { month, entrada, saida };
});

// Dados por filial para entradas
const entradaDataByFilial: Record<
  string,
  { month: string; entrada: number }[]
> = Object.fromEntries(
  Object.entries(initialData).map(([filial, data]) => [
    filial,
    fillMissingMonths(data).map(({ month, entrada }) => ({ month, entrada })),
  ])
);

// Categorias e transações fictícias
const initialCategories: Category[] = [
  { id: "1", name: "Mensalidade" },
  { id: "2", name: "Despesas" },
];

const initialTransactions: Transaction[] = [
  {
    id: "1",
    date: "2025-08-05",
    description: "Mensalidade Cliente X",
    category: "Mensalidade",
    paymentMethod: "Pix",
    type: "entrada",
    value: 1200,
    month: "Agosto",
    filial: "Filial A",
  },
  {
    id: "2",
    date: "2025-08-07",
    description: "Compra Material",
    category: "Despesas",
    paymentMethod: "Cartão",
    type: "saida",
    value: 450,
    month: "Agosto",
    filial: "Filial A",
  },
];

// Funções de exportação/cópia
function exportToCSV(data: Transaction[]) {
  if (!data.length) return;
  const header = [
    "Data",
    "Descrição",
    "Categoria",
    "Filial",
    "Tipo",
    "Pagamento",
    "Valor",
  ];
  const rows = data.map((t) => [
    t.date,
    t.description,
    t.category,
    t.filial,
    t.type,
    t.paymentMethod,
    t.value,
  ]);
  const csvContent = [header, ...rows].map((e) => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "transacoes.csv";
  link.click();
}

function copyTable(data: Transaction[]) {
  if (!data.length) return;
  const header = [
    "Data",
    "Descrição",
    "Categoria",
    "Filial",
    "Tipo",
    "Pagamento",
    "Valor",
  ];
  const rows = data.map((t) => [
    t.date,
    t.description,
    t.category,
    t.filial,
    t.type,
    t.paymentMethod,
    t.value,
  ]);
  const tableText = [header, ...rows].map((e) => e.join("\t")).join("\n");
  navigator.clipboard.writeText(tableText);
  alert("Tabela copiada para área de transferência!");
}

// Componente principal
export default function FluxoCaixaPage() {
  // Estados principais
  const [activeTab, setActiveTab] = useState<"geral" | "filiais">("geral");
  const [selectedMonths, setSelectedMonths] = useState<string[]>([
    MONTHS[new Date().getMonth()],
  ]);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(
    null
  );
  const [transactionForm, setTransactionForm] = useState<Transaction | null>(
    null
  );
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [sortBy, setSortBy] = useState<"date" | "value">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [dateStart, setDateStart] = useState<string>("");
  const [dateEnd, setDateEnd] = useState<string>("");

  // Estados específicos para filiais
  const [filialViewMode, setFilialViewMode] = useState<
    "individual" | "comparativo"
  >("individual");
  const [selectedFilial, setSelectedFilial] = useState<string>(filiais[0]);
  const [selectedFiliaisForComparison, setSelectedFiliaisForComparison] =
    useState<string[]>(filiais.slice(0, 5));
  const [filialSearch, setFilialSearch] = useState<string>("");
  const [filialPage, setFilialPage] = useState(1);
  const filialPageSize = 10;

  // Filiais filtradas para busca
  const filteredFiliais = useMemo(() => {
    return filiais.filter((filial) =>
      filial.toLowerCase().includes(filialSearch.toLowerCase())
    );
  }, [filialSearch]);

  // Paginação das filiais
  const paginatedFiliais = useMemo(() => {
    const start = (filialPage - 1) * filialPageSize;
    return filteredFiliais.slice(start, start + filialPageSize);
  }, [filteredFiliais, filialPage]);

  const totalFilialPages = Math.max(
    1,
    Math.ceil(filteredFiliais.length / filialPageSize)
  );

  // Dados filtrados para aba geral
  const filteredGeneralData = useMemo(() => {
    return allCashFlowData.filter((m) => selectedMonths.includes(m.month));
  }, [selectedMonths]);

  // Dados para visualização individual de filial
  const individualFilialData = useMemo(() => {
    if (filialViewMode !== "individual") return [];

    return selectedMonths.map((month) => {
      const data = entradaDataByFilial[selectedFilial]?.find(
        (m) => m.month === month
      );
      return {
        month,
        entrada: data?.entrada || 0,
      };
    });
  }, [selectedMonths, selectedFilial, filialViewMode]);

  // Dados para comparação de filiais
  const comparativeFilialData = useMemo(() => {
    if (filialViewMode !== "comparativo") return [];

    return selectedMonths.map((month) => {
      const monthData: any = { month };
      selectedFiliaisForComparison.forEach((filial) => {
        const data = entradaDataByFilial[filial]?.find(
          (m) => m.month === month
        );
        monthData[filial] = data?.entrada || 0;
      });
      return monthData;
    });
  }, [selectedMonths, selectedFiliaisForComparison, filialViewMode]);

  // Total de entradas para filial individual
  const totalEntradaFilialIndividual = useMemo(() => {
    return individualFilialData.reduce((sum, data) => sum + data.entrada, 0);
  }, [individualFilialData]);

  // Transações filtradas (apenas para aba geral)
  const filteredTransactions = useMemo(() => {
    if (activeTab !== "geral") return [];

    return transactions
      .filter((t) => {
        if (selectedMonths.length && !selectedMonths.includes(t.month))
          return false;
        if (
          search &&
          !(
            t.description.toLowerCase().includes(search.toLowerCase()) ||
            t.category.toLowerCase().includes(search.toLowerCase())
          )
        )
          return false;
        if (dateStart && t.date < dateStart) return false;
        if (dateEnd && t.date > dateEnd) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "date") {
          const diff = parseISO(a.date).getTime() - parseISO(b.date).getTime();
          return sortDir === "asc" ? diff : -diff;
        } else {
          const diff = a.value - b.value;
          return sortDir === "asc" ? diff : -diff;
        }
      });
  }, [
    transactions,
    selectedMonths,
    search,
    sortBy,
    sortDir,
    dateStart,
    dateEnd,
    activeTab,
  ]);

  // Cálculos para aba geral
  const totalEntrada = filteredGeneralData.reduce((s, c) => s + c.entrada, 0);
  const totalSaida = filteredGeneralData.reduce((s, c) => s + c.saida, 0);
  const saldo = totalEntrada - totalSaida;

  const pieData = useMemo(() => {
    if (activeTab !== "geral") return [];

    const map: Record<string, number> = {};
    filteredTransactions.forEach((t) => {
      if (t.type === "saida") {
        const key = t.category;
        map[key] = (map[key] || 0) + Math.abs(t.value);
      }
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions, activeTab]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / pageSize)
  );
  const pageItems = filteredTransactions.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const toggleMonth = (month: string) => {
    setSelectedMonths((prev) => {
      if (prev.includes(month)) return prev.filter((m) => m !== month);
      if (prev.length >= 4) return prev;
      return [...prev, month];
    });
  };

  const toggleFilialForComparison = (filial: string) => {
    setSelectedFiliaisForComparison((prev) => {
      if (prev.includes(filial)) {
        return prev.filter((f) => f !== filial);
      } else if (prev.length < 8) {
        // Máximo 8 filiais para não poluir o gráfico
        return [...prev, filial];
      }
      return prev;
    });
  };

  // CRUD Transação
  const handleOpenTransactionModal = (t?: Transaction) => {
    setEditTransaction(t || null);
    setTransactionForm(
      t
        ? { ...t }
        : {
            id: "",
            date: "",
            description: "",
            category: categories[0]?.name || "",
            paymentMethod: "Pix",
            type: "entrada",
            value: 0,
            month: MONTHS[new Date().getMonth()],
            filial: filiais[0],
          }
    );
    setShowTransactionModal(true);
  };

  const handleSaveTransaction = () => {
    if (!transactionForm) return;
    if (
      !transactionForm.date ||
      !transactionForm.description ||
      !transactionForm.category ||
      !transactionForm.paymentMethod ||
      !transactionForm.type ||
      !transactionForm.value
    )
      return;
    if (editTransaction) {
      setTransactions(
        transactions.map((t) =>
          t.id === editTransaction.id
            ? { ...transactionForm, id: editTransaction.id }
            : t
        )
      );
    } else {
      setTransactions([
        ...transactions,
        { ...transactionForm, id: Date.now().toString() },
      ]);
    }
    setShowTransactionModal(false);
    setEditTransaction(null);
    setTransactionForm(null);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  return (
    <div className="p-2 sm:p-4 max-w-7xl mx-auto space-y-6">
      {/* Abas */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("geral")}
            className={`cursor-pointer py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "geral"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Fluxo Geral
          </button>
          <button
            onClick={() => setActiveTab("filiais")}
            className={` cursor-pointer py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "filiais"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Entradas por Filiais
          </button>
        </nav>
      </div>

      {/* Botões de ação (apenas na aba geral) */}
      {activeTab === "geral" && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:gap-2">
            <button
              title="Nova Transação"
              className="bg-blue-100 w-full sm:w-auto p-2 rounded hover:bg-blue-200 cursor-pointer text-sm"
              onClick={() => handleOpenTransactionModal()}
            >
              Nova Transação
            </button>
            <button
              title="Gerar Relatório"
              className="bg-gray-100 w-full sm:w-auto p-2 rounded hover:bg-gray-200 cursor-pointer flex items-center gap-2 text-sm"
            >
              <Copy size={16} /> <span>Gerar Relatório</span>
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo da aba Geral */}
      {activeTab === "geral" && (
        <>
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
              <h3 className="text-sm font-medium text-gray-600">
                Saldo (período)
              </h3>
              <div className="mt-2 text-2xl font-bold">
                {saldo >= 0 ? "+" : "-"} R$ {Math.abs(saldo).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Gráficos - Geral */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="bg-white shadow rounded-lg p-3 sm:p-4">
              <h2 className="font-semibold mb-4">Fluxo de Caixa Geral</h2>
              <ResponsiveContainer width="100%" height={260}>
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
              <ResponsiveContainer width="100%" height={260}>
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
      )}

      {/* Conteúdo da aba Filiais */}
      {activeTab === "filiais" && (
        <>
          {/* Controles de visualização das filiais */}
          <div className="bg-white shadow rounded-lg p-3 sm:p-4">
            <div className="flex flex-col gap-4">
              {/* Modo de visualização */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <label className="text-sm font-medium">
                  Modo de visualização:
                </label>
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
                      Filiais selecionadas (
                      {selectedFiliaisForComparison.length}/8):
                    </label>
                  </div>

                  {/* Busca de filiais */}
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
                    <Search
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                  </div>

                  {/* Lista de filiais com checkbox */}
                  <div className="border rounded p-3 max-h-60 overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {paginatedFiliais.map((filial) => (
                        <label
                          key={filial}
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFiliaisForComparison.includes(
                              filial
                            )}
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

                    {/* Paginação das filiais */}
                    {totalFilialPages > 1 && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <div className="text-xs text-gray-600">
                          Página {filialPage} de {totalFilialPages} (
                          {filteredFiliais.length} filiais)
                        </div>
                        <div className="flex gap-1">
                          <button
                            className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                            onClick={() =>
                              setFilialPage((p) => Math.max(1, p - 1))
                            }
                            disabled={filialPage === 1}
                          >
                            Anterior
                          </button>
                          <button
                            className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                            onClick={() =>
                              setFilialPage((p) =>
                                Math.min(totalFilialPages, p + 1)
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
            <ResponsiveContainer width="100%" height={400}>
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
                  formatter={(value: any) =>
                    `R$ ${Number(value).toLocaleString()}`
                  }
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
        </>
      )}

      {/* Seleção de meses */}
      <div className="bg-white shadow rounded-lg p-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex flex-wrap gap-2 items-center">
            <label className="text-sm font-medium mr-2">Meses:</label>
            {MONTHS.map((month) => (
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

      {/* Extrato de transações (apenas na aba geral) */}
      {activeTab === "geral" && (
        <div className="bg-white shadow rounded-lg p-2 sm:p-4 mt-6">
          <h2 className="font-semibold mb-4">Transações</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 mb-6">
            <div className="flex flex-col gap-2 w-full sm:w-1/2">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Buscar.."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-[38px] p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-[#222222] pl-10 text-sm"
                />
                <Copy
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
              </div>
              {/* Filtro por data */}
              <div className="flex gap-2 mt-2">
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => {
                    setDateStart(e.target.value);
                    setPage(1);
                  }}
                  className="border rounded px-2 py-1 text-xs sm:text-sm"
                  placeholder="Data inicial"
                  max={dateEnd || undefined}
                />
                <span className="text-gray-400 text-xs flex items-center">
                  até
                </span>
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => {
                    setDateEnd(e.target.value);
                    setPage(1);
                  }}
                  className="border rounded px-2 py-1 text-xs sm:text-sm"
                  placeholder="Data final"
                  min={dateStart || undefined}
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto w-full">
            <table
              className="w-full min-w-[700px] sm:min-w-full divide-y divide-gray-200 text-xs sm:text-sm"
              style={{ tableLayout: "fixed" }}
            >
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Ação
                  </th>
                  <th className="px-2 py-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Data
                  </th>
                  <th className="px-2 py-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Descrição
                  </th>
                  <th className="px-2 py-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Categoria
                  </th>
                  <th className="px-2 py-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Filial
                  </th>
                  <th className="px-2 py-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-2 py-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Pagamento
                  </th>
                  <th className="px-2 py-2 sm:px-4 text-left text-xs font-medium text-gray-500 uppercase">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody
                className="bg-white divide-y divide-gray-100"
                style={{ height: "300px" }}
              >
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-gray-400">
                      Nenhuma transação encontrada.
                    </td>
                  </tr>
                ) : (
                  <>
                    {pageItems.map((t) => (
                      <tr
                        key={t.id}
                        className="hover:bg-gray-50"
                        style={{ height: "60px" }}
                      >
                        <td className="px-2 py-2 sm:px-4 flex gap-2">
                          <button
                            title="Editar"
                            className="p-2 rounded cursor-pointer hover:bg-gray-100 text-green-600"
                            onClick={() => handleOpenTransactionModal(t)}
                            type="button"
                          >
                            <Copy size={18} />
                          </button>
                          <button
                            title="Excluir"
                            className="p-2 rounded cursor-pointer hover:bg-gray-100 text-red-600"
                            onClick={() => handleDeleteTransaction(t.id)}
                            type="button"
                          >
                            <Copy size={18} />
                          </button>
                        </td>
                        <td className="px-2 py-2 sm:px-4">{t.date}</td>
                        <td className="px-2 py-2 sm:px-4">{t.description}</td>
                        <td className="px-2 py-2 sm:px-4">{t.category}</td>
                        <td className="px-2 py-2 sm:px-4">{t.filial}</td>
                        <td className="px-2 py-2 sm:px-4">
                          {t.type === "entrada" ? "Entrada" : "Saída"}
                        </td>
                        <td className="px-2 py-2 sm:px-4">{t.paymentMethod}</td>
                        <td className="px-2 py-2 sm:px-4">
                          R$ {t.value.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {Array.from({ length: 5 - pageItems.length }).map(
                      (_, idx) => (
                        <tr key={`empty-${idx}`} style={{ height: "60px" }}>
                          <td colSpan={8} />
                        </tr>
                      )
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Página {page} de {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 border rounded cursor-pointer bg-blue-100"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </button>
              <button
                className="px-3 py-1 border rounded cursor-pointer bg-blue-100"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de transação */}
      {showTransactionModal && (
        <ModalComponent
          header={editTransaction ? "Editar Transação" : "Nova Transação"}
          opened={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
        >
          <TransacaoPage />
        </ModalComponent>
      )}
    </div>
  );
}
