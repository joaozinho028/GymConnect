"use client";

import ModalComponent from "@/components/Modal/ModalComponent";
import { parseISO } from "date-fns";
import { Copy } from "lucide-react";
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
import CategoriaPage from "../categoria/categoriaPage";
import ImportarTransacoesPage from "../transacao/ImportarTransacoesPage";
import TransacaoPage from "../transacao/TransacaoPage";

type Transaction = {
  id: string;
  date: string; // ISO
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

// Meses fixos do ano
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

// Lista de filiais
const filiais = ["Filial A", "Filial B", "Filial C"];

// Dados base conhecidos
const initialData: Record<
  string,
  { month: string; entrada: number; saida: number }[]
> = {
  "Filial A": [
    { month: "Janeiro", entrada: 10000, saida: 4000 },
    { month: "Fevereiro", entrada: 11000, saida: 4500 },
    { month: "Março", entrada: 12000, saida: 5000 },
    { month: "Abril", entrada: 9000, saida: 3500 },
    { month: "Maio", entrada: 13000, saida: 6000 },
    { month: "Junho", entrada: 11000, saida: 4000 },
    { month: "Julho", entrada: 14000, saida: 5000 },
    { month: "Agosto", entrada: 12500, saida: 5500 },
  ],
  "Filial B": [
    { month: "Janeiro", entrada: 8000, saida: 3000 },
    { month: "Fevereiro", entrada: 9000, saida: 3500 },
    { month: "Março", entrada: 9500, saida: 4000 },
    { month: "Abril", entrada: 7000, saida: 2500 },
    { month: "Maio", entrada: 10000, saida: 4500 },
    { month: "Junho", entrada: 9000, saida: 3000 },
    { month: "Julho", entrada: 11000, saida: 3500 },
    { month: "Agosto", entrada: 10500, saida: 4000 },
  ],
  "Filial C": [
    { month: "Janeiro", entrada: 12000, saida: 5000 },
    { month: "Fevereiro", entrada: 13000, saida: 5500 },
    { month: "Março", entrada: 13500, saida: 6000 },
    { month: "Abril", entrada: 10000, saida: 4500 },
    { month: "Maio", entrada: 14000, saida: 7000 },
    { month: "Junho", entrada: 12000, saida: 4500 },
    { month: "Julho", entrada: 15000, saida: 6000 },
    { month: "Agosto", entrada: 14000, saida: 6500 },
  ],
};

// Função para garantir todos os meses
const fillMissingMonths = (
  data: { month: string; entrada: number; saida: number }[]
) => {
  return MONTHS.map((month) => {
    const found = data.find((m) => m.month === month);
    return found || { month, entrada: 0, saida: 0 };
  });
};

// Dados finais com todos os meses para todas as filiais
const allCashFlowDataByFilial: Record<
  string,
  { month: string; entrada: number; saida: number }[]
> = Object.fromEntries(
  Object.entries(initialData).map(([filial, data]) => [
    filial,
    fillMissingMonths(data),
  ])
);

// Categorias dinâmicas
const initialCategories: Category[] = [
  { id: "1", name: "Mensalidade" },
  { id: "2", name: "Despesas" },
];

// Transações iniciais
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
  {
    id: "3",
    date: "2025-07-15",
    description: "Mensalidade Cliente Y",
    category: "Mensalidade",
    paymentMethod: "Dinheiro",
    type: "entrada",
    value: 1300,
    month: "Julho",
    filial: "Filial B",
  },
  {
    id: "4",
    date: "2025-07-20",
    description: "Pagamento Energia",
    category: "Despesas",
    paymentMethod: "Boleto",
    type: "saida",
    value: 300,
    month: "Julho",
    filial: "Filial B",
  },
  {
    id: "5",
    date: "2025-08-10",
    description: "Mensalidade Cliente Z",
    category: "Mensalidade",
    paymentMethod: "Pix",
    type: "entrada",
    value: 1500,
    month: "Agosto",
    filial: "Filial C",
  },
  {
    id: "6",
    date: "2025-08-12",
    description: "Compra Equipamentos",
    category: "Despesas",
    paymentMethod: "Cartão",
    type: "saida",
    value: 700,
    month: "Agosto",
    filial: "Filial C",
  },
];

// Cores do gráfico
const PIE_COLORS = ["#60a5fa", "#34d399", "#f97316", "#f87171", "#a78bfa"];

