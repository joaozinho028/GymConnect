"use client";
import Button from "@/components/Forms/Button";
import Input from "@/components/Forms/Input";
import InputSelectComponent from "@/components/Forms/InputSelect";
import { useAuth } from "@/contexts/AuthContext";
import { GetForm } from "@/utils";
import {
  ChevronLeft,
  ChevronRight,
  Coins,
  Copy,
  FileDown,
  FileSpreadsheet,
  FileText,
  Pencil,
  Save,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import * as yup from "yup";

// Interfaces
interface Plano {
  id: number;
  ciclo: string;
  valor: number;
}

// Funções auxiliares para exportação (padrão usado em outras telas)
const exportToCSV = (data: Plano[]) => {
  const header = ["ID", "Ciclo de Pagamento", "Valor"];
  const rows = data.map((plano) => [
    plano.id,
    plano.ciclo,
    plano.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
  ]);

  const csvContent = [header, ...rows]
    .map((row) =>
      row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `planos_${new Date().toISOString().split("T")[0]}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportToExcel = (data: Plano[]) => {
  // Simples: reutiliza CSV (compatível com Excel)
  exportToCSV(data);
};

const exportToPDF = (data: Plano[]) => {
  const header = `<tr>
    <th style="padding:6px;border:1px solid #ddd;">ID</th>
    <th style="padding:6px;border:1px solid #ddd;">Ciclo de Pagamento</th>
    <th style="padding:6px;border:1px solid #ddd;">Valor</th>
  </tr>`;

  const rows = data
    .map(
      (p) => `<tr>
      <td style="padding:6px;border:1px solid #ddd;">${p.id}</td>
      <td style="padding:6px;border:1px solid #ddd;">${p.ciclo}</td>
      <td style="padding:6px;border:1px solid #ddd;">${p.valor.toLocaleString(
        "pt-BR",
        { style: "currency", currency: "BRL" }
      )}</td>
    </tr>`
    )
    .join("");

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(`
    <html>
      <head><title>Planos</title></head>
      <body>
        <h3>Planos</h3>
        <table style="border-collapse:collapse;width:100%">${header}${rows}</table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
};

const copyTable = (data: Plano[]) => {
  const header = ["ID", "Ciclo de Pagamento", "Valor"];
  const rows = data.map((p) => [
    p.id,
    p.ciclo,
    p.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
  ]);

  const text = [header, ...rows].map((r) => r.join("\t")).join("\n");
  navigator.clipboard.writeText(text);

  Swal.fire({
    icon: "success",
    text: "Tabela copiada para a área de transferência",
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2000,
  });
};

const ConfiguracaoPlanos = ({ ...rest }: any) => {
  // Estados
  const [valor, setValor] = useState("");
  const [plano, setPlano] = useState("");
  const [busca, setBusca] = useState("");
  const [page, setPage] = useState(1);
  const [planoSelecionado, setPlanoSelecionado] = useState<Plano | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(false);

  const { token } = useAuth();
  const [yupSchema, setYupSchema] = useState<
    yup.ObjectSchema<{}, yup.AnyObject, {}, "">
  >(
    yup.object().shape({
      plano: yup.object().required("Selecione o ciclo de cobrança"),
      valor: yup.string().required("Informe o valor do plano"),
    })
  );

  const { handleSubmit, setValue, ...form } = GetForm(yupSchema, setYupSchema);

  // Criar objeto que inclui setValue para os componentes
  const formWithSetValue = { ...form, setValue };

  // Função para limpar formulário
  const limparFormulario = () => {
    setValor("");
    setPlano("");
    setValue("plano", null);
    setValue("valor", "");
  };

  const opcoesPlano = [
    { label: "Mensal", value: "mensal" },
    { label: "Trimestral", value: "trimestral" },
    { label: "Anual", value: "anual" },
  ];

  // Filtrar planos por busca
  const planosFiltrados = planos.filter(
    (plano) =>
      plano.ciclo.toLowerCase().includes(busca.toLowerCase()) ||
      plano.valor.toString().includes(busca)
  );

  // Paginação
  const itemsPerPage = 10;
  const totalPages = Math.max(
    1,
    Math.ceil(planosFiltrados.length / itemsPerPage)
  );
  const pageItems = planosFiltrados.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Helper que faz fetch com Authorization usando token do contexto
  const fetchWithAuth = async (path: string, options: RequestInit = {}) => {
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    const headers: any = options.headers ? { ...options.headers } : {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${base}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw data || new Error("Erro na requisição");
    return data;
  };

  // Carrega planos da API
  const carregarPlanos = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth("/precificacao/consultar-planos");
      // data.planos (formato do backend)
      if (data && data.planos) {
        const planosFormatados = data.planos.map((p: any) => ({
          id: p.id || p.id_plano,
          ciclo: p.ciclo || p.ciclo_pagamento_plano,
          valor: Number(p.valor || p.valor_plano) || 0,
        }));
        setPlanos(planosFormatados);
      }
    } catch (err) {
      console.error("Erro ao carregar planos:", err);
      Swal.fire({
        icon: "error",
        text: "Não foi possível carregar os planos.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // carregar quando token estiver disponível
    if (token) carregarPlanos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Função para enviar o formulário
  // Formatar o valor com máscara de moeda
  useEffect(() => {
    if (valor) {
      const valueAsNumber = parseFloat(
        valor.replace(/[^\d.,]/g, "").replace(",", ".")
      );
      if (!isNaN(valueAsNumber)) {
        const formattedValue = valueAsNumber.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });
        setValue("valor", formattedValue);
      }
    }
  }, [valor]);

  const onSubmitFunction = async () => {
    try {
      if (!valor || !plano) {
        Swal.fire({
          icon: "error",
          text: "Por favor, preencha todos os campos.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
        });
        return;
      }

      // Converter e validar valor
      let valorNumerico: number;
      if (typeof valor === "string") {
        valorNumerico = parseFloat(
          valor
            .replace(/[^\d.,]/g, "")
            .replace(/\./g, "")
            .replace(",", ".")
        );
      } else {
        valorNumerico = Number(valor as any);
      }

      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        Swal.fire({
          icon: "error",
          text: "Informe um valor válido.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
        });
        return;
      }

      try {
        const base = process.env.NEXT_PUBLIC_API_URL || "";
        const headers: any = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`${base}/precificacao/cadastrar-planos`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            ciclo_pagamento:
              plano === "mensal"
                ? "Mensal"
                : plano === "trimestral"
                ? "Trimestral"
                : "Anual",
            valor: valorNumerico,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw json;

        // Atualizar lista local com dado retornado
        const p = json.plano;
        const novo: Plano = {
          id: p.id_plano || p.id,
          ciclo: p.ciclo_pagamento_plano || p.ciclo,
          valor: Number(p.valor_plano || p.valor) || valorNumerico,
        };
        setPlanos((prev) => [novo, ...prev]);

        Swal.fire({
          icon: "success",
          text: "O plano foi cadastrado com sucesso.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
        });
        limparFormulario();
      } catch (err: any) {
        console.error("Erro ao cadastrar plano (api):", err);
        Swal.fire({
          icon: "error",
          text: err?.message || "Erro ao cadastrar plano",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
        });
      }
    } catch (error) {
      console.error("Erro ao cadastrar plano:", error);
      Swal.fire({
        icon: "error",
        text: "Erro ao cadastrar plano.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-8">
      <div className="w-full max-w-none bg-white p-6 rounded-lg shadow-md sm:p-10">
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <span className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
            Página Inicial
          </span>
          <ChevronRight className="mx-2 h-4 w-4" />
          <span className="font-medium text-primary">
            Configuração de Planos
          </span>
        </div>

        <form
          onSubmit={handleSubmit(onSubmitFunction)}
          {...rest}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InputSelectComponent
              label="ciclo de cobrança"
              name="plano"
              required
              error="Preencha esse campo!"
              formulario={formWithSetValue}
              onChange={(selectedOption: any) => {
                console.log(
                  "Plano selecionado (objeto completo):",
                  selectedOption
                );
                const value = selectedOption ? selectedOption.value : "";
                console.log("Valor extraído do plano:", value);
                setPlano(value);
                setValue("plano", selectedOption); // Passa o objeto completo para o React Hook Form
              }}
              options={opcoesPlano}
              width="w-full"
            />

            <Input
              label="Valor"
              name="valor"
              required
              error="Preencha esse campo!"
              formulario={formWithSetValue}
              value={valor}
              onChange={(e) => {
                // Recebe string, remove caracteres e formata para moeda BRL
                const raw = e.target.value;
                // Remove tudo que não seja dígito
                const digits = raw.replace(/\D/g, "");
                if (!digits) {
                  setValor("");
                  return;
                }
                // Interpretar os dois últimos dígitos como centavos
                const intVal = parseInt(digits, 10);
                const valueNumber = intVal / 100;
                const formatted = valueNumber.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                });
                setValor(formatted);
              }}
              width="w-full"
            />

            <Button
              className="p-2 w-full sm:w-full h-[38px] mt-7 bg-green-600 cursor-pointer hover:bg-green-700 text-white hover:text-white"
              type="submit"
            >
              <Save size={18} className="inline-block mr-2" />
              Salvar
            </Button>
          </div>
        </form>

        <hr className="mt-6 mb-3" />
        <div className="font-bold text-sm mb-5">
          <p>Planos Cadastrados</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="flex w-full sm:w-1/2 items-end">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Buscar.."
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPage(1);
                }}
                className="w-full h-[42px] p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-[#222222] pl-10"
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
            </div>
          </div>
          <div className="flex w-full sm:w-1/2 justify-end">
            <div className="flex flex-wrap gap-2">
              <button
                className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm"
                onClick={() => exportToCSV(planosFiltrados)}
              >
                <FileText size={16} /> CSV
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-green-100 text-green-700 hover:bg-green-200 text-sm"
                onClick={() => exportToExcel(planosFiltrados)}
              >
                <FileSpreadsheet size={16} /> Excel
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-red-100 text-red-700 hover:bg-red-200 text-sm"
                onClick={() => exportToPDF(planosFiltrados)}
              >
                <FileDown size={16} /> PDF
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
                onClick={() => copyTable(planosFiltrados)}
              >
                <Copy size={16} /> Copiar
              </button>
            </div>
          </div>
        </div>

        {/* Tabela - Com alinhamento corrigido e colunas removidas */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* Coluna de ações com largura fixa */}
                <th className="w-24 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
                {/* Coluna de ciclo com largura adequada */}
                <th className="w-64 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ciclo de Pagamento
                </th>
                {/* Coluna de valor com largura fixa */}
                <th className="w-36 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-6 text-gray-400">
                    Nenhum plano encontrado.
                  </td>
                </tr>
              ) : (
                <>
                  {pageItems.map((plano) => (
                    <tr key={plano.id} className="hover:bg-gray-50">
                      {/* Célula de ações com largura fixa correspondente */}
                      <td className="w-24 px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center justify-start">
                          {/* Botão Editar */}
                          <button
                            title="Editar"
                            className="p-2 rounded cursor-pointer hover:bg-gray-100 text-green-600"
                            onClick={async () => {
                              // Abrir prompt para editar valor
                              const currentFormatted =
                                plano.valor.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                });
                              const { value: novoValorRaw, isConfirmed } =
                                await Swal.fire({
                                  title: "Editar valor do plano",
                                  input: "text",
                                  inputValue: currentFormatted,
                                  inputLabel: "Informe o novo valor (R$):",
                                  showCancelButton: true,
                                  confirmButtonText: "Salvar",
                                  cancelButtonText: "Cancelar",
                                  inputValidator: (value) => {
                                    if (!value)
                                      return "Informe um valor válido";
                                    // permitir R$ e formatos com , ou .
                                    const normalized = String(value)
                                      .replace(/[^0-9,.-]/g, "")
                                      .replace(/\./g, "")
                                      .replace(",", ".");
                                    if (
                                      isNaN(Number(normalized)) ||
                                      Number(normalized) <= 0
                                    )
                                      return "Valor inválido";
                                    return null;
                                  },
                                });

                              if (!isConfirmed) return;

                              // Normalizar novo valor para número (aceita R$ 1.234,56 ou 1234.56)
                              const normalized = String(novoValorRaw)
                                .replace(/[^0-9,.-]/g, "")
                                .replace(/\./g, "")
                                .replace(",", ".");
                              const novoValor = parseFloat(normalized);
                              if (isNaN(novoValor)) {
                                Swal.fire({
                                  icon: "error",
                                  title: "Valor inválido",
                                });
                                return;
                              }

                              // Chamar API para atualizar
                              try {
                                const base =
                                  process.env.NEXT_PUBLIC_API_URL || "";
                                const headers: any = {
                                  "Content-Type": "application/json",
                                };
                                if (token)
                                  headers["Authorization"] = `Bearer ${token}`;
                                const res = await fetch(
                                  `${base}/precificacao/atualizar-plano`,
                                  {
                                    method: "PUT",
                                    headers,
                                    body: JSON.stringify({
                                      id_plano: plano.id,
                                      valor_plano: novoValor,
                                    }),
                                  }
                                );
                                const json = await res.json().catch(() => ({}));
                                if (!res.ok) throw json;

                                // Atualizar estado local
                                setPlanos((prev) =>
                                  prev.map((p) =>
                                    p.id === plano.id
                                      ? { ...p, valor: novoValor }
                                      : p
                                  )
                                );

                                Swal.fire({
                                  icon: "success",
                                  text: "Plano atualizado com sucesso.",
                                  toast: true,
                                  position: "top-end",
                                  showConfirmButton: false,
                                  timer: 2000,
                                });
                              } catch (err: any) {
                                console.error("Erro ao atualizar plano:", err);
                                Swal.fire({
                                  icon: "error",
                                  text:
                                    err?.message || "Erro ao atualizar plano",
                                });
                              }
                            }}
                          >
                            <Pencil size={18} />
                          </button>
                        </div>
                      </td>

                      {/* Célula de ciclo com largura fixa correspondente */}
                      <td className="w-64 px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 mr-2">
                            <Coins size={18} className="text-blue-600" />
                          </span>
                          <span>{plano.ciclo}</span>
                        </div>
                      </td>

                      {/* Célula de valor com largura fixa correspondente */}
                      <td className="w-36 px-4 py-2 whitespace-nowrap font-medium">
                        {plano.valor.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
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
              <ChevronRight className="transform rotate-180 h-4 w-4" />
            </button>
            <button
              className="px-3 py-1 border rounded cursor-pointer bg-blue-100"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronLeft className="transform rotate-180 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracaoPlanos;
