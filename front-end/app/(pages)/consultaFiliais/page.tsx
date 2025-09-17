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
import EditarFilial from "./FormEditFilial";

const filiaisMock = [
  {
    id: 1,
    nome: "Academia Centro",
    adicionadoEm: "2024-01-10",
    alteradoEm: "2024-06-01",
    alteradoPor: "admin",
    status: "Ativo",
  },
  {
    id: 2,
    nome: "Academia Zona Sul",
    adicionadoEm: "2024-02-15",
    alteradoEm: "2024-07-05",
    alteradoPor: "joao",
    status: "Inativo",
  },
  {
    id: 3,
    nome: "Academia Zona Sul",
    adicionadoEm: "2024-02-15",
    alteradoEm: "2024-07-05",
    alteradoPor: "joao",
    status: "Inativo",
  },
  {
    id: 4,
    nome: "Academia Zona Sul",
    adicionadoEm: "2024-02-15",
    alteradoEm: "2024-07-05",
    alteradoPor: "joao",
    status: "Inativo",
  },
  {
    id: 5,
    nome: "Academia Zona Sul",
    adicionadoEm: "2024-02-15",
    alteradoEm: "2024-07-05",
    alteradoPor: "joao",
    status: "Inativo",
  },
  // Adicione mais objetos para testar a paginação
  {
    id: 6,
    nome: "Academia Norte",
    adicionadoEm: "2024-03-10",
    alteradoEm: "2024-07-10",
    alteradoPor: "maria",
    status: "Ativo",
  },
  {
    id: 7,
    nome: "Academia Leste",
    adicionadoEm: "2024-04-10",
    alteradoEm: "2024-07-12",
    alteradoPor: "carlos",
    status: "Ativo",
  },
  {
    id: 8,
    nome: "Academia Oeste",
    adicionadoEm: "2024-05-10",
    alteradoEm: "2024-07-13",
    alteradoPor: "ana",
    status: "Inativo",
  },
  {
    id: 9,
    nome: "Academia Sul",
    adicionadoEm: "2024-06-10",
    alteradoEm: "2024-07-14",
    alteradoPor: "joao",
    status: "Ativo",
  },
  {
    id: 10,
    nome: "Academia Central",
    adicionadoEm: "2024-07-10",
    alteradoEm: "2024-07-15",
    alteradoPor: "admin",
    status: "Ativo",
  },
  {
    id: 11,
    nome: "Academia Nova",
    adicionadoEm: "2024-08-10",
    alteradoEm: "2024-08-01",
    alteradoPor: "admin",
    status: "Ativo",
  },
];

function exportToCSV(data: any[]) {
  const header = [
    "Filial",
    "Adicionado em",
    "Alterado em",
    "Alterado por",
    "Status",
  ];
  const rows = data.map((filial) => [
    filial.nome,
    filial.adicionadoEm,
    filial.alteradoEm,
    filial.alteradoPor === "admin"
      ? "João Vítor Marcelino"
      : filial.alteradoPor,
    filial.status,
  ]);
  const csvContent = [header, ...rows]
    .map((e) => e.map((v) => `"${v}"`).join(","))
    .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "filiais.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportToExcel(data: any[]) {
  exportToCSV(data); // Para simplificação, exporta como CSV
}

