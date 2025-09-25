"use client";

import Button from "@/components/Forms/Button";
import Input from "@/components/Forms/Input";
import InputSelectComponent from "@/components/Forms/InputSelect";
import { useAuth } from "@/contexts/AuthContext";
import { GetForm } from "@/utils";
import {
  ChevronLeft,
  ChevronRight,
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

// Interface para dados bancários
interface DadoBancario {
  id: number;
  banco: string;
  agencia: string;
  conta: string;
  tipo_conta: string;
  cpf_cnpj: string;
  titular: string;
}

// Funções auxiliares para exportação
const exportToCSV = (data: DadoBancario[]) => {
  const header = [
    "ID",
    "Banco",
    "Agência",
    "Conta",
    "Tipo de Conta",
    "CNPJ",
    "Titular",
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

const exportToExcel = (data: DadoBancario[]) => {
  // Reutiliza CSV (compatível com Excel)
  exportToCSV(data);
};

const exportToPDF = (data: DadoBancario[]) => {
  const header = `<tr>
    <th style="padding:6px;border:1px solid #ddd;">ID</th>
    <th style="padding:6px;border:1px solid #ddd;">Banco</th>
    <th style="padding:6px;border:1px solid #ddd;">Agência</th>
    <th style="padding:6px;border:1px solid #ddd;">Conta</th>
    <th style="padding:6px;border:1px solid #ddd;">Tipo de Conta</th>
    <th style="padding:6px;border:1px solid #ddd;">CNPJ</th>
    <th style="padding:6px;border:1px solid #ddd;">Titular</th>
  </tr>`;

  const rows = data
    .map(
      (d) => `<tr>
      <td style="padding:6px;border:1px solid #ddd;">${d.id}</td>
      <td style="padding:6px;border:1px solid #ddd;">${d.banco}</td>
      <td style="padding:6px;border:1px solid #ddd;">${d.agencia}</td>
      <td style="padding:6px;border:1px solid #ddd;">${d.conta}</td>
      <td style="padding:6px;border:1px solid #ddd;">${
        d.tipo_conta === "corrente" ? "Conta Corrente" : "Conta Poupança"
      }</td>
      <td style="padding:6px;border:1px solid #ddd;">${d.cpf_cnpj.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        "$1.$2.$3/$4-$5"
      )}</td>
      <td style="padding:6px;border:1px solid #ddd;">${d.titular}</td>
    </tr>`
    )
    .join("");

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(`
    <html>
      <head><title>Dados Bancários</title></head>
      <body>
        <h3>Dados Bancários</h3>
        <table style="border-collapse:collapse;width:100%">${header}${rows}</table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
};

const copyTable = (data: DadoBancario[]) => {
  const header = [
    "ID",
    "Banco",
    "Agência",
    "Conta",
    "Tipo de Conta",
    "CNPJ",
    "Titular",
  ];
  const rows = data.map((d) => [
    d.id,
    d.banco,
    d.agencia,
    d.conta,
    d.tipo_conta === "corrente" ? "Conta Corrente" : "Conta Poupança",
    d.cpf_cnpj.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5"
    ),
    d.titular,
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

const DadosBancarios = ({ ...rest }: any) => {
  // Estados para formulário
  const [banco, setBanco] = useState("");
  const [agencia, setAgencia] = useState("");
  const [conta, setConta] = useState("");
  const [tipoConta, setTipoConta] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [titular, setTitular] = useState("");

  // Estados para tabela e paginação
  const [dadosBancarios, setDadosBancarios] = useState<DadoBancario[]>([]);
  const [busca, setBusca] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const { token } = useAuth();

  // Máscaras
  function maskAgencia(value: string) {
    return value.replace(/\D/g, "").slice(0, 4);
  }

  function maskConta(value: string) {
    return value.replace(/\D/g, "").slice(0, 10);
  }

  function maskCnpj(value: string) {
    value = value.replace(/\D/g, "").slice(0, 14);
    // CNPJ: 00.000.000/0000-00
    return value
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  }

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
  });

  const { handleSubmit, ...form } = GetForm(schema);

  // Helper para requisições autenticadas
  const fetchWithAuth = async (path: string, options: RequestInit = {}) => {
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    const headers: any = options.headers ? { ...options.headers } : {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${base}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw data || new Error("Erro na requisição");
    return data;
  };

  // Buscar dados bancários cadastrados
  const carregarDadosBancarios = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await fetchWithAuth(
        "/dadosBancarios/buscar-dados-bancarios"
      );

      if (data) {
        // Se for um único objeto, transformamos em array
        const dados = Array.isArray(data)
          ? data
          : [data].filter((item) => item !== null);

        // Mapeamos para garantir o formato correto
        const dadosFormatados = dados.map((d: any) => ({
          id: d.id_dados_bancarios || 1,
          banco: d.banco || "",
          agencia: d.agencia || "",
          conta: d.conta || "",
          tipo_conta: d.tipo_conta || "",
          cpf_cnpj: d.cpf_cnpj || "",
          titular: d.titular || "",
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

  // Carregar dados ao iniciar
  useEffect(() => {
    if (token) carregarDadosBancarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Limpar formulário
  const limparFormulario = () => {
    setBanco("");
    setAgencia("");
    setConta("");
    setTipoConta("");
    setCpfCnpj("");
    setTitular("");
  };

  // Filtrar dados por busca
  const dadosFiltrados = dadosBancarios.filter(
    (dado) =>
      dado.banco.toLowerCase().includes(busca.toLowerCase()) ||
      dado.agencia.includes(busca) ||
      dado.conta.includes(busca) ||
      dado.cpf_cnpj.includes(busca) ||
      dado.titular.toLowerCase().includes(busca.toLowerCase())
  );

  // Paginação
  const itemsPerPage = 10;
  const totalPages = Math.max(
    1,
    Math.ceil(dadosFiltrados.length / itemsPerPage)
  );
  const pageItems = dadosFiltrados.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Opções para os selects
  const opcoesBanco = [
    { value: "Banco do Brasil", label: "Banco do Brasil" },
    { value: "EFÍ Bank", label: "EFÍ Bank" },
    { value: "Bradesco", label: "Bradesco" },
    { value: "Caixa Econômica Federal", label: "Caixa Econômica Federal" },
    { value: "Itaú", label: "Itaú" },
    { value: "Santander", label: "Santander" },
  ];

  const opcoesTipoConta = [
    { value: "corrente", label: "Conta Corrente" },
    { value: "poupanca", label: "Conta Poupança" },
  ];

  // Função para enviar o formulário
  const onSubmitFunction = async (values: any) => {
    const dados = {
      banco: values.banco,
      agencia: values.agencia,
      conta: values.conta,
      tipo_conta: values.tipoConta,
      cpf_cnpj: cpfCnpj.replace(/\D/g, ""),
      titular: values.titular,
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

        // Recarregar dados e limpar formulário
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

  console.log(banco);
  return (
    <div className="p-4 max-w-7xl mx-auto space-y-8">
      <div className="w-full max-w-none bg-white p-6 rounded-lg shadow-md sm:p-10">
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <span className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
            Configurações
          </span>
          <ChevronRight className="mx-2 h-4 w-4" />
          <span className="font-medium text-primary">Dados Bancários</span>
        </div>

        <form
          onSubmit={handleSubmit(onSubmitFunction)}
          {...rest}
          className="space-y-4"
        >
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

          <div className="grid grid-cols-1 sm:flex sm:justify-end sm:space-x-4 gap-2 sm:pt-4">
            <Button
              className="p-2 w-full sm:w-[150px] bg-green-600 cursor-pointer hover:bg-green-700 text-white hover:text-white"
              type="submit"
            >
              <Save size={18} className="inline-block mr-2" />
              Salvar
            </Button>
          </div>
        </form>

        <hr className="mt-6 mb-3" />
        <div className="font-bold text-sm mb-5">
          <p>Dados Bancários Cadastrados</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="flex w-full sm:w-1/2 items-end">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Buscar..."
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
                onClick={() => exportToCSV(dadosFiltrados)}
              >
                <FileText size={16} /> CSV
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-green-100 text-green-700 hover:bg-green-200 text-sm"
                onClick={() => exportToExcel(dadosFiltrados)}
              >
                <FileSpreadsheet size={16} /> Excel
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-red-100 text-red-700 hover:bg-red-200 text-sm"
                onClick={() => exportToPDF(dadosFiltrados)}
              >
                <FileDown size={16} /> PDF
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
                onClick={() => copyTable(dadosFiltrados)}
              >
                <Copy size={16} /> Copiar
              </button>
            </div>
          </div>
        </div>

        {/* Tabela de Dados Bancários */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-24 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Banco
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agência
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conta
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CNPJ
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Titular
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-400">
                    Carregando dados bancários...
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-400">
                    {busca
                      ? "Nenhum dado bancário encontrado com o filtro aplicado."
                      : "Nenhum dado bancário cadastrado."}
                  </td>
                </tr>
              ) : (
                <>
                  {pageItems.map((dado) => (
                    <tr key={dado.id} className="hover:bg-gray-50">
                      <td className="w-24 px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center justify-start">
                          <button
                            title="Editar"
                            className="p-2 rounded cursor-pointer hover:bg-gray-100 text-green-600"
                            onClick={() => {
                              // Preencher o formulário com os dados para edição
                              setBanco(dado.banco);
                              setAgencia(dado.agencia);
                              setConta(dado.conta);
                              setTipoConta(dado.tipo_conta);
                              setCpfCnpj(dado.cpf_cnpj);
                              setTitular(dado.titular);

                              // Importante: Atualize também o React Hook Form
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

                              // Rolar para o topo do formulário
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                          >
                            <Pencil size={18} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {dado.banco}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {dado.agencia}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {dado.conta}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {dado.tipo_conta === "corrente"
                          ? "Conta Corrente"
                          : "Conta Poupança"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {dado.cpf_cnpj.replace(
                          /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
                          "$1.$2.$3/$4-$5"
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {dado.titular}
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {dadosFiltrados.length > itemsPerPage && (
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
        )}
      </div>
    </div>
  );
};

export default DadosBancarios;
