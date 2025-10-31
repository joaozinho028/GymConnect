"use client";
import ModalComponente from "@/components/Modal/ModalComponent";
import { useAuth } from "@/contexts/AuthContext";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  FileDown,
  FileSpreadsheet,
  FileText,
  Pencil,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import HistoricoAluno from "../historicoAluno/page";
import ImportarAlunos from "../importarAlunos/page";
import EditarCadastroAluno from "./FormEditAluno";

function exportToCSV(data: any[], filiais: any[]) {
  const getNomeFilial = (id_filial: number) => {
    const filial = filiais.find((f) => f.id_filial === id_filial);
    return filial?.nome_filial || "N/A";
  };

  const header = [
    "Aluno",
    "Data de Cadastro",
    "Matrícula",
    "CPF",
    "Filial",
    "Situação",
    "Status",
  ];
  const rows = data.map((aluno) => [
    aluno.nome_aluno,
    aluno.data_cadastro
      ? new Date(aluno.data_cadastro).toLocaleDateString("pt-BR")
      : "N/A",
    aluno.matricula_aluno,
    aluno.cpf_aluno,
    getNomeFilial(aluno.id_filial),
    aluno.situacao === "regular"
      ? "Regular"
      : aluno.situacao === "aguardando pagamento"
      ? "Aguardando Pagamento"
      : aluno.situacao || "N/A",
    aluno.status_aluno ? "Ativo" : "Inativo",
  ]);
  const csvContent = [header, ...rows]
    .map((e) => e.map((v) => `"${v}"`).join(","))
    .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "alunos.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportToExcel(data: any[], filiais: any[]) {
  // Gera um arquivo Excel simples (XLSX real precisa de libs como SheetJS)
  exportToCSV(data, filiais); // Para simplificação, exporta como CSV
}