function exportToPDF(data: any[]) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  const header = `
    <tr>
      <th style="padding:4px;border:1px solid #ccc;">Filial</th>
      <th style="padding:4px;border:1px solid #ccc;">Adicionado em</th>
      <th style="padding:4px;border:1px solid #ccc;">Alterado em</th>
      <th style="padding:4px;border:1px solid #ccc;">Alterado por</th>
      <th style="padding:4px;border:1px solid #ccc;">Status</th>
    </tr>
  `;
  const rows = data
    .map(
      (filial) => `
      <tr>
        <td style="padding:4px;border:1px solid #ccc;">${filial.nome}</td>
        <td style="padding:4px;border:1px solid #ccc;">${
          filial.adicionadoEm
        }</td>
        <td style="padding:4px;border:1px solid #ccc;">${filial.alteradoEm}</td>
        <td style="padding:4px;border:1px solid #ccc;">${
          filial.alteradoPor === "admin"
            ? "João Vítor Marcelino"
            : filial.alteradoPor
        }</td>
        <td style="padding:4px;border:1px solid #ccc;">${filial.status}</td>
      </tr>
    `
    )
    .join("");
  printWindow.document.write(`
    <html>
      <head>
        <title>Filiais</title>
      </head>
      <body>
        <h2>Filiais</h2>
        <table style="border-collapse:collapse;width:100%">${header}${rows}</table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

function copyTable(data: any[]) {
  const header = [
    "Filial",
    "Adicionado em",
    "Alterado em",
    "Alterado por",
    "Status",
  ];
  const rows = data.map((filial) => [
    filial.nome,
    filial.adicionadoEm,
    filial.alteradoEm,
    filial.alteradoPor === "admin"
      ? "João Vítor Marcelino"
      : filial.alteradoPor,
    filial.status,
  ]);
  const tableText = [header, ...rows].map((e) => e.join("\t")).join("\n");
  navigator.clipboard.writeText(tableText);
  alert("Tabela copiada para a área de transferência!");
}

export default function ConsultaFiliais() {
  const [busca, setBusca] = useState("");
  const [filiais, setFiliais] = useState(filiaisMock);
  const [modalOpen, setModalOpen] = useState(false);
  const [filialSelecionada, setFilialSelecionada] = useState<any>(null);

  // Paginação
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filiaisFiltradas = filiais.filter(
    (f) =>
      f.nome.toLowerCase().includes(busca.toLowerCase()) ||
      f.alteradoPor.toLowerCase().includes(busca.toLowerCase()) ||
      f.status.toLowerCase().includes(busca.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filiaisFiltradas.length / pageSize));
  const pageItems = filiaisFiltradas.slice(
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
          <span className="font-medium text-primary">Consulta de Filiais</span>
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
                className="flex items-center gap-2 px-3 py-2 cursor-pointer h-[42px] rounded bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm"
                onClick={() => exportToCSV(filiaisFiltradas)}
                type="button"
                title="Exportar CSV"
              >
                <FileText size={16} /> CSV
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 cursor-pointer h-[42px] rounded bg-green-100 text-green-700 hover:bg-green-200 text-sm"
                onClick={() => exportToExcel(filiaisFiltradas)}
                type="button"
                title="Exportar Excel"
              >
                <FileSpreadsheet size={16} /> Excel
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 cursor-pointer h-[42px] rounded bg-red-100 text-red-700 hover:bg-red-200 text-sm"
                onClick={() => exportToPDF(filiaisFiltradas)}
                type="button"
                title="Exportar PDF"
              >
                <FileDown size={16} /> PDF
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 cursor-pointer h-[42px] rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
                onClick={() => copyTable(filiaisFiltradas)}
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
                  Filial
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Adicionado em
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Alterado em
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Alterado por
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
                    Nenhuma filial encontrada.
                  </td>
                </tr>
              ) : (
                <>
                  {pageItems.map((filial) => (
                    <tr
                      key={filial.id}
                      className="hover:bg-gray-50"
                      style={{ height: "60px" }}
                    >
                      <td className="px-4 py-2 flex gap-2">
                        <button
                          title="Editar"
                          className="p-2 rounded cursor-pointer hover:bg-gray-100 text-green-600"
                          onClick={() => {
                            setFilialSelecionada(filial);
                            setModalOpen(true);
                          }}
                          type="button"
                        >
                          <Pencil size={18} />
                        </button>
                      </td>
                      <td className="px-4 py-2">{filial.nome}</td>
                      <td className="px-4 py-2">{filial.adicionadoEm}</td>
                      <td className="px-4 py-2">{filial.alteradoEm}</td>
                      <td className="px-4 py-2 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-200">
                          <User size={18} className="text-gray-500" />
                        </span>
                        <span>
                          {filial.alteradoPor === "admin"
                            ? "João Vítor Marcelino"
                            : filial.alteradoPor}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            filial.status === "Ativo"
                              ? "px-2 py-1 rounded text-xs bg-green-100 text-green-700"
                              : "px-2 py-1 rounded text-xs bg-red-100 text-red-700"
                          }
                        >
                          {filial.status}
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
        </div>

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
          className="h-[80vh] w-[90vw] md:w-[100vw] lg:w-[900px]"
          classNameBody="!text-md"
        >
          <EditarFilial filial={filialSelecionada} />
        </ModalComponente>
      </div>
    </div>
  );
}
