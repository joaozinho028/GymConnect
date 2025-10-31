"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  FileDown,
  FileSpreadsheet,
  FileText,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ModalComponent } from "../fluxoCaixa/shared";
// Funções de exportação
function exportToCSV(data: any[]) {
  const header = ["Nome", "Matrícula", "CPF", "Data de Cadastro", "Status"];
  const rows = data.map((aluno) => [
    aluno.nome_aluno,
    aluno.matricula_aluno,
    aluno.cpf_aluno,
    aluno.data_cadastro_aluno
      ? new Date(aluno.data_cadastro_aluno).toLocaleDateString("pt-BR")
      : "N/A",
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

function exportToExcel(data: any[]) {
  exportToCSV(data);
}

function exportToPDF(data: any[]) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  const header = `<tr>
      <th style="padding:4px;border:1px solid #ccc;">Nome</th>
      <th style="padding:4px;border:1px solid #ccc;">Matrícula</th>
      <th style="padding:4px;border:1px solid #ccc;">CPF</th>
      <th style="padding:4px;border:1px solid #ccc;">Data de Cadastro</th>
      <th style="padding:4px;border:1px solid #ccc;">Status</th>
    </tr>`;
  const rows = data
    .map(
      (aluno) => `<tr>
      <td style="padding:4px;border:1px solid #ccc;">${aluno.nome_aluno}</td>
      <td style="padding:4px;border:1px solid #ccc;">${
        aluno.matricula_aluno
      }</td>
      <td style="padding:4px;border:1px solid #ccc;">${aluno.cpf_aluno}</td>
      <td style="padding:4px;border:1px solid #ccc;">${
        aluno.data_cadastro_aluno
          ? new Date(aluno.data_cadastro_aluno).toLocaleDateString("pt-BR")
          : "N/A"
      }</td>
      <td style="padding:4px;border:1px solid #ccc;">${
        aluno.status_aluno ? "Ativo" : "Inativo"
      }</td>
    </tr>`
    )
    .join("");
  printWindow.document.write(`
    <html>
      <head><title>Alunos</title></head>
      <body>
        <h2>Histórico de Alunos</h2>
        <table style="border-collapse:collapse;width:100%">${header}${rows}</table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

function copyTable(data: any[]) {
  const header = ["Nome", "Matrícula", "CPF", "Data de Cadastro", "Status"];
  const rows = data.map((aluno) => [
    aluno.nome_aluno,
    aluno.matricula_aluno,
    aluno.cpf_aluno,
    aluno.data_cadastro_aluno
      ? new Date(aluno.data_cadastro_aluno).toLocaleDateString("pt-BR")
      : "N/A",
    aluno.status_aluno ? "Ativo" : "Inativo",
  ]);
  const tableText = [header, ...rows].map((e) => e.join("\t")).join("\n");
  navigator.clipboard.writeText(tableText);
  alert("Tabela copiada para a área de transferência!");
}

interface Aluno {
  id_aluno: number;
  nome_aluno: string;
  matricula_aluno: string;
  cpf_aluno: string;
  data_cadastro_aluno?: string;
  status_aluno: boolean;
}

function HistoricoAluno() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const itemsPerPage = 10;
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState<"arquivos" | "mensalidades">(
    "arquivos"
  );

  // Buscar alunos da empresa e filiais
  const buscarAlunos = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/alunos/consultar-alunos`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setAlunos(data);
      } else {
        setAlunos([]);
      }
    } catch (error) {
      setAlunos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) buscarAlunos();
  }, [token]);

  // Filtrar alunos
  const alunosFiltrados = useMemo(() => {
    if (!searchTerm) return alunos;
    return alunos.filter(
      (aluno) =>
        aluno.nome_aluno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aluno.matricula_aluno
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        aluno.cpf_aluno?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [alunos, searchTerm]);

  // Paginação
  const totalPages = Math.max(
    1,
    Math.ceil(alunosFiltrados.length / itemsPerPage)
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageItems = alunosFiltrados.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="p-4 max-w-full mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Histórico de Alunos</h1>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Buscar por nome, matrícula ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Botões de exportação */}
        <div className="flex flex-wrap gap-2">
          <button
            className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm"
            onClick={() => exportToCSV(alunosFiltrados)}
            disabled={alunosFiltrados.length === 0}
          >
            <FileText size={16} /> CSV
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-green-100 text-green-700 hover:bg-green-200 text-sm"
            onClick={() => exportToExcel(alunosFiltrados)}
            disabled={alunosFiltrados.length === 0}
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-red-100 text-red-700 hover:bg-red-200 text-sm"
            onClick={() => exportToPDF(alunosFiltrados)}
            disabled={alunosFiltrados.length === 0}
          >
            <FileDown size={16} /> PDF
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
            onClick={() => copyTable(alunosFiltrados)}
            disabled={alunosFiltrados.length === 0}
          >
            <Copy size={16} /> Copiar
          </button>
        </div>
      </div>
      <div className="text-sm text-gray-600">
        Mostrando {startIndex + 1} a{" "}
        {Math.min(endIndex, alunosFiltrados.length)} de {alunosFiltrados.length}{" "}
        alunos
        {searchTerm && ` (filtrado de ${alunos.length} total)`}
      </div>
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Nome do Aluno
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Data de Cadastro
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center py-6 text-gray-400">
                    Carregando...
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-6 text-gray-400">
                    Nenhum aluno encontrado.
                  </td>
                </tr>
              ) : (
                pageItems.map((aluno) => (
                  <tr
                    key={aluno.id_aluno}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setAlunoSelecionado(aluno);
                      setModalOpen(true);
                    }}
                  >
                    <td className="px-4 py-2">{aluno.nome_aluno}</td>
                    <td className="px-4 py-2">
                      {aluno.data_cadastro_aluno
                        ? new Date(
                            aluno.data_cadastro_aluno
                          ).toLocaleDateString("pt-BR")
                        : "N/A"}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              Anterior
            </button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                const showPage =
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 2 && page <= currentPage + 2);
                if (!showPage) {
                  if (page === currentPage - 3 || page === currentPage + 3) {
                    return <span key={page}>...</span>;
                  }
                  return null;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      currentPage === page
                        ? "text-blue-600 bg-blue-50 border border-blue-300"
                        : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
      <ModalComponent
        header={`Dados do Aluno ${alunoSelecionado?.nome_aluno}`}
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        hasForm={false}
        hasSaveButton={false}
        classNameBody="!text-md"
      >
        {alunoSelecionado && (
          <div className="hidden">
            <div>
              <strong>Nome:</strong> {alunoSelecionado.nome_aluno}
            </div>
            <div>
              <strong>Matrícula:</strong> {alunoSelecionado.matricula_aluno}
            </div>
            <div>
              <strong>CPF:</strong> {alunoSelecionado.cpf_aluno}
            </div>
            <div>
              <strong>Data de Cadastro:</strong>{" "}
              {alunoSelecionado.data_cadastro_aluno
                ? new Date(
                    alunoSelecionado.data_cadastro_aluno
                  ).toLocaleDateString("pt-BR")
                : "N/A"}
            </div>
            <div>
              <strong>Status:</strong>{" "}
              {alunoSelecionado.status_aluno ? "Ativo" : "Inativo"}
            </div>
          </div>
        )}

        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("arquivos")}
              className={`cursor-pointer py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "arquivos"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Documentos do Aluno
            </button>

            <button
              onClick={() => setActiveTab("mensalidades")}
              className={` cursor-pointer py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "mensalidades"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Mensalidades do Aluno
            </button>
          </nav>
        </div>

        {activeTab === "arquivos" && (
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Documentos do Aluno</h2>
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600">
                Aqui você pode importar e visualizar os documentos do aluno.
              </p>
              <button className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm shadow">
                <FileText size={18} /> Importar documento
              </button>
            </div>

            {/* Mock de documentos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { id: 1, nome: "RG.pdf" },
                { id: 2, nome: "CPF.pdf" },
                { id: 3, nome: "ComprovanteResidencia.pdf" },
              ].map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-4 bg-white border rounded-lg shadow hover:shadow-md cursor-pointer transition"
                  onClick={() => alert(`Baixando documento: ${doc.nome}`)}
                >
                  <FileText size={32} className="text-green-500" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{doc.nome}</div>
                    <div className="text-xs text-gray-500">
                      Clique para baixar
                    </div>
                  </div>
                  <button
                    className="ml-2 px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs hover:bg-blue-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      alert(`Baixando documento: ${doc.nome}`);
                    }}
                  >
                    Baixar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "mensalidades" && (
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">
              Mensalidades do Aluno
            </h2>
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600">
                Veja o histórico de mensalidades do aluno.
              </p>
              <input
                type="date"
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Filtrar por data de vencimento"
                onChange={() => {}}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                {
                  id: 1,
                  valor: 120.0,
                  plano: "Mensal",
                  vencimento: "2025-10-10",
                  situacao: "Paga",
                },
                {
                  id: 2,
                  valor: 120.0,
                  plano: "Mensal",
                  vencimento: "2025-11-10",
                  situacao: "Pendente",
                },
                {
                  id: 3,
                  valor: 120.0,
                  plano: "Mensal",
                  vencimento: "2025-09-10",
                  situacao: "Atrasada",
                },
              ].map((mensalidade) => {
                let situacaoClass = "bg-red-100 text-red-700";
                if (mensalidade.situacao === "Paga")
                  situacaoClass = "bg-green-100 text-green-700";
                else if (mensalidade.situacao === "Pendente")
                  situacaoClass = "bg-yellow-100 text-yellow-700";
                return (
                  <div
                    key={mensalidade.id}
                    className="flex flex-col gap-2 p-4 bg-white border rounded-lg shadow hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800 text-lg">
                        R$ {mensalidade.valor.toFixed(2)}
                      </span>
                      <span
                        className={
                          "px-2 py-1 rounded text-xs font-semibold " +
                          situacaoClass
                        }
                      >
                        {mensalidade.situacao}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Plano: {mensalidade.plano}
                    </div>
                    <div className="text-sm text-gray-600">
                      Vencimento:{" "}
                      {new Date(mensalidade.vencimento).toLocaleDateString(
                        "pt-BR"
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </ModalComponent>
    </div>
  );
}

export default HistoricoAluno;
