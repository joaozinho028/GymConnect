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

// Função para determinar as cores da ação
const getActionStyle = (acao: string) => {
  const acaoLower = acao?.toLowerCase() || "";

  // Cores para diferentes tipos de ação
  if (acaoLower.includes("cadastrou") || acaoLower.includes("importou")) {
    return "bg-green-100 text-green-700 border border-green-200";
  }

  if (acaoLower.includes("editou")) {
    return "bg-blue-100 text-blue-700 border border-blue-200";
  }

  if (acaoLower.includes("inativou")) {
    return "bg-red-100 text-red-700 border border-red-200";
  }

  if (acaoLower.includes("ativou")) {
    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  }

  if (acaoLower.includes("removeu") || acaoLower.includes("excluiu")) {
    return "bg-orange-100 text-orange-700 border border-orange-200";
  }

  // Cor padrão para ações não categorizadas
  return "bg-gray-100 text-gray-700 border border-gray-200";
};

// Funções de exportação
function exportToCSV(data: any[]) {
  const header = ["Data/Hora", "Usuário", "Ação", "Filial", "Descrição"];
  const rows = data.map((log) => [
    new Date(log.data_hora).toLocaleString(),
    log.nome_usuario || "N/A",
    log.acao,
    log.nome_filial || "N/A",
    log.descricao,
  ]);
  const csvContent = [header, ...rows]
    .map((e) => e.map((v) => `"${v}"`).join(","))
    .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "auditoria.csv");
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
      <th style="padding:4px;border:1px solid #ccc;">Data/Hora</th>
      <th style="padding:4px;border:1px solid #ccc;">Usuário</th>
      <th style="padding:4px;border:1px solid #ccc;">Ação</th>
      <th style="padding:4px;border:1px solid #ccc;">Filial</th>
      <th style="padding:4px;border:1px solid #ccc;">Descrição</th>
    </tr>`;
  const rows = data
    .map(
      (log) => `<tr>
      <td style="padding:4px;border:1px solid #ccc;">${new Date(
        log.data_hora
      ).toLocaleString()}</td>
      <td style="padding:4px;border:1px solid #ccc;">${
        log.nome_usuario || "N/A"
      }</td>
      <td style="padding:4px;border:1px solid #ccc;">${log.acao}</td>
      <td style="padding:4px;border:1px solid #ccc;">${
        log.nome_filial || "N/A"
      }</td>
      <td style="padding:4px;border:1px solid #ccc;">${log.descricao}</td>
    </tr>`
    )
    .join("");
  printWindow.document.write(`
    <html>
      <head><title>Auditoria</title></head>
      <body>
        <h2>Auditoria</h2>
        <table style="border-collapse:collapse;width:100%">${header}${rows}</table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

function copyTable(data: any[]) {
  const header = ["Data/Hora", "Usuário", "Ação", "Filial", "Descrição"];
  const rows = data.map((log) => [
    new Date(log.data_hora).toLocaleString(),
    log.nome_usuario || "N/A",
    log.acao,
    log.nome_filial || "N/A",
    log.descricao,
  ]);
  const tableText = [header, ...rows].map((e) => e.join("\t")).join("\n");
  navigator.clipboard.writeText(tableText);
  alert("Tabela copiada para a área de transferência!");
}

const HistoricoUsuario = () => {
  const [auditorias, setAuditorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { token } = useAuth();

  const buscarAuditorias = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auditoria`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAuditorias(data);
      } else {
        console.error("Erro ao buscar auditorias");
        setAuditorias([]);
      }
    } catch (error) {
      console.error("Erro ao buscar auditorias:", error);
      setAuditorias([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtra os dados com base no termo de busca
  const filteredAuditorias = useMemo(() => {
    if (!searchTerm) return auditorias;

    return auditorias.filter(
      (auditoria: any) =>
        auditoria.nome_usuario
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        auditoria.acao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auditoria.nome_filial
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        auditoria.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [auditorias, searchTerm]);

  // Calcula a paginação
  const totalPages = Math.ceil(filteredAuditorias.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAuditorias = filteredAuditorias.slice(startIndex, endIndex);

  // Reset da página quando busca
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Carrega auditorias ao inicializar
  useEffect(() => {
    if (token) {
      buscarAuditorias();
    }
  }, [token]);

  return (
    <div className="p-4 max-w-full mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Histórico de Usuários</h1>

      {/* Campo de busca */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Buscar por usuário, ação, filial ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Botões de exportação */}
        <div className="flex flex-wrap gap-2">
          <button
            className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm"
            onClick={() => exportToCSV(filteredAuditorias)}
            disabled={filteredAuditorias.length === 0}
          >
            <FileText size={16} /> CSV
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-green-100 text-green-700 hover:bg-green-200 text-sm"
            onClick={() => exportToExcel(filteredAuditorias)}
            disabled={filteredAuditorias.length === 0}
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-red-100 text-red-700 hover:bg-red-200 text-sm"
            onClick={() => exportToPDF(filteredAuditorias)}
            disabled={filteredAuditorias.length === 0}
          >
            <FileDown size={16} /> PDF
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
            onClick={() => copyTable(filteredAuditorias)}
            disabled={filteredAuditorias.length === 0}
          >
            <Copy size={16} /> Copiar
          </button>
        </div>
      </div>

      {/* Legenda de cores */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Legenda de Ações:
        </h3>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="px-2 py-1 rounded bg-green-100 text-green-700 border border-green-200">
              Cadastrou/Importou
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 border border-blue-200">
              Editou
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
              Ativou
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="px-2 py-1 rounded bg-red-100 text-red-700 border border-red-200">
              Inativou
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="px-2 py-1 rounded bg-orange-100 text-orange-700 border border-orange-200">
              Removeu
            </span>
          </div>
        </div>
      </div>

      {/* Informações de resultados */}
      <div className="text-sm text-gray-600">
        Mostrando {startIndex + 1} a{" "}
        {Math.min(endIndex, filteredAuditorias.length)} de{" "}
        {filteredAuditorias.length} registros
        {searchTerm && ` (filtrado de ${auditorias.length} total)`}
        <span className=" ml-3 font-semibold text-red-600">
          ATENÇÃO: A consulta tem limite de 1000 linhas. Para auditoria
          completa, solicite ao suporte.
        </span>
      </div>

      {/* Tabela de auditoria com scroll horizontal */}
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Data/Hora
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Usuário
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Ação
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Filial
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[300px]">
                  Descrição
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    Carregando...
                  </td>
                </tr>
              ) : currentAuditorias.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    {searchTerm
                      ? "Nenhum resultado encontrado para sua busca."
                      : "Nenhuma auditoria encontrada."}
                  </td>
                </tr>
              ) : (
                currentAuditorias.map((auditoria: any) => (
                  <tr key={auditoria.id_auditoria} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {auditoria.data_hora
                        ? new Date(auditoria.data_hora).toLocaleString()
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {auditoria.nome_usuario || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getActionStyle(
                          auditoria.acao
                        )}`}
                      >
                        {auditoria.acao}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {auditoria.nome_filial || "N/A"}
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      title={auditoria.descricao}
                    >
                      <div className="max-w-xs truncate">
                        {auditoria.descricao}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginação */}
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
                    return (
                      <span key={page} className="px-2 text-gray-400">
                        ...
                      </span>
                    );
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
    </div>
  );
};

export default HistoricoUsuario;
