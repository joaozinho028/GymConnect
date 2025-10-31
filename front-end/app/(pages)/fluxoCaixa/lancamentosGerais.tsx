

import React, { useState, useMemo } from "react";
import { Copy, FileDown, FileSpreadsheet, FileText } from "lucide-react";

type Lancamento = {
  id: string;
  description: string;
  usuario: string;
  date: string;
  type: string;
  recorrente?: boolean;
  dataInicio?: string;
  dataFim?: string;
};

interface LancamentosGeraisProps {
  lancamentos: Lancamento[];
}

function exportToCSV(data: Lancamento[]) {
  const header = ["Lançamento", "Usuário", "Data", "Tipo", "Recorrente", "Período"];
  const rows = data.map((t) => [
    t.description,
    t.usuario || "-",
    t.date,
    t.type,
    t.recorrente ? "Sim" : "Não",
    t.recorrente ? `${t.dataInicio || "-"} até ${t.dataFim || "-"}` : "-"
  ]);
  const csvContent = [header, ...rows].map((e) => e.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "lancamentos.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportToExcel(data: Lancamento[]) {
  exportToCSV(data);
}

function exportToPDF(data: Lancamento[]) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  const header = `<tr>
      <th style="padding:4px;border:1px solid #ccc;">Lançamento</th>
      <th style="padding:4px;border:1px solid #ccc;">Usuário</th>
      <th style="padding:4px;border:1px solid #ccc;">Data</th>
      <th style="padding:4px;border:1px solid #ccc;">Tipo</th>
      <th style="padding:4px;border:1px solid #ccc;">Recorrente</th>
      <th style="padding:4px;border:1px solid #ccc;">Período</th>
    </tr>`;
  const rows = data
    .map(
      (t) => `<tr>
      <td style="padding:4px;border:1px solid #ccc;">${t.description}</td>
      <td style="padding:4px;border:1px solid #ccc;">${t.usuario || "-"}</td>
      <td style="padding:4px;border:1px solid #ccc;">${t.date}</td>
      <td style="padding:4px;border:1px solid #ccc;">${t.type}</td>
      <td style="padding:4px;border:1px solid #ccc;">${t.recorrente ? "Sim" : "Não"}</td>
      <td style="padding:4px;border:1px solid #ccc;">${t.recorrente ? `${t.dataInicio || "-"} até ${t.dataFim || "-"}` : "-"}</td>
    </tr>`
    )
    .join("");
  printWindow.document.write(`
    <html>
      <head><title>Lançamentos Gerais</title></head>
      <body>
        <h2>Lançamentos Gerais</h2>
        <table style="border-collapse:collapse;width:100%">${header}${rows}</table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

function copyTable(data: Lancamento[]) {
  const header = ["Lançamento", "Usuário", "Data", "Tipo", "Recorrente", "Período"];
  const rows = data.map((t) => [
    t.description,
    t.usuario || "-",
    t.date,
    t.type,
    t.recorrente ? "Sim" : "Não",
    t.recorrente ? `${t.dataInicio || "-"} até ${t.dataFim || "-"}` : "-"
  ]);
  const tableText = [header, ...rows].map((e) => e.join("\t")).join("\n");
  navigator.clipboard.writeText(tableText);
  alert("Tabela copiada para a área de transferência!");
}

const LancamentosGerais: React.FC<LancamentosGeraisProps> = ({ lancamentos }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Filtra os dados com base no termo de busca
  const filteredLancamentos = useMemo(() => {
    if (!searchTerm) return lancamentos;
    return lancamentos.filter(
      (t) =>
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.usuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.type?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [lancamentos, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredLancamentos.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageItems = filteredLancamentos.slice(startIndex, endIndex);

  // Reset da página quando busca
  React.useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  return (
    <div className="p-4 max-w-full mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Lançamentos Gerais</h1>

      {/* Campo de busca */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Buscar por lançamento, usuário ou tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-3 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Botões de exportação */}
        <div className="flex flex-wrap gap-2">
          <button
            className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm"
            onClick={() => exportToCSV(filteredLancamentos)}
            disabled={filteredLancamentos.length === 0}
          >
            <FileText size={16} /> CSV
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-green-100 text-green-700 hover:bg-green-200 text-sm"
            onClick={() => exportToExcel(filteredLancamentos)}
            disabled={filteredLancamentos.length === 0}
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-red-100 text-red-700 hover:bg-red-200 text-sm"
            onClick={() => exportToPDF(filteredLancamentos)}
            disabled={filteredLancamentos.length === 0}
          >
            <FileDown size={16} /> PDF
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
            onClick={() => copyTable(filteredLancamentos)}
            disabled={filteredLancamentos.length === 0}
          >
            <Copy size={16} /> Copiar
          </button>
        </div>
      </div>

      {/* Informações de resultados */}
      <div className="text-sm text-gray-600">
        Mostrando {startIndex + 1} a {Math.min(endIndex, filteredLancamentos.length)} de {filteredLancamentos.length} registros
      </div>

      {/* Tabela de lançamentos com scroll horizontal */}
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Lançamento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Usuário</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Recorrente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Período</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    Nenhum lançamento encontrado.
                  </td>
                </tr>
              ) : (
                <>
                  {pageItems.map((t, idx) => (
                    <tr key={t.id || idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm whitespace-nowrap">{t.description}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">{t.usuario || "-"}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">{t.date}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">{t.type}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">{t.recorrente ? "Sim" : "Não"}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">{t.recorrente ? `${t.dataInicio || "-"} até ${t.dataFim || "-"}` : "-"}</td>
                    </tr>
                  ))}
                  {/* Linhas invisíveis para completar 10 */}
                  {Array.from({ length: Math.max(0, 10 - pageItems.length) }).map((_, idx) => (
                    <tr key={"empty-" + idx} className="invisible">
                      <td className="px-4 py-3 text-sm whitespace-nowrap">&nbsp;</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">&nbsp;</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">&nbsp;</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">&nbsp;</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">&nbsp;</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">&nbsp;</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, index) => {
                const pageNum = index + 1;
                const showPage =
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= page - 2 && pageNum <= page + 2);
                if (!showPage) {
                  if (pageNum === page - 3 || pageNum === page + 3) {
                    return (
                      <span key={pageNum} className="px-2 text-gray-400">...</span>
                    );
                  }
                  return null;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      page === pageNum
                        ? "text-blue-600 bg-blue-50 border border-blue-300"
                        : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LancamentosGerais;