export default function FluxoCaixaPage() {
  // Estado para modal de importação
  const [showImportModal, setShowImportModal] = useState(false);
  // Funções de exportação e copiar
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

  function exportToExcel(data: Transaction[]) {
    alert(
      "Exportação para Excel não implementada. Use uma biblioteca como xlsx."
    );
  }

  function exportToPDF(data: Transaction[]) {
    alert(
      "Exportação para PDF não implementada. Use uma biblioteca como jsPDF."
    );
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
  // Estados principais
  const [selectedFilial, setSelectedFilial] = useState<string>(filiais[0]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>(["Agosto"]);
  const [modalidade, setModalidade] = useState<string>("Todos");
  const [tipoPagamento, setTipoPagamento] = useState<string>("Todos");
  const [fluxo, setFluxo] = useState<string>("Todos");
  const [search, setSearch] = useState<string>("");
  const [dateStart, setDateStart] = useState<string>("");
  const [dateEnd, setDateEnd] = useState<string>("");

  // CRUD categorias
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  // CRUD transações
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(
    null
  );
  const [transactionForm, setTransactionForm] = useState<Transaction | null>(
    null
  );

  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [sortBy, setSortBy] = useState<"date" | "value">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Filtros avançados
  const filteredChartData = useMemo(() => {
    const dataForFilial = allCashFlowDataByFilial[selectedFilial] || [];
    return dataForFilial.filter((m) => selectedMonths.includes(m.month));
  }, [selectedFilial, selectedMonths]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        if (t.filial !== selectedFilial) return false;
        if (selectedMonths.length && !selectedMonths.includes(t.month))
          return false;
        if (modalidade !== "Todos" && t.category !== modalidade) return false;
        if (tipoPagamento !== "Todos" && t.paymentMethod !== tipoPagamento)
          return false;
        if (fluxo !== "Todos" && t.type !== fluxo) return false;
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
    selectedFilial,
    selectedMonths,
    modalidade,
    tipoPagamento,
    fluxo,
    search,
    sortBy,
    sortDir,
    dateStart,
    dateEnd,
  ]);

  const totalEntrada = filteredChartData.reduce((s, c) => s + c.entrada, 0);
  const totalSaida = filteredChartData.reduce((s, c) => s + c.saida, 0);
  const saldo = totalEntrada - totalSaida;

  const pieData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions.forEach((t) => {
      if (t.type === "saida") {
        const key = t.category;
        map[key] = (map[key] || 0) + Math.abs(t.value);
      }
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

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

  // CRUD Categoria
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    setCategories([
      ...categories,
      { id: Date.now().toString(), name: newCategoryName.trim() },
    ]);
    setNewCategoryName("");
    setShowCategoryModal(false);
  };
  const handleEditCategory = () => {
    if (!editCategory || !newCategoryName.trim()) return;
    setCategories(
      categories.map((c) =>
        c.id === editCategory.id ? { ...c, name: newCategoryName.trim() } : c
      )
    );
    setEditCategory(null);
    setNewCategoryName("");
    setShowCategoryModal(false);
  };
  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id));
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
            filial: selectedFilial,
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

  // Opções dinâmicas
  const opcoesModalidade = [
    { label: "Todos", value: "Todos" },
    ...categories.map((c) => ({ label: c.name, value: c.name })),
  ];
  const opcoesTipoPagamento = [
    { label: "Todos", value: "Todos" },
    { label: "Pix", value: "Pix" },
    { label: "Dinheiro", value: "Dinheiro" },
    { label: "Cartão", value: "Cartão" },
    { label: "Boleto", value: "Boleto" },
  ];
  const opcoesFluxo = [
    { label: "Todos", value: "Todos" },
    { label: "Entrada", value: "entrada" },
    { label: "Saída", value: "saida" },
  ];

  // ...existing code...
  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      {/* Filial e ações */}
      <div className="mb-4 flex items-center justify-between">
        <div className="max-w-xs w-full">
          <label className="block text-sm font-medium mb-1" htmlFor="filial">
            Filial
          </label>
          <select
            id="filial"
            value={selectedFilial}
            onChange={(e) => setSelectedFilial(e.target.value)}
            className="w-full border rounded px-2 py-1"
          >
            {filiais.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            title="Nova Transação"
            className="bg-blue-100 p-2 rounded hover:bg-blue-200 cursor-pointer"
            onClick={() => setShowTransactionModal(true)}
          >
            Nova Transação
          </button>
          <button
            title="Categorias"
            className="bg-gray-100 p-2 rounded hover:bg-gray-200 cursor-pointer"
            onClick={() => setShowCategoryModal(true)}
          >
            Categorias
          </button>
          <button
            title="Importar Transações"
            className="bg-gray-100 p-2 rounded hover:bg-gray-200 cursor-pointer"
            onClick={() => setShowImportModal(true)}
          >
            Importar Transações
          </button>
          <button
            title="Gerar Relatório"
            className="bg-gray-100 p-2 rounded hover:bg-gray-200 cursor-pointer flex items-center gap-2"
            onClick={() => console.log("Gerar relatório")}
          >
            {" "}
            <Copy size={16} /> <span>Gerar Relatório</span>
          </button>
        </div>
      </div>

      {/* Filtros avançados */}
      <div className="bg-white shadow rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
          <div>
            <label className="text-sm">Data Inicial</label>
            <input
              type="date"
              className="w-full border rounded px-2 py-1"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm">Data Final</label>
            <input
              type="date"
              className="w-full border rounded px-2 py-1"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm">Buscar</label>
            <input
              type="text"
              className="w-full border rounded px-2 py-1"
              placeholder="Descrição ou categoria"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm">Modalidade</label>
            <select
              id="modalidade"
              className="w-full border rounded px-2 py-1"
              value={modalidade}
              onChange={(e) => setModalidade(e.target.value)}
            >
              {opcoesModalidade.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm">Tipo Pagamento</label>
            <select
              id="tipoPagamento"
              className="w-full border rounded px-2 py-1"
              value={tipoPagamento}
              onChange={(e) => setTipoPagamento(e.target.value)}
            >
              {opcoesTipoPagamento.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm">Fluxo</label>
            <select
              id="fluxo"
              className="w-full border rounded px-2 py-1"
              value={fluxo}
              onChange={(e) => setFluxo(e.target.value)}
            >
              {opcoesFluxo.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Meses e exportação */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center md:gap-4">
          <div className="flex flex-wrap gap-2 items-center">
            <label className="text-sm font-medium mr-2">Meses:</label>
            {(allCashFlowDataByFilial[selectedFilial] || []).map((m) => (
              <button
                key={m.month}
                onClick={() => toggleMonth(m.month)}
                className={`px-3 py-1 rounded-full text-sm border ${
                  selectedMonths.includes(m.month)
                    ? "bg-green-500 text-white"
                    : "bg-gray-100"
                }`}
              >
                {m.month}
              </button>
            ))}
          </div>
          <div className="flex-1" />
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="font-semibold mb-4">Fluxo de Caixa</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={filteredChartData}
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

        <div className="bg-white shadow rounded-lg p-4">
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

      {/* Listagem de transações com busca, exportação e layout customizado */}
      <div className="bg-white shadow rounded-lg p-4 mt-6">
        <h2 className="font-semibold mb-4">Transações</h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="flex w-full sm:w-1/2 items-end gap-2">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Buscar.."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full h-[42px] p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-[#222222] pl-10"
              />
              <Copy
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
            </div>
            <select
              value={selectedFilial}
              onChange={(e) => {
                setSelectedFilial(e.target.value);
                setPage(1);
              }}
              className="h-[42px] border border-gray-300 rounded px-3 text-[#222222] bg-white"
              style={{ minWidth: 120 }}
            >
              {filiais.map((filial) => (
                <option key={filial} value={filial}>
                  {filial}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-full sm:w-1/2 justify-end">
            <div className="flex flex-wrap gap-2">
              <button
                className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm"
                onClick={() => exportToCSV(pageItems)}
                type="button"
                title="Exportar CSV"
              >
                <Copy size={16} /> CSV
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-green-100 text-green-700 hover:bg-green-200 text-sm"
                onClick={() => exportToExcel(pageItems)}
                type="button"
                title="Exportar Excel"
              >
                <Copy size={16} /> Excel
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-red-100 text-red-700 hover:bg-red-200 text-sm"
                onClick={() => exportToPDF(pageItems)}
                type="button"
                title="Exportar PDF"
              >
                <Copy size={16} /> PDF
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
                onClick={() => copyTable(pageItems)}
                type="button"
                title="Copiar tabela"
              >
                <Copy size={16} /> Copiar
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table
            className="min-w-full divide-y divide-gray-200"
            style={{ tableLayout: "fixed" }}
          >
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Ação
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Data
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Descrição
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Categoria
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Filial
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Pagamento
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
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
                      <td className="px-4 py-2 flex gap-2">
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
                      <td className="px-4 py-2">{t.date}</td>
                      <td className="px-4 py-2">{t.description}</td>
                      <td className="px-4 py-2">{t.category}</td>
                      <td className="px-4 py-2">{t.filial}</td>
                      <td className="px-4 py-2">
                        {t.type === "entrada" ? "Entrada" : "Saída"}
                      </td>
                      <td className="px-4 py-2">{t.paymentMethod}</td>
                      <td className="px-4 py-2">
                        R$ {t.value.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {/* Preenche linhas vazias para manter 5 linhas fixas */}
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

      {showTransactionModal && (
        <ModalComponent
          header="Nova Transação"
          opened={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
        >
          <TransacaoPage />
        </ModalComponent>
      )}

      {showImportModal && (
        <ModalComponent
          header="Importar Transações"
          opened={showImportModal}
          onClose={() => setShowImportModal(false)}
        >
          <ImportarTransacoesPage />
        </ModalComponent>
      )}

      {showCategoryModal && (
        <ModalComponent
          header="Categorias cadastradas"
          opened={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
        >
          <CategoriaPage />
        </ModalComponent>
      )}
    </div>
  );
}
