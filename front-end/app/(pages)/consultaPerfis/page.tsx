
"use client";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  FileDown,
  FileSpreadsheet,
  FileText,
  Pencil,
  Search,
  Shield,
} from "lucide-react";
import { useState } from "react";

// Mock de perfis
const perfisMock = [
  {
    id: 1,
    nome: "Administrador",
    filial: "Filial 2",
    permissoes: ["Criar", "Editar", "Excluir", "Visualizar"],
    criadoEm: "10/01/2024 10:30",
  },
  {
    id: 2,
    nome: "Usuário Padrão",
    filial: "Filial 1",
    permissoes: ["Visualizar"],
    criadoEm: "15/02/2024 13:40",
  },
];

// Exportar CSV
function exportToCSV(data: any[]) {
  const header = ["Nome", "Filial", "Permissões", "Criado em"];
  const rows = data.map((perfil) => [
    perfil.nome,
    perfil.filial,
    perfil.permissoes.join(" | "),
    perfil.criadoEm,
  ]);
  const csvContent = [header, ...rows]
    .map((e) => e.map((v) => `"${v}"`).join(","))
    .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "perfis.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Exportar Excel (simples usando CSV)
function exportToExcel(data: any[]) {
  exportToCSV(data);
}

// Exportar PDF
function exportToPDF(data: any[]) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  const header = `
    <tr>
      <th style="padding:4px;border:1px solid #ccc;">Nome</th>
      <th style="padding:4px;border:1px solid #ccc;">Filial</th>
      <th style="padding:4px;border:1px solid #ccc;">Permissões</th>
      <th style="padding:4px;border:1px solid #ccc;">Criado em</th>
    </tr>
  `;
  const rows = data
    .map(
      (perfil) => `
      <tr>
        <td style="padding:4px;border:1px solid #ccc;">${perfil.nome}</td>
        <td style="padding:4px;border:1px solid #ccc;">${perfil.filial}</td>
        <td style="padding:4px;border:1px solid #ccc;">${perfil.permissoes.join(
          ", "
        )}</td>
        <td style="padding:4px;border:1px solid #ccc;">${perfil.criadoEm}</td>
      </tr>
    `
    )
    .join("");
  printWindow.document.write(`
    <html>
      <head><title>Perfis</title></head>
      <body>
        <h2>Perfis</h2>
        <table style="border-collapse:collapse;width:100%">${header}${rows}</table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

// Copiar tabela
function copyTable(data: any[]) {
  const header = ["Nome", "Filial", "Permissões", "Criado em"];
  const rows = data.map((perfil) => [
    perfil.nome,
    perfil.filial,
    perfil.permissoes.join(" | "),
    perfil.criadoEm,
  ]);
  const tableText = [header, ...rows].map((e) => e.join("\t")).join("\n");
  navigator.clipboard.writeText(tableText);
  alert("Tabela copiada para a área de transferência!");
}

export default function ConsultaPerfis() {
  const [busca, setBusca] = useState("");
  const [perfis, setPerfis] = useState(perfisMock);
  const [modalOpen, setModalOpen] = useState(false);
  const [perfilSelecionado, setPerfilSelecionado] = useState<any>(null);

  const [page, setPage] = useState(1);
  const pageSize = 5;
  const perfisFiltrados = perfis.filter(
    (p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.filial.toLowerCase().includes(busca.toLowerCase()) ||
      p.permissoes.join(" ").toLowerCase().includes(busca.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(perfisFiltrados.length / pageSize));
  const pageItems = perfisFiltrados.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-8">
      <div className="w-full bg-white p-6 rounded-lg shadow-md sm:p-10">
        {/* Cabeçalho */}
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <span className="text-gray-500 hover:text-gray-700 cursor-pointer">
            Página Inicial
          </span>
          <ChevronRight className="mx-2 h-4 w-4" />
          <span className="font-medium text-primary">Consulta de Perfis</span>
        </div>

        {/* Barra de busca e botões */}
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
                onClick={() => exportToCSV(perfisFiltrados)}
              >
                <FileText size={16} /> CSV
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-green-100 text-green-700 hover:bg-green-200 text-sm"
                onClick={() => exportToExcel(perfisFiltrados)}
              >
                <FileSpreadsheet size={16} /> Excel
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-red-100 text-red-700 hover:bg-red-200 text-sm"
                onClick={() => exportToPDF(perfisFiltrados)}
              >
                <FileDown size={16} /> PDF
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
                onClick={() => copyTable(perfisFiltrados)}
              >
                <Copy size={16} /> Copiar
              </button>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Ação
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Nome
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Filial
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Permissões
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-400">
                    Nenhum perfil encontrado.
                  </td>
                </tr>
              ) : (
                pageItems.map((perfil) => (
                  <tr key={perfil.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <button
                        title="Editar"
                        className="p-2 rounded cursor-pointer hover:bg-gray-100 text-green-600"
                        onClick={() => {
                          setPerfilSelecionado(perfil);
                          setModalOpen(true);
                        }}
                      >
                        <Pencil size={18} />
                      </button>
                    </td>
                    <td className="px-4 py-2 flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-200">
                        <Shield size={18} className="text-gray-500" />
                      </span>
                      {perfil.nome}
                    </td>
                    <td className="px-4 py-2">{perfil.filial}</td>
                    <td className="px-4 py-2">
                      {perfil.permissoes.join(", ")}
                    </td>
                  </tr>
                ))
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

        {/* Modal de edição futuramente */}
        {/* 
        <ModalComponente
          header="Editar Perfil"
          opened={modalOpen}
          onClose={() => setModalOpen(false)}
        >
          <EditarPerfil perfil={perfilSelecionado} />
        </ModalComponente> 
        */}
      </div>
    </div>
  );
}
