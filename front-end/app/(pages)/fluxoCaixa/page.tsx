"use client";
import { parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import FluxoGeral from "./fluxoGeral";
import FluxoPorFilial from "./fluxoPorFilial";
import FormTransacao from "./formTransacao";
import { MONTHS } from "./shared";

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

// Filiais e matriz
const filiais = [
  "Academia PowerFit", // Matriz
  "PowerFit São Miguel", // Filial 1
  "PowerFit Alvorada", // Filial 2
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

      {activeTab === "geral" && (
        <FluxoGeral
          selectedMonths={selectedMonths}
          transactions={transactions}
          categories={categories}
          allCashFlowData={allCashFlowData}
          pieData={pieData}
          filteredGeneralData={filteredGeneralData}
          filteredTransactions={filteredTransactions}
          totalEntrada={totalEntrada}
          totalSaida={totalSaida}
          saldo={saldo}
          pageItems={pageItems}
          page={page}
          totalPages={totalPages}
          toggleMonth={toggleMonth}
          exportToCSV={exportToCSV}
          copyTable={copyTable}
          setPage={setPage}
        />
      )}

      {activeTab === "filiais" && (
        <FluxoPorFilial
          filialViewMode={filialViewMode}
          selectedFilial={selectedFilial}
          selectedFiliaisForComparison={selectedFiliaisForComparison}
          individualFilialData={individualFilialData}
          comparativeFilialData={comparativeFilialData}
          totalEntradaFilialIndividual={totalEntradaFilialIndividual}
          filiais={filiais}
          filialSearch={filialSearch}
          setFilialSearch={setFilialSearch}
          filialPage={filialPage}
          setFilialPage={setFilialPage}
          paginatedFiliais={paginatedFiliais}
          totalFilialPages={totalFilialPages}
          toggleFilialForComparison={toggleFilialForComparison}
          setFilialViewMode={setFilialViewMode}
          setSelectedFilial={setSelectedFilial}
          selectedMonths={selectedMonths}
          toggleMonth={toggleMonth}
        />
      )}

      <FormTransacao
        showTransactionModal={showTransactionModal}
        editTransaction={editTransaction}
        transactionForm={transactionForm}
        setShowTransactionModal={setShowTransactionModal}
        setActiveTab={setActiveTab}
      />
    </div>
  );
}
