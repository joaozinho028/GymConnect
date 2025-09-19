"use client";
import ModalComponente from "@/components/Modal/ModalComponent";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  FileDown,
  FileSpreadsheet,
  FileText,
  Pencil,
  Search,
  User,
} from "lucide-react";
import { useState } from "react";
import EditarCadastroAluno from "./FormEditAluno";

const alunosMock = [
  {
    id: 1,
    nome: "Lucas Silva",
    dataCadastro: "10/01/2024 ás 10:30",
    matricula: "20240101",
    cadastradoPor: "admin",
    tokenAcesso: "ABCD123",
    status: "Ativo",
    situacao: "Regular",
  },
  {
    id: 2,
    nome: "Maria Souza",
    dataCadastro: "15/02/2024 ás 13:40",
    matricula: "20240215",
    tokenAcesso: "CXTR900",
    cadastradoPor: "Marcos Pereira",
    status: "Inativo",
    situacao: "Inadimplente de pagamento",
  },
  {
    id: 3,
    nome: "João Lima",
    dataCadastro: "20/03/2024 ás 09:20",
    matricula: "20240320",
    tokenAcesso: "JKL789",
    cadastradoPor: "admin",
    status: "Ativo",
    situacao: "Cancelado",
  },
  {
    id: 4,
    nome: "Ana Paula",
    dataCadastro: "05/04/2024 ás 14:10",
    matricula: "20240405",
    tokenAcesso: "ANA456",
    cadastradoPor: "João Vítor Marcelino",
    status: "Ativo",
    situacao: "Regular",
  },
  {
    id: 5,
    nome: "Carlos Mendes",
    dataCadastro: "12/05/2024 ás 11:45",
    matricula: "20240512",
    tokenAcesso: "CAR321",
    cadastradoPor: "Marcos Pereira",
    status: "Inativo",
    situacao: "Inadimplente de pagamento",
  },
];

