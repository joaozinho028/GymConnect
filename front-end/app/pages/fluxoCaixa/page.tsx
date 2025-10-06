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
const filiais = ["Todas", "Filial A", "Filial B", "Filial C"];
const PIE_COLORS = ["#60a5fa", "#34d399", "#f97316", "#f87171", "#a78bfa"];

// Dados fictícios
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

// Preenche meses faltantes
const fillMissingMonths = (
  data: { month: string; entrada: number; saida: number }[]
) =>
  MONTHS.map(
    (month) =>
      data.find((m) => m.month === month) || { month, entrada: 0, saida: 0 }
  );

// Junta dados de todas as filiais
const allCashFlowDataByFilial: Record<
  string,
  { month: string; entrada: number; saida: number }[]
> = {
  ...Object.fromEntries(
    Object.entries(initialData).map(([filial, data]) => [
      filial,
      fillMissingMonths(data),
    ])
  ),
  Todas: MONTHS.map((month) => {
    const entrada = Object.values(initialData).reduce(
      (sum, arr) => sum + (arr.find((m) => m.month === month)?.entrada || 0),
      0
    );
    const saida = Object.values(initialData).reduce(
      (sum, arr) => sum + (arr.find((m) => m.month === month)?.saida || 0),
      0
    );
    return { month, entrada, saida };
  }),
};

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
function exportToExcel() {
  alert(
    "Exportação para Excel não implementada. Use uma biblioteca como xlsx."
  );
}
function exportToPDF() {
  alert("Exportação para PDF não implementada. Use uma biblioteca como jsPDF.");
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
  const [selectedFilial, setSelectedFilial] = useState<string>("Todas");
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

  // Filtros e dados derivados
  const filteredChartData = useMemo(() => {
    const dataForFilial = allCashFlowDataByFilial[selectedFilial] || [];
    return dataForFilial.filter((m) => selectedMonths.includes(m.month));
  }, [selectedFilial, selectedMonths]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        if (selectedFilial !== "Todas" && t.filial !== selectedFilial)
          return false;
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
        // Filtro por data
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
            filial: selectedFilial === "Todas" ? filiais[1] : selectedFilial,
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

  // async function handleExportPDF() {
  //   const dashboard = document.getElementById("pdf-dashboard");
  //   if (!dashboard) {
  //     alert("Não foi possível encontrar o conteúdo para exportação.");
  //     return;
  //   }

  //   // Garante que o container está visível para captura
  //   dashboard.style.display = "block";

  //   // Aguarda renderização
  //   await new Promise((resolve) => setTimeout(resolve, 500));

  //   // Captura imagem do dashboard
  //   const canvas = await html2canvas(dashboard, { scale: 2 });
  //   const imgData = canvas.toDataURL("image/png");

  //   // Cria PDF
  //   const pdf = new jsPDF({
  //     orientation: "portrait",
  //     unit: "mm",
  //     format: "a4",
  //   });

  //   // Calcula proporção para caber na página
  //   const pageWidth = pdf.internal.pageSize.getWidth();
  //   const pageHeight = pdf.internal.pageSize.getHeight();
  //   const imgProps = pdf.getImageProperties(imgData);
  //   const pdfWidth = pageWidth - 20;
  //   const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  //   // Adiciona imagem ao PDF
  //   pdf.addImage(imgData, "PNG", 10, 10, pdfWidth, pdfHeight);

  //   // Salva PDF
  //   pdf.save("relatorio-gymconnect.pdf");

  //   // Esconde novamente o container
  //   dashboard.style.display = "none";
  // }

  <div
    id="pdf-dashboard"
    style={{
      position: "absolute",
      left: "-9999px",
      top: 0,
      width: "800px", // largura fixa para o PDF
      background: "#fff",
      zIndex: -1,
      padding: 24,
    }}
  >
    {/* LOGO */}
    <div style={{ marginBottom: 24 }}>
      <img
        src="/logo-gymconnect.png"
        alt="Logo GymConnect"
        style={{ height: 60 }}
      />
    </div>
    {/* CARDS */}
    <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
      <div
        style={{ background: "#d1fae5", padding: 16, borderRadius: 8, flex: 1 }}
      >
        <div>Entradas</div>
        <div style={{ fontWeight: "bold", fontSize: 22 }}>
          R$ {totalEntrada.toLocaleString()}
        </div>
      </div>
      <div
        style={{ background: "#fee2e2", padding: 16, borderRadius: 8, flex: 1 }}
      >
        <div>Saídas</div>
        <div style={{ fontWeight: "bold", fontSize: 22 }}>
          R$ {totalSaida.toLocaleString()}
        </div>
      </div>
      <div
        style={{
          background: saldo >= 0 ? "#f0fdf4" : "#fef2f2",
          padding: 16,
          borderRadius: 8,
          flex: 1,
        }}
      >
        <div>Saldo</div>
        <div style={{ fontWeight: "bold", fontSize: 22 }}>
          {saldo >= 0 ? "+" : "-"} R$ {Math.abs(saldo).toLocaleString()}
        </div>
      </div>
    </div>
    {/* GRÁFICOS */}
    <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
      <div style={{ flex: 1 }}>
        <h3>Fluxo de Caixa</h3>
        <div
          id="pdf-bar-chart"
          style={{ width: 350, height: 220, background: "#fff" }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <h3>Por Categoria</h3>
        <div
          id="pdf-pie-chart"
          style={{ width: 350, height: 220, background: "#fff" }}
        />
      </div>
    </div>
    {/* TABELA */}
    <div>
      <h3>Transações</h3>
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
      >
        <thead>
          <tr>
            <th style={{ border: "1px solid #eee", padding: 4 }}>Data</th>
            <th style={{ border: "1px solid #eee", padding: 4 }}>Descrição</th>
            <th style={{ border: "1px solid #eee", padding: 4 }}>Categoria</th>
            <th style={{ border: "1px solid #eee", padding: 4 }}>Filial</th>
            <th style={{ border: "1px solid #eee", padding: 4 }}>Tipo</th>
            <th style={{ border: "1px solid #eee", padding: 4 }}>Pagamento</th>
            <th style={{ border: "1px solid #eee", padding: 4 }}>Valor</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.map((t) => (
            <tr key={t.id}>
              <td style={{ border: "1px solid #eee", padding: 4 }}>{t.date}</td>
              <td style={{ border: "1px solid #eee", padding: 4 }}>
                {t.description}
              </td>
              <td style={{ border: "1px solid #eee", padding: 4 }}>
                {t.category}
              </td>
              <td style={{ border: "1px solid #eee", padding: 4 }}>
                {t.filial}
              </td>
              <td style={{ border: "1px solid #eee", padding: 4 }}>{t.type}</td>
              <td style={{ border: "1px solid #eee", padding: 4 }}>
                {t.paymentMethod}
              </td>
              <td style={{ border: "1px solid #eee", padding: 4 }}>
                R$ {t.value.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>;

  return (
    <div className="p-2 sm:p-4 max-w-7xl mx-auto space-y-6">
      {/* Filtros principais */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <label className="block text-sm font-medium mb-1" htmlFor="filial">
            Filial
          </label>
          <select
            id="filial"
            value={selectedFilial}
            onChange={(e) => setSelectedFilial(e.target.value)}
            className="w-full border rounded px-2 py-2 text-sm"
          >
            {filiais.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
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
            // onClick={handleExportPDF}
          >
            <Copy size={16} /> <span>Gerar Relatório</span>
          </button>
        </div>
      </div>

      {/* Cartões resumo */}
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

      {/* Seleção de meses */}
      <div className="bg-white shadow rounded-lg p-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex flex-wrap gap-2 items-center">
            <label className="text-sm font-medium mr-2">Meses:</label>
            {(allCashFlowDataByFilial[selectedFilial] || []).map((m) => (
              <button
                key={m.month}
                onClick={() => toggleMonth(m.month)}
                className={`px-3 py-1 rounded-full text-xs sm:text-sm border ${
                  selectedMonths.includes(m.month)
                    ? "bg-green-500 text-white"
                    : "bg-gray-100"
                }`}
              >
                {m.month}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-3 sm:p-4">
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

      {/* Extrato de transações */}
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