function exportToPDF(data: any[], filiais: any[]) {
  const getNomeFilial = (id_filial: number) => {
    const filial = filiais.find((f) => f.id_filial === id_filial);
    return filial?.nome_filial || "N/A";
  };

  // Exportação simples para PDF usando window.print()
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  const header = `
    <tr>
      <th style="padding:4px;border:1px solid #ccc;">Aluno</th>
      <th style="padding:4px;border:1px solid #ccc;">Data de Cadastro</th>
      <th style="padding:4px;border:1px solid #ccc;">Matrícula</th>
      <th style="padding:4px;border:1px solid #ccc;">CPF</th>
      <th style="padding:4px;border:1px solid #ccc;">Filial</th>
      <th style="padding:4px;border:1px solid #ccc;">Situação</th>
      <th style="padding:4px;border:1px solid #ccc;">Status</th>
    </tr>
  `;
  const rows = data
    .map(
      (aluno) => `
      <tr>
        <td style="padding:4px;border:1px solid #ccc;">${aluno.nome_aluno}</td>
        <td style="padding:4px;border:1px solid #ccc;">${
          aluno.data_cadastro
            ? new Date(aluno.data_cadastro).toLocaleDateString("pt-BR")
            : "N/A"
        }</td>
        <td style="padding:4px;border:1px solid #ccc;">${
          aluno.matricula_aluno
        }</td>
        <td style="padding:4px;border:1px solid #ccc;">${aluno.cpf_aluno}</td>
        <td style="padding:4px;border:1px solid #ccc;">${getNomeFilial(
          aluno.id_filial
        )}</td>
        <td style="padding:4px;border:1px solid #ccc;">${
          aluno.situacao === "regular"
            ? "Regular"
            : aluno.situacao === "aguardando pagamento"
            ? "Aguardando Pagamento"
            : aluno.situacao || "N/A"
        }</td>
        <td style="padding:4px;border:1px solid #ccc;">${
          aluno.status_aluno ? "Ativo" : "Inativo"
        }</td>
      </tr>
    `
    )
    .join("");
  printWindow.document.write(`
    <html>
      <head>
        <title>Alunos</title>
      </head>
      <body>
        <h2>Alunos</h2>
        <table style="border-collapse:collapse;width:100%">${header}${rows}</table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

function copyTable(data: any[], filiais: any[]) {
  const getNomeFilial = (id_filial: number) => {
    const filial = filiais.find((f) => f.id_filial === id_filial);
    return filial?.nome_filial || "N/A";
  };

  const header = [
    "Aluno",
    "Data de Cadastro",
    "Matrícula",
    "CPF",
    "Filial",
    "Situação",
    "Status",
  ];
  const rows = data.map((aluno) => [
    aluno.nome_aluno,
    aluno.data_cadastro
      ? new Date(aluno.data_cadastro).toLocaleDateString("pt-BR")
      : "N/A",
    aluno.matricula_aluno,
    aluno.cpf_aluno,
    getNomeFilial(aluno.id_filial),
    aluno.situacao === "regular"
      ? "Regular"
      : aluno.situacao === "aguardando pagamento"
      ? "Aguardando Pagamento"
      : aluno.situacao || "N/A",
    aluno.status_aluno ? "Ativo" : "Inativo",
  ]);
  const tableText = [header, ...rows].map((e) => e.join("\t")).join("\n");
  navigator.clipboard.writeText(tableText);
  alert("Tabela copiada para a área de transferência!");
}

export default function ConsultaAlunos() {
  const [busca, setBusca] = useState("");
  const [alunos, setAlunos] = useState<any[]>([]);
  const [filiais, setFiliais] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<any>(null);
  const { token } = useAuth();

  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Função para buscar filiais
  useEffect(() => {
    async function fetchFiliais() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/empresas/listar-filiais`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setFiliais(data);
        }
      } catch (err) {
        console.error("Erro ao buscar filiais:", err);
      }
    }
    if (token) fetchFiliais();
  }, [token]);

  useEffect(() => {
    async function fetchAlunos() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/alunos/consultar-alunos`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setAlunos(data);
        } else {
          const data = await res.json();
          Swal.fire({
            icon: "error",
            text: data?.message || "Erro ao buscar alunos.",
            timer: 2500,
            showConfirmButton: false,
            toast: true,
            position: "top-end",
          });
        }
      } catch (err: any) {
        Swal.fire({
          icon: "error",
          text: err?.message || "Erro ao conectar ao servidor.",
          timer: 2500,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      }
    }
    if (token) fetchAlunos();
  }, [token]);

  // Função para obter nome da filial
  const getNomeFilial = (id_filial: number) => {
    const filial = filiais.find((f) => f.id_filial === id_filial);
    return filial?.nome_filial || "N/A";
  };

  const alunosFiltrados = alunos.filter(
    (a) =>
      (a.nome_aluno &&
        a.nome_aluno.toLowerCase().includes(busca.toLowerCase())) ||
      (a.matricula_aluno &&
        a.matricula_aluno.toLowerCase().includes(busca.toLowerCase())) ||
      (a.email_aluno &&
        a.email_aluno.toLowerCase().includes(busca.toLowerCase())) ||
      (a.cpf_aluno &&
        a.cpf_aluno.toLowerCase().includes(busca.toLowerCase())) ||
      (a.plano_aluno &&
        a.plano_aluno.toLowerCase().includes(busca.toLowerCase()))
  );
  const totalPages = Math.max(1, Math.ceil(alunosFiltrados.length / pageSize));
  const pageItems = alunosFiltrados.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  console.log(alunos);

  const atualizarAlunoNaLista = (alunoEditado: any) => {
    setAlunos((prev) =>
      prev.map((a) => (a.id_aluno === alunoEditado.id_aluno ? alunoEditado : a))
    );
  };

  const [activeTab, setActiveTab] = useState<
    "consulta" | "historico" | "importacao"
  >("consulta");

  return (
    <div className="py-4 max-w-7xl mx-auto space-y-8">
      <div className="p-2 sm:p-4 max-w-7xl mx-auto space-y-6">
        {/* Abas */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("consulta")}
              className={`cursor-pointer py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "consulta"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Consulta de Alunos
            </button>
            <button
              onClick={() => setActiveTab("historico")}
              className={` cursor-pointer py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "historico"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Histórico de Alunos
            </button>

            <button
              onClick={() => setActiveTab("importacao")}
              className={` cursor-pointer py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "importacao"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Importação de Alunos
            </button>
          </nav>
        </div>

        {activeTab === "importacao" && <ImportarAlunos />}
        {activeTab === "historico" && <HistoricoAluno />}
        {activeTab === "consulta" && (
          <>
            <div className="w-full bg-white px-2 py-6 rounded-lg shadow-md sm:px-4 sm:py-10">
              <div className="flex items-center text-sm text-muted-foreground mb-4">
                <span className="text-gray-500 hover:text-gray-700 cursor-pointer">
                  Página Inicial
                </span>
                <ChevronRight className="mx-2 h-4 w-4" />
                <span className="font-medium text-primary">
                  Consulta de Alunos
                </span>
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
                      onClick={() => exportToCSV(alunosFiltrados, filiais)}
                      type="button"
                      title="Exportar CSV"
                    >
                      <FileText size={16} /> CSV
                    </button>
                    <button
                      className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-green-100 text-green-700 hover:bg-green-200 text-sm"
                      onClick={() => exportToExcel(alunosFiltrados, filiais)}
                      type="button"
                      title="Exportar Excel"
                    >
                      <FileSpreadsheet size={16} /> Excel
                    </button>
                    <button
                      className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-red-100 text-red-700 hover:bg-red-200 text-sm"
                      onClick={() => exportToPDF(alunosFiltrados, filiais)}
                      type="button"
                      title="Exportar PDF"
                    >
                      <FileDown size={16} /> PDF
                    </button>
                    <button
                      className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
                      onClick={() => copyTable(alunosFiltrados, filiais)}
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
                        Aluno
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        CPF
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Matrícula
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Data de Cadastro
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Plano
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Filial do Aluno
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Situação
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    className="bg-white divide-y divide-gray-100"
                    style={{ height: "300px" }} // Aproximadamente 5 linhas de 60px
                  >
                    {pageItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="text-center py-6 text-gray-400"
                        >
                          Nenhum aluno encontrado.
                        </td>
                      </tr>
                    ) : (
                      <>
                        {pageItems.map((aluno) => (
                          <tr
                            key={aluno.id_aluno}
                            className="hover:bg-gray-50"
                            style={{ height: "60px" }}
                          >
                            <td className="px-4 py-2 flex gap-2">
                              <button
                                title="Editar"
                                className="p-2 rounded cursor-pointer hover:bg-gray-100 text-green-600"
                                onClick={() => {
                                  setAlunoSelecionado(aluno);
                                  setModalOpen(true);
                                }}
                                type="button"
                              >
                                <Pencil size={18} />
                              </button>
                            </td>
                            <td className="px-4 py-2">{aluno.nome_aluno}</td>
                            <td className="px-4 py-2">{aluno.cpf_aluno}</td>
                            <td className="px-4 py-2">
                              {aluno.matricula_aluno}
                            </td>

                            <td className="px-4 py-2">
                              {aluno.data_cadastro
                                ? new Date(
                                    aluno.data_cadastro
                                  ).toLocaleDateString("pt-BR")
                                : "N/A"}
                            </td>
                            <td className="px-4 py-2">{aluno.plano_aluno}</td>
                            <td className="px-4 py-2">
                              {getNomeFilial(aluno.id_filial)}
                            </td>

                            <td className="px-4 py-2">
                              <span
                                className={
                                  aluno.situacao === "regular"
                                    ? "px-2 py-1 rounded text-xs bg-green-100 text-green-700"
                                    : aluno.situacao === "aguardando pagamento"
                                    ? "px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-700"
                                    : "px-2 py-1 rounded text-xs bg-gray-200 text-gray-700"
                                }
                              >
                                {aluno.situacao === "regular"
                                  ? "Regular"
                                  : aluno.situacao === "aguardando pagamento"
                                  ? "Aguardando Pagamento"
                                  : aluno.situacao || "N/A"}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={
                                  aluno.status_aluno
                                    ? "px-2 py-1 rounded text-xs bg-green-100 text-green-700"
                                    : "px-2 py-1 rounded text-xs bg-red-100 text-red-700"
                                }
                              >
                                {aluno.status_aluno ? "Ativo" : "Inativo"}
                              </span>
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
              </div>{" "}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Página {page} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 border rounded cursor-pointer bg-blue-100 "
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronRight className="transform rotate-180 h-4 w-4" />
                  </button>
                  <button
                    className="px-3 py-1 border rounded cursor-pointer bg-blue-100 "
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronLeft className="transform rotate-180 h-4 w-4" />
                  </button>
                </div>
              </div>
              <ModalComponente
                header="Dados do Aluno"
                opened={modalOpen}
                onClose={() => setModalOpen(false)}
                hasForm={false}
                hasSaveButton={false}
                classNameBody="!text-md"
              >
                <EditarCadastroAluno
                  alunoSelecionado={alunoSelecionado}
                  onSave={(alunoEditado: any) => {
                    atualizarAlunoNaLista(alunoEditado);
                    setModalOpen(false);
                    Swal.fire({
                      icon: "success",
                      text: "Aluno atualizado com sucesso!",
                      timer: 2000,
                      showConfirmButton: false,
                      toast: true,
                      position: "top-end",
                    });
                  }}
                />
              </ModalComponente>{" "}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