function exportToCSV(data: any[]) {
  const header = [
    "Aluno",
    "Data de Cadastro",
    "Matrícula",
    "Cadastrado por",
    "Status",
  ];
  const rows = data.map((aluno) => [
    aluno.nome,
    aluno.dataCadastro,
    aluno.matricula,
    aluno.cadastradoPor === "admin"
      ? "João Vítor Marcelino"
      : aluno.cadastradoPor,
    aluno.status,
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
  // Gera um arquivo Excel simples (XLSX real precisa de libs como SheetJS)
  exportToCSV(data); // Para simplificação, exporta como CSV
}

function exportToPDF(data: any[]) {
  // Exportação simples para PDF usando window.print()
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  const header = `
    <tr>
      <th style="padding:4px;border:1px solid #ccc;">Aluno</th>
      <th style="padding:4px;border:1px solid #ccc;">Data de Cadastro</th>
      <th style="padding:4px;border:1px solid #ccc;">Matrícula</th>
      <th style="padding:4px;border:1px solid #ccc;">Cadastrado por</th>
      <th style="padding:4px;border:1px solid #ccc;">Status</th>
    </tr>
  `;
  const rows = data
    .map(
      (aluno) => `
      <tr>
        <td style="padding:4px;border:1px solid #ccc;">${aluno.nome}</td>
        <td style="padding:4px;border:1px solid #ccc;">${
          aluno.dataCadastro
        }</td>
        <td style="padding:4px;border:1px solid #ccc;">${aluno.matricula}</td>
        <td style="padding:4px;border:1px solid #ccc;">${
          aluno.cadastradoPor === "admin"
            ? "João Vítor Marcelino"
            : aluno.cadastradoPor
        }</td>
        <td style="padding:4px;border:1px solid #ccc;">${aluno.status}</td>
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

function copyTable(data: any[]) {
  const header = [
    "Aluno",
    "Data de Cadastro",
    "Matrícula",
    "Cadastrado por",
    "Status",
  ];
  const rows = data.map((aluno) => [
    aluno.nome,
    aluno.dataCadastro,
    aluno.matricula,
    aluno.cadastradoPor === "admin"
      ? "João Vítor Marcelino"
      : aluno.cadastradoPor,
    aluno.status,
  ]);
  const tableText = [header, ...rows].map((e) => e.join("\t")).join("\n");
  navigator.clipboard.writeText(tableText);
  alert("Tabela copiada para a área de transferência!");
}

export default function ConsultaAlunos() {
  const [busca, setBusca] = useState("");
  const [alunos, setAlunos] = useState(alunosMock);
  const [modalOpen, setModalOpen] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<any>(null);

  const [page, setPage] = useState(1);
  const pageSize = 5;
  const alunosFiltrados = alunos.filter(
    (a) =>
      a.nome.toLowerCase().includes(busca.toLowerCase()) ||
      a.matricula.toLowerCase().includes(busca.toLowerCase()) ||
      a.cadastradoPor.toLowerCase().includes(busca.toLowerCase()) ||
      a.status.toLowerCase().includes(busca.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(alunosFiltrados.length / pageSize));
  const pageItems = alunosFiltrados.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-8">
      <div className="w-full bg-white p-6 rounded-lg shadow-md sm:p-10">
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <span className="text-gray-500 hover:text-gray-700 cursor-pointer">
            Página Inicial
          </span>
          <ChevronRight className="mx-2 h-4 w-4" />
          <span className="font-medium text-primary">Consulta de Alunos</span>
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
                onClick={() => exportToCSV(alunosFiltrados)}
                type="button"
                title="Exportar CSV"
              >
                <FileText size={16} /> CSV
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-green-100 text-green-700 hover:bg-green-200 text-sm"
                onClick={() => exportToExcel(alunosFiltrados)}
                type="button"
                title="Exportar Excel"
              >
                <FileSpreadsheet size={16} /> Excel
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-red-100 text-red-700 hover:bg-red-200 text-sm"
                onClick={() => exportToPDF(alunosFiltrados)}
                type="button"
                title="Exportar PDF"
              >
                <FileDown size={16} /> PDF
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
                onClick={() => copyTable(alunosFiltrados)}
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
                  Data de Cadastro
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Matrícula
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Token de Acesso
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Cadastrado por
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
                  <td colSpan={6} className="text-center py-6 text-gray-400">
                    Nenhum aluno encontrado.
                  </td>
                </tr>
              ) : (
                <>
                  {pageItems.map((aluno) => (
                    <tr
                      key={aluno.id}
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
                      <td className="px-4 py-2">{aluno.nome}</td>
                      <td className="px-4 py-2">{aluno.dataCadastro}</td>
                      <td className="px-4 py-2">{aluno.matricula}</td>
                      <td className="px-4 py-2">{aluno.tokenAcesso}</td>
                      <td className="px-4 py-2 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-200">
                          <User size={18} className="text-gray-500" />
                        </span>
                        <span>
                          {aluno.cadastradoPor === "admin"
                            ? "João Vítor Marcelino"
                            : aluno.cadastradoPor}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            aluno.situacao === "Regular"
                              ? "px-2 py-1 rounded text-xs bg-green-100 text-green-700"
                              : aluno.situacao === "Inadimplente de pagamento"
                              ? "px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-700"
                              : "px-2 py-1 rounded text-xs bg-gray-200 text-gray-700"
                          }
                        >
                          {aluno.situacao}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            aluno.status === "Ativo"
                              ? "px-2 py-1 rounded text-xs bg-green-100 text-green-700"
                              : "px-2 py-1 rounded text-xs bg-red-100 text-red-700"
                          }
                        >
                          {aluno.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* Preenche linhas vazias para manter 5 linhas fixas */}
                  {Array.from({ length: 5 - pageItems.length }).map(
                    (_, idx) => (
                      <tr key={`empty-${idx}`} style={{ height: "60px" }}>
                        <td colSpan={6} />
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
          header="Dados da Filial"
          opened={modalOpen}
          onClose={() => setModalOpen(false)}
          hasForm={false}
          hasSaveButton={false}
          classNameBody="!text-md"
        >
          <EditarCadastroAluno filial={alunoSelecionado} />
        </ModalComponente>{" "}
      </div>
    </div>
  );
}
