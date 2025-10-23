"use client";

import ModalComponent from "@/components/Modal/ModalComponent";
import { parseISO } from "date-fns";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

// Filiais e matriz
const filiais = [
  "Academia PowerFit", // Matriz
  "PowerFit São Miguel", // Filial 1
  "PowerFit Alvorada", // Filial 2
];

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

// Categorias
const initialCategories: Category[] = [
  { id: "1", name: "Mensalidade" },
  { id: "2", name: "Despesas" },
  { id: "3", name: "Pagamento de Funcionário" },
];

// 1. Primeiro: Transações mockadas
const initialTransactions: Transaction[] = [
  ...MONTHS.slice(0, new Date().getMonth() + 1).flatMap((month, idx) => [
    // Matriz
    {
      id: `matriz-mensalidade-${idx + 1}`,
      date: `${new Date().getFullYear()}-${String(idx + 1).padStart(
        2,
        "0"
      )}-05`,
      description: `Mensalidade João Vítor (${month})`,
      category: "Mensalidade",
      paymentMethod: "Pix",
      type: "entrada" as "entrada",
      value: 1500,
      month,
      filial: "Academia PowerFit",
    },
    {
      id: `matriz-despesa-${idx + 1}`,
      date: `${new Date().getFullYear()}-${String(idx + 1).padStart(
        2,
        "0"
      )}-10`,
      description: `Compra de equipamentos (${month})`,
      category: "Despesas",
      paymentMethod: "Cartão",
      type: "saida" as "saida",
      value: 3200,
      month,
      filial: "Academia PowerFit",
    },
    {
      id: `matriz-pagfunc-${idx + 1}`,
      date: `${new Date().getFullYear()}-${String(idx + 1).padStart(
        2,
        "0"
      )}-15`,
      description: `Pagamento Funcionário - Maria (${month})`,
      category: "Pagamento de Funcionário",
      paymentMethod: "Transferência",
      type: "saida" as "saida",
      value: 2200,
      month,
      filial: "Academia PowerFit",
    },
    // Filial 1
    {
      id: `filial1-mensalidade-${idx + 1}`,
      date: `${new Date().getFullYear()}-${String(idx + 1).padStart(
        2,
        "0"
      )}-06`,
      description: `Mensalidade Cliente X (${month})`,
      category: "Mensalidade",
      paymentMethod: "Pix",
      type: "entrada" as "entrada",
      value: 1100,
      month,
      filial: "Gym Evolution",
    },
    {
      id: `filial1-despesa-${idx + 1}`,
      date: `${new Date().getFullYear()}-${String(idx + 1).padStart(
        2,
        "0"
      )}-11`,
      description: `Compra de material de limpeza (${month})`,
      category: "Despesas",
      paymentMethod: "Cartão",
      type: "saida" as "saida",
      value: 400,
      month,
      filial: "Gym Evolution",
    },
    {
      id: `filial1-pagfunc-${idx + 1}`,
      date: `${new Date().getFullYear()}-${String(idx + 1).padStart(
        2,
        "0"
      )}-16`,
      description: `Pagamento Funcionário - José (${month})`,
      category: "Pagamento de Funcionário",
      paymentMethod: "Transferência",
      type: "saida" as "saida",
      value: 1800,
      month,
      filial: "Gym Evolution",
    },
    // Filial 2
    {
      id: `filial2-mensalidade-${idx + 1}`,
      date: `${new Date().getFullYear()}-${String(idx + 1).padStart(
        2,
        "0"
      )}-07`,
      description: `Mensalidade Cliente Y (${month})`,
      category: "Mensalidade",
      paymentMethod: "Pix",
      type: "entrada" as "entrada",
      value: 900,
      month,
      filial: "Academia Vida Ativa",
    },
    {
      id: `filial2-despesa-${idx + 1}`,
      date: `${new Date().getFullYear()}-${String(idx + 1).padStart(
        2,
        "0"
      )}-12`,
      description: `Despesas administrativas (${month})`,
      category: "Despesas",
      paymentMethod: "Cartão",
      type: "saida" as "saida",
      value: 600,
      month,
      filial: "Academia Vida Ativa",
    },
    {
      id: `filial2-pagfunc-${idx + 1}`,
      date: `${new Date().getFullYear()}-${String(idx + 1).padStart(
        2,
        "0"
      )}-17`,
      description: `Pagamento Funcionário - Ana (${month})`,
      category: "Pagamento de Funcionário",
      paymentMethod: "Transferência",
      type: "saida" as "saida",
      value: 1600,
      month,
      filial: "Academia Vida Ativa",
    },
  ]),
];

// 2. Depois: Use initialTransactions para gerar os dados dos gráficos
const allCashFlowData = MONTHS.map((month) => {
  const entrada = initialTransactions
    .filter((t) => t.month === month && t.type === "entrada")
    .reduce((sum, t) => sum + t.value, 0);
  const saida = initialTransactions
    .filter((t) => t.month === month && t.type === "saida")
    .reduce((sum, t) => sum + t.value, 0);
  return { month, entrada, saida };
});

const entradaDataByFilial: Record<
  string,
  { month: string; entrada: number }[]
> = {};
filiais.forEach((filial) => {
  entradaDataByFilial[filial] = MONTHS.map((month) => {
    const entrada = initialTransactions
      .filter(
        (t) => t.month === month && t.filial === filial && t.type === "entrada"
      )
      .reduce((sum, t) => sum + t.value, 0);
    return { month, entrada };
  });
});

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
  const [activeTab, setActiveTab] = useState<"geral" | "filiais" | "nova">(
    "geral"
  );
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
      // Remove o filtro de tipo
      const key = t.category;
      map[key] = (map[key] || 0) + Math.abs(t.value);
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
            month: MONTHS[new Date().getFullYear()],
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
    setActiveTab("geral"); // Volta para a aba geral
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (activeTab === "nova") {
      handleOpenTransactionModal();
    }
  }, [activeTab]);

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
          <button
            onClick={() => setActiveTab("nova")}
            className={`cursor-pointer py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "nova"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Nova Transação
          </button>
        </nav>
      </div>

      {/* Botões de ação (apenas na aba geral) */}
      {activeTab === "geral" && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:gap-2">
            {/* <button
              title="Nova Transação"
              className="bg-blue-100 w-full sm:w-auto p-2 rounded hover:bg-blue-200 cursor-pointer text-sm"
              onClick={() => handleOpenTransactionModal()}
            >
              Nova Transação
            </button> */}
            {/* <button
              title="Gerar Relatório"
              className="bg-gray-100 w-full sm:w-auto p-2 rounded hover:bg-gray-200 cursor-pointer flex items-center gap-2 text-sm"
            >
              <Copy size={16} /> <span>Gerar Relatório</span>
            </button> */}
          </div>
        </div>
      )}

      {activeTab === "geral" && (
        <>
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
        </>
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

      {activeTab === "filiais" && (
        <>
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
        </>
      )}

      {/* Modal de transação */}
      {showTransactionModal && (
        <ModalComponent
          header={editTransaction ? "Editar Transação" : "Nova Transação"}
          opened={showTransactionModal}
          onClose={() => {
            setShowTransactionModal(false);
            setActiveTab("geral"); // Volta para a aba geral
          }}
        >
          <TransacaoPage />
        </ModalComponent>
      )}
    </div>
  );
}
