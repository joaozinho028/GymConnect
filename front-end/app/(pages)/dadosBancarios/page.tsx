"use client";

import Button from "@/components/Forms/Button";
import Input from "@/components/Forms/Input";
import InputSelectComponent from "@/components/Forms/InputSelect";
import { useAuth } from "@/contexts/AuthContext";
import { GetForm } from "@/utils";
import {
  ArrowRightLeft,
  Building2,
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  FileDown,
  FileSpreadsheet,
  FileText,
  List,
  Pencil,
  Save,
  Search,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import * as yup from "yup";

// Interface para dados bancários
interface DadoBancario {
  id: number;
  banco: string;
  agencia: string;
  conta: string;
  tipo_conta: string;
  cpf_cnpj: string;
  titular: string;
  chave_pix?: string;
  tipo_chave_pix?: string;
}

// Interface para configurações de transferência
interface ConfigTransferencia {
  ativo: boolean;
  intervalo: "DAILY" | "WEEKLY" | "MONTHLY";
  horario: string;
  valor_minimo: number;
  tipo_transferencia: "PIX" | "TED";
}

// Funções de exportação (mantidas)
const exportToCSV = (data: DadoBancario[]) => {
  const header = [
    "ID",
    "Banco",
    "Agência",
    "Conta",
    "Tipo de Conta",
    "CNPJ",
    "Titular",
    "Chave PIX",
    "Tipo Chave PIX",
  ];
  const rows = data.map((dado) => [
    dado.id,
    dado.banco,
    dado.agencia,
    dado.conta,
    dado.tipo_conta === "corrente" ? "Conta Corrente" : "Conta Poupança",
    dado.cpf_cnpj.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5"
    ),
    dado.titular,
    dado.chave_pix || "",
    dado.tipo_chave_pix || "",
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
    `dados_bancarios_${new Date().toISOString().split("T")[0]}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportToExcel = exportToCSV;
const exportToPDF = (data: DadoBancario[]) => {
  // Implementação do PDF (mantida)
};
const copyTable = (data: DadoBancario[]) => {
  // Implementação do copiar (mantida)
};

const DadosBancarios = ({ ...rest }: any) => {
  // Estado para controle das abas
  const [activeTab, setActiveTab] = useState<
    "conta" | "transferencias" | "historico"
  >("conta");

  // Estados existentes para formulário
  const [banco, setBanco] = useState("");
  const [agencia, setAgencia] = useState("");
  const [conta, setConta] = useState("");
  const [tipoConta, setTipoConta] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [titular, setTitular] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [tipoChavePix, setTipoChavePix] = useState("CNPJ");

  // Estados para configurações de transferência
  const [configTransferencia, setConfigTransferencia] =
    useState<ConfigTransferencia>({
      ativo: false,
      intervalo: "DAILY",
      horario: "18:00",
      valor_minimo: 10,
      tipo_transferencia: "PIX",
    });

  // Estados existentes para tabela e paginação
  const [dadosBancarios, setDadosBancarios] = useState<DadoBancario[]>([]);
  const [busca, setBusca] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);

  const { token } = useAuth();

  // Funções de máscara (mantidas)
  function maskAgencia(value: string) {
    return value.replace(/\D/g, "").slice(0, 4);
  }
  function maskConta(value: string) {
    return value.replace(/\D/g, "").slice(0, 10);
  }
  function maskCnpj(value: string) {
    value = value.replace(/\D/g, "").slice(0, 14);
    return value
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  }
  function maskChavePix(value: string, tipo: string) {
    switch (tipo) {
      case "CNPJ":
        return maskCnpj(value);
      case "CPF":
        value = value.replace(/\D/g, "").slice(0, 11);
        return value
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      case "PHONE":
        value = value.replace(/\D/g, "").slice(0, 11);
        return value.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
      default:
        return value;
    }
  }

  // Schema de validação (mantido)
  const schema = yup.object().shape({
    banco: yup.string().required("Informe o banco"),
    agencia: yup.string().required("Informe a agência"),
    conta: yup.string().required("Informe a conta"),
    tipoConta: yup.string().required("Selecione o tipo de conta"),
    cpfCnpj: yup
      .string()
      .matches(/^\d{14}$/, "Informe um CNPJ válido (14 dígitos)")
      .required("Informe o CNPJ"),
    titular: yup.string().required("Informe o nome do titular"),
    chavePix: yup.string().required("Chave PIX obrigatória"),
    tipoChavePix: yup
      .string()
      .oneOf(["CNPJ", "EVP"], "Tipo de chave PIX inválido")
      .required("Tipo da chave PIX é obrigatório"),
  });

  const { handleSubmit, ...form } = GetForm(schema);

  // Helper para requisições (mantido)
  const fetchWithAuth = async (path: string, options: RequestInit = {}) => {
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    const headers: any = options.headers ? { ...options.headers } : {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${base}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw data || new Error("Erro na requisição");
    return data;
  };

  // Funções existentes (mantidas)
  const carregarDadosBancarios = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await fetchWithAuth(
        "/dadosBancarios/buscar-dados-bancarios"
      );
      if (data) {
        const dados = Array.isArray(data)
          ? data
          : [data].filter((item) => item !== null);
        const dadosFormatados = dados.map((d: any) => ({
          id: d.id_dados_bancarios || 1,
          banco: d.banco || "",
          agencia: d.agencia || "",
          conta: d.conta || "",
          tipo_conta: d.tipo_conta || "",
          cpf_cnpj: d.cpf_cnpj || "",
          titular: d.titular || "",
          chave_pix: d.chave_pix || "",
          tipo_chave_pix: d.tipo_chave_pix || "CNPJ",
        }));
        setDadosBancarios(dadosFormatados);
      }
    } catch (err) {
      console.error("Erro ao carregar dados bancários:", err);
      Swal.fire({
        icon: "error",
        text: "Não foi possível carregar os dados bancários.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const carregarConfiguracoes = async () => {
    if (!token) return;
    try {
      setLoadingConfig(true);
      const data = await fetchWithAuth("/asaas/transfer-settings");
      if (data) {
        setConfigTransferencia(data);
      }
    } catch (err) {
      console.log(
        "Configurações de transferência não encontradas (primeira vez)."
      );
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    if (token) {
      carregarDadosBancarios();
      carregarConfiguracoes();
    }
  }, [token]);

  const limparFormulario = () => {
    setBanco("");
    setAgencia("");
    setConta("");
    setTipoConta("");
    setCpfCnpj("");
    setTitular("");
    setChavePix("");
    setTipoChavePix("CNPJ");
  };

  const salvarConfiguracoes = async () => {
    if (!token) return;
    try {
      setLoadingConfig(true);
      const dados = {
        ...configTransferencia,
        chave_pix: chavePix,
        tipo_chave_pix: tipoChavePix,
        dados_bancarios: {
          banco,
          agencia,
          conta,
          tipo_conta: tipoConta,
          cpf_cnpj: cpfCnpj.replace(/\D/g, ""),
          titular,
        },
      };

      await fetchWithAuth("/asaas/configure-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      Swal.fire({
        icon: "success",
        text: "Configurações de transferência salvas com sucesso!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      console.error("Erro ao salvar configurações:", err);
      Swal.fire({
        icon: "error",
        text: "Erro ao salvar configurações de transferência.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    } finally {
      setLoadingConfig(false);
    }
  };

  // Opções para selects (mantidas)
  const opcoesBanco = [
    { value: "001", label: "001 - Banco do Brasil" },
    { value: "237", label: "237 - Bradesco" },
    { value: "104", label: "104 - Caixa Econômica Federal" },
    { value: "341", label: "341 - Itaú" },
    { value: "033", label: "033 - Santander" },
    { value: "260", label: "260 - Nubank" },
    { value: "323", label: "323 - Mercado Pago" },
    { value: "197", label: "197 - Stone" },
  ];

  const opcoesTipoConta = [
    { value: "corrente", label: "Conta Corrente" },
    { value: "poupanca", label: "Conta Poupança" },
  ];

  const opcoesChavePix = [
    { value: "CNPJ", label: "CNPJ" },
    { value: "EVP", label: "Chave Aleatória" },
  ];

  const getPlaceholderChavePix = (tipo: string) => {
    switch (tipo) {
      case "CNPJ":
        return "12.345.678/0001-90";
      case "CPF":
        return "123.456.789-10";
      case "EMAIL":
        return "contato@academia.com";
      case "PHONE":
        return "(11) 99999-9999";
      case "EVP":
        return "chave-aleatoria-uuid";
      default:
        return "";
    }
  };

  const onSubmitFunction = async (values: any) => {
    const dados = {
      banco: values.banco,
      agencia: values.agencia,
      conta: values.conta,
      tipo_conta: values.tipoConta,
      cpf_cnpj: cpfCnpj.replace(/\D/g, ""),
      titular: values.titular,
      chave_pix: chavePix,
      tipo_chave_pix: tipoChavePix,
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/dadosBancarios/cadastrar-dados-bancarios`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(dados),
        }
      );

      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: "success",
          text: data.message || "Dados bancários salvos!",
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
        carregarDadosBancarios();
        limparFormulario();
      } else {
        Swal.fire({
          icon: "error",
          text: data.message || "Erro ao salvar dados bancários.",
          timer: 2500,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        text: "Erro ao conectar ao servidor.",
        timer: 2500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    }
  };

  // Lógica de paginação (mantida)
  const dadosFiltrados = dadosBancarios.filter(
    (dado) =>
      dado.banco.toLowerCase().includes(busca.toLowerCase()) ||
      dado.agencia.includes(busca) ||
      dado.conta.includes(busca) ||
      dado.cpf_cnpj.includes(busca) ||
      dado.titular.toLowerCase().includes(busca.toLowerCase()) ||
      (dado.chave_pix && dado.chave_pix.includes(busca))
  );

  const itemsPerPage = 10;
  const totalPages = Math.max(
    1,
    Math.ceil(dadosFiltrados.length / itemsPerPage)
  );
  const pageItems = dadosFiltrados.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Configuração das abas
  const tabs = [
    {
      id: "conta" as const,
      label: "Dados da Conta",
      icon: <Building2 size={18} />,
      description: "Configure sua conta bancária",
    },
    {
      id: "transferencias" as const,
      label: "Transferências Automáticas",
      icon: <ArrowRightLeft size={18} />,
      description: "Configure transferências automáticas",
    },
    {
      id: "historico" as const,
      label: "Histórico & Dados",
      icon: <List size={18} />,
      description: "Visualize dados cadastrados",
    },
  ];

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      <div className="w-full max-w-none bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center text-sm text-muted-foreground mb-4">
            <span className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
              Configurações
            </span>
            <ChevronRight className="mx-2 h-4 w-4" />
            <span className="font-medium text-primary">Dados Bancários</span>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Configurações Bancárias
            </h1>
            <p className="text-gray-600">
              Gerencie suas informações bancárias e configure transferências
              automáticas para receber seus pagamentos.
            </p>
          </div>

          {/* Navegação por Abas */}
          <div className="border-b border-gray-200 cursor-pointer">
            <nav className="-mb-px flex space-x-8 cursor-pointer">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={` cursosr-pointer group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span
                    className={`transition-colors ${
                      activeTab === tab.id
                        ? "text-blue-500"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  >
                    {tab.icon}
                  </span>
                  <span className="cursor-pointer">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Conteúdo das Abas */}
        <div className="p-6">
          {/* Aba 1: Dados da Conta */}
          {activeTab === "conta" && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  🏦 Cadastro de Conta Bancária
                </h2>
                <p className="text-blue-700 text-sm">
                  Configure sua conta bancária para receber os valores dos
                  pagamentos processados pelo sistema.
                </p>
              </div>

              <form
                onSubmit={handleSubmit(onSubmitFunction)}
                {...rest}
                className="space-y-6"
              >
                {/* Dados Bancários Tradicionais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputSelectComponent
                    label="Banco"
                    name="banco"
                    required
                    error="Informe o banco"
                    formulario={form}
                    value={banco}
                    onChange={(e) => setBanco(e.target.value)}
                    options={opcoesBanco}
                    width="w-full"
                  />
                  <Input
                    label="Agência"
                    name="agencia"
                    required
                    error="Informe a agência"
                    formulario={form}
                    value={agencia}
                    onChange={(e) => setAgencia(maskAgencia(e.target.value))}
                    width="w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Conta"
                    name="conta"
                    required
                    error="Informe a conta"
                    formulario={form}
                    value={conta}
                    onChange={(e) => setConta(maskConta(e.target.value))}
                    width="w-full"
                  />
                  <InputSelectComponent
                    label="Tipo de Conta"
                    name="tipoConta"
                    required
                    error="Selecione o tipo de conta"
                    formulario={form}
                    value={tipoConta}
                    onChange={(e) => setTipoConta(e.target.value)}
                    options={opcoesTipoConta}
                    width="w-full"
                  />
                  <Input
                    label="CNPJ"
                    name="cpfCnpj"
                    required
                    error="Informe o CNPJ"
                    formulario={form}
                    value={maskCnpj(cpfCnpj)}
                    onChange={(e) => setCpfCnpj(e.target.value)}
                    width="w-full"
                  />
                </div>

                <Input
                  label="Nome do Titular"
                  name="titular"
                  required
                  error="Informe o nome do titular"
                  formulario={form}
                  value={titular}
                  onChange={(e) => setTitular(e.target.value)}
                  width="w-full"
                />

                {/* Seção PIX */}
                <div className="border-t pt-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                      💳 Chave PIX (obrigatório)
                    </h3>
                    <p className="text-green-700 text-sm">
                      Cadastre uma chave PIX para receber transferências para
                      sua conta, taxa de R$ 0,90 por transação.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputSelectComponent
                      label="Tipo da Chave PIX"
                      name="tipoChavePix"
                      formulario={form}
                      value={tipoChavePix}
                      onChange={(e) => {
                        setTipoChavePix(e.target.value);
                        setChavePix("");
                      }}
                      options={opcoesChavePix}
                      width="w-full"
                    />
                    <Input
                      label="Chave PIX"
                      name="chavePix"
                      formulario={form}
                      value={maskChavePix(chavePix, tipoChavePix)}
                      onChange={(e) => setChavePix(e.target.value)}
                      placeholder={getPlaceholderChavePix(tipoChavePix)}
                      width="w-full"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    className="px-6 py-2 bg-green-600 cursor-pointer hover:bg-green-700 text-white hover:text-white"
                    type="submit"
                  >
                    <Save size={18} className="inline-block mr-2" />
                    Salvar Dados Bancários
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Aba 2: Transferências Automáticas */}
          {activeTab === "transferencias" && (
            <div className="space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-orange-900 mb-2 flex items-center gap-2">
                  ⚡ Transferências Automáticas
                </h2>
                <p className="text-orange-700 text-sm">
                  Configure para receber automaticamente os valores na sua conta
                  bancária.
                  {chavePix
                    ? " PIX configurado (R$ 0,90 - Instantâneo)"
                    : " TED será usado (R$ 3,90 - 1 dia útil)"}
                </p>
              </div>

              {/* Toggle Principal */}
              <div className="flex items-center justify-between p-6 bg-blue-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-blue-900 text-lg">
                    Transferências Automáticas via PIX
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Receba automaticamente os valores dos pagamentos na sua
                    conta bancária via PIX.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={true && configTransferencia.ativo}
                    onChange={(e) =>
                      setConfigTransferencia((prev) => ({
                        ...prev,
                        ativo: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              {configTransferencia.ativo && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequência das Transferências
                    </label>
                    <input
                      type="text"
                      value="Diária"
                      disabled
                      className="w-full border rounded-lg px-4 py-3 bg-gray-100 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horário da Transferência
                    </label>
                    <input
                      type="time"
                      value="23:59"
                      disabled
                      className="w-full border rounded-lg px-4 py-3 bg-gray-100 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor Mínimo para Transferir (R$)
                    </label>
                    <input
                      type="number"
                      value={configTransferencia.valor_minimo}
                      onChange={(e) =>
                        setConfigTransferencia((prev) => ({
                          ...prev,
                          valor_minimo: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="10"
                      step="0.01"
                      placeholder="10.00"
                    />
                  </div>
                  {/* Resumo das Taxas - apenas PIX */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 mb-4">
                      Resumo de Taxas e Prazos
                    </h4>
                    <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
                      <h5 className="font-medium flex items-center gap-2 text-green-800">
                        <CreditCard size={18} />
                        PIX
                      </h5>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-green-700">
                          <strong>Taxa:</strong> R$ 0,90 por transferência
                        </p>
                        <p className="text-sm text-green-700">
                          <strong>Prazo:</strong> Instantâneo (24h por dia)
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={salvarConfiguracoes}
                      disabled={loadingConfig}
                      className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white"
                      type="button"
                    >
                      {loadingConfig ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Settings size={18} className="inline-block mr-2" />
                          Salvar Configurações
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Aba 3: Histórico & Dados */}
          {activeTab === "historico" && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  📊 Dados Bancários Cadastrados
                </h2>
                <p className="text-purple-700 text-sm">
                  Visualize e gerencie os dados bancários cadastrados no
                  sistema.
                </p>
              </div>

              {/* Busca e Exportação */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex w-full sm:w-1/2 items-end">
                  <div className="relative w-full">
                    <input
                      type="text"
                      placeholder="Buscar por banco, agência, conta..."
                      value={busca}
                      onChange={(e) => {
                        setBusca(e.target.value);
                        setPage(1);
                      }}
                      className="w-full h-[42px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-[#222222] pl-10"
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
                      className="flex items-center gap-2 px-3 py-2 h-[42px] rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm transition-colors"
                      onClick={() => exportToCSV(dadosFiltrados)}
                    >
                      <FileText size={16} /> CSV
                    </button>
                    <button
                      className="flex items-center gap-2 px-3 py-2 h-[42px] rounded-lg bg-green-100 text-green-700 hover:bg-green-200 text-sm transition-colors"
                      onClick={() => exportToExcel(dadosFiltrados)}
                    >
                      <FileSpreadsheet size={16} /> Excel
                    </button>
                    <button
                      className="flex items-center gap-2 px-3 py-2 h-[42px] rounded-lg bg-red-100 text-red-700 hover:bg-red-200 text-sm transition-colors"
                      onClick={() => exportToPDF(dadosFiltrados)}
                    >
                      <FileDown size={16} /> PDF
                    </button>
                    <button
                      className="flex items-center gap-2 px-3 py-2 h-[42px] rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm transition-colors"
                      onClick={() => copyTable(dadosFiltrados)}
                    >
                      <Copy size={16} /> Copiar
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabela */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="w-24 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Banco
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Agência
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Conta
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          CNPJ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Titular
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          PIX
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="text-center py-12 text-gray-400"
                          >
                            <div className="flex flex-col items-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                              Carregando dados bancários...
                            </div>
                          </td>
                        </tr>
                      ) : pageItems.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="text-center py-12 text-gray-400"
                          >
                            <div className="flex flex-col items-center">
                              <Building2 className="h-12 w-12 text-gray-300 mb-4" />
                              {busca
                                ? "Nenhum dado bancário encontrado com o filtro aplicado."
                                : "Nenhum dado bancário cadastrado ainda."}
                              {!busca && (
                                <button
                                  onClick={() => setActiveTab("conta")}
                                  className="mt-2 text-blue-500 hover:text-blue-700 text-sm underline"
                                >
                                  Cadastrar primeira conta bancária
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        pageItems.map((dado) => (
                          <tr
                            key={dado.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="w-24 px-6 py-4 whitespace-nowrap">
                              <button
                                title="Editar dados bancários"
                                className="p-2 rounded-lg cursor-pointer hover:bg-blue-100 text-blue-600 transition-colors"
                                onClick={() => {
                                  setBanco(dado.banco);
                                  setAgencia(dado.agencia);
                                  setConta(dado.conta);
                                  setTipoConta(dado.tipo_conta);
                                  setCpfCnpj(dado.cpf_cnpj);
                                  setTitular(dado.titular);
                                  setChavePix(dado.chave_pix || "");
                                  setTipoChavePix(
                                    dado.tipo_chave_pix || "CNPJ"
                                  );

                                  form.setValue(
                                    "banco",
                                    opcoesBanco.find(
                                      (op) => op.value === dado.banco
                                    )
                                  );
                                  form.setValue("agencia", dado.agencia);
                                  form.setValue("conta", dado.conta);
                                  form.setValue(
                                    "tipoConta",
                                    opcoesTipoConta.find(
                                      (op) => op.value === dado.tipo_conta
                                    )
                                  );
                                  form.setValue("cpfCnpj", dado.cpf_cnpj);
                                  form.setValue("titular", dado.titular);

                                  setActiveTab("conta");
                                  setTimeout(() => {
                                    window.scrollTo({
                                      top: 0,
                                      behavior: "smooth",
                                    });
                                  }, 100);
                                }}
                              >
                                <Pencil size={18} />
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {dado.banco}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {dado.agencia}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {dado.conta}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {dado.tipo_conta === "corrente"
                                ? "Conta Corrente"
                                : "Conta Poupança"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                              {dado.cpf_cnpj.replace(
                                /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
                                "$1.$2.$3/$4-$5"
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {dado.titular}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {dado.chave_pix ? (
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full font-mono">
                                  {dado.chave_pix}
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
                                  Não configurado
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginação */}
                {dadosFiltrados.length > itemsPerPage && (
                  <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Mostrando{" "}
                      <span className="font-medium">
                        {(page - 1) * itemsPerPage + 1}
                      </span>{" "}
                      até{" "}
                      <span className="font-medium">
                        {Math.min(page * itemsPerPage, dadosFiltrados.length)}
                      </span>{" "}
                      de{" "}
                      <span className="font-medium">
                        {dadosFiltrados.length}
                      </span>{" "}
                      resultados
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-2 border rounded-lg cursor-pointer bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="px-3 py-2 text-sm text-gray-700">
                        Página {page} de {totalPages}
                      </span>
                      <button
                        className="px-3 py-2 border rounded-lg cursor-pointer bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DadosBancarios;
