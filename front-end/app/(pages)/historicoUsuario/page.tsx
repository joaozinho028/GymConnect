"use client";

import Button from "@/components/Forms/Button";
import Input from "@/components/Forms/Input";
import InputSelectComponent from "@/components/Forms/InputSelect";
import { useAuth } from "@/contexts/AuthContext";
import { GetForm } from "@/utils";
import {
  Copy,
  FileDown,
  FileSpreadsheet,
  FileText,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import * as yup from "yup";

// Mock de logs do sistema
const logsMock = [
  {
    id: 1,
    filial: "1",
    tipo: "Filial",
    acao: "Cadastro de Filial",
    usuario: "Admin",
    data: "10/08/2025 10:00",
  },
  {
    id: 2,
    filial: "2",
    tipo: "Aluno",
    acao: "Edição de Aluno",
    usuario: "João",
    data: "11/08/2025 12:30",
  },
  {
    id: 3,
    filial: "1",
    tipo: "Usuário",
    acao: "Exclusão de Usuário",
    usuario: "Maria",
    data: "12/08/2025 09:15",
  },
  {
    id: 4,
    filial: "1",
    tipo: "Perfil",
    acao: "Cadastro de Perfil",
    usuario: "Admin",
    data: "12/08/2025 11:00",
  },
  {
    id: 5,
    filial: "2",
    tipo: "Configuração App",
    acao: "Edição de Informações para o aplicativo",
    usuario: "Admin",
    data: "13/08/2025 14:45",
  },
];

// Funções de exportação
function exportToCSV(data: any[]) {
  const header = ["Data", "Usuário", "Tipo", "Ação", "Filial"];
  const rows = data.map((log) => [
    log.data,
    log.usuario,
    log.tipo,
    log.acao,
    `Filial ${log.filial}`,
  ]);
  const csvContent = [header, ...rows]
    .map((e) => e.map((v) => `"${v}"`).join(","))
    .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "logs.csv");
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
      <th style="padding:4px;border:1px solid #ccc;">Data</th>
      <th style="padding:4px;border:1px solid #ccc;">Usuário</th>
      <th style="padding:4px;border:1px solid #ccc;">Tipo</th>
      <th style="padding:4px;border:1px solid #ccc;">Ação</th>
      <th style="padding:4px;border:1px solid #ccc;">Filial</th>
    </tr>`;
  const rows = data
    .map(
      (log) => `<tr>
      <td style="padding:4px;border:1px solid #ccc;">${log.data}</td>
      <td style="padding:4px;border:1px solid #ccc;">${log.usuario}</td>
      <td style="padding:4px;border:1px solid #ccc;">${log.tipo}</td>
      <td style="padding:4px;border:1px solid #ccc;">${log.acao}</td>
      <td style="padding:4px;border:1px solid #ccc;">Filial ${log.filial}</td>
    </tr>`
    )
    .join("");
  printWindow.document.write(`
    <html>
      <head><title>Logs</title></head>
      <body>
        <h2>Histórico de Logs</h2>
        <table style="border-collapse:collapse;width:100%">${header}${rows}</table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

function copyTable(data: any[]) {
  const header = ["Data", "Usuário", "Tipo", "Ação", "Filial"];
  const rows = data.map((log) => [
    log.data,
    log.usuario,
    log.tipo,
    log.acao,
    `Filial ${log.filial}`,
  ]);
  const tableText = [header, ...rows].map((e) => e.join("\t")).join("\n");
  navigator.clipboard.writeText(tableText);
  alert("Tabela copiada para a área de transferência!");
}

const HistoricoUsuario = ({ ...rest }: any) => {
  const [filial, setFilial] = useState("");
  const [tipo, setTipo] = useState("");
  const [usuario, setUsuario] = useState("");

  const yupSchema = yup.object().shape({
    filial: yup.string().required("Selecione a filial"),
  });

  const { handleSubmit, ...form } = GetForm(yupSchema);
  const [opcaoFilial, setOpcaoFilial] = useState([]);
  const { token } = useAuth();

  // Filtra logs
  const logsFiltrados = logsMock.filter(
    (log) =>
      (!filial || log.filial === filial) &&
      (!tipo || log.tipo === tipo) &&
      (!usuario || log.usuario.toLowerCase().includes(usuario.toLowerCase()))
  );

  useEffect(() => {
    async function fetchBuscaFiliais() {
      try {
        const resFilial = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/empresas/listar-filiais`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (resFilial.ok) {
          const dataFilial = await resFilial.json();
          setOpcaoFilial(
            (dataFilial || []).map((f: any) => ({
              value: f.id_filial ?? f.id,
              label: f.nome_filial ?? f.nome,
            }))
          );
        }
      } catch (err) {
        // Silenciar erro, pode exibir alerta se desejar
      }
    }
    fetchBuscaFiliais();
  }, []);
  return (
    <div className="p-4 max-w-7xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold">Histórico do Sistema</h1>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InputSelectComponent
          label="Filial"
          name="filial"
          required
          formulario={form}
          value={filial}
          onChange={(e) => setFilial(e.target.value)}
          options={opcaoFilial}
          width="w-full"
        />

        <Input
          label="Nome do Usuario"
          name="nome"
          required
          formulario={form}
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          width="w-full"
          placeholder="Ex.: João Paulo"
        />

        <Button
          className="p-2 w-full h-[38px] mt-7 bg-green-600 cursor-pointer hover:bg-green-700 text-white hover:text-white"
          type="submit"
        >
          <Search size={18} className="inline-block mr-2" />
          Buscar
        </Button>
      </div>

      {/* Botões de exportação */}
      <div className="flex w-full justify-end mt-4">
        <div className="flex flex-wrap gap-2">
          <button
            className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm"
            onClick={() => exportToCSV(logsFiltrados)}
          >
            <FileText size={16} /> CSV
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-green-100 text-green-700 hover:bg-green-200 text-sm"
            onClick={() => exportToExcel(logsFiltrados)}
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-red-100 text-red-700 hover:bg-red-200 text-sm"
            onClick={() => exportToPDF(logsFiltrados)}
          >
            <FileDown size={16} /> PDF
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
            onClick={() => copyTable(logsFiltrados)}
          >
            <Copy size={16} /> Copiar
          </button>
        </div>
      </div>

      {/* Tabela de logs */}
      <div className="overflow-x-auto bg-white border rounded-lg shadow-sm mt-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Usuário
              </th>

              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Ação
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Filial
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Data
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {logsFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-400">
                  Nenhum log encontrado.
                </td>
              </tr>
            ) : (
              logsFiltrados.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{log.usuario}</td>
                  <td className="px-4 py-2">{log.acao}</td>
                  <td className="px-4 py-2">{`Filial ${log.filial}`}</td>
                  <td className="px-4 py-2">{log.data}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoricoUsuario;
