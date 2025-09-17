"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";
import { useState } from "react";

// Mock de dados de inadimplentes
const mockInadimplentes = [
  {
    id: "1",
    nome: "Carlos Souza",
    matricula: "A123",
    valor: 250,
    vencimento: "2025-08-10",
    diasAtraso: 32,
    filial: "Filial A",
    status: "Inadimplente",
  },
  {
    id: "2",
    nome: "Maria Oliveira",
    matricula: "B456",
    valor: 180,
    vencimento: "2025-08-15",
    diasAtraso: 27,
    filial: "Filial B",
    status: "Inadimplente",
  },
  {
    id: "3",
    nome: "João Lima",
    matricula: "C789",
    valor: 300,
    vencimento: "2025-08-20",
    diasAtraso: 22,
    filial: "Filial C",
    status: "Inadimplente",
  },
];

export default function InadimplenciaPage() {
  const [busca, setBusca] = useState("");
  const [filial, setFilial] = useState("");
  const [inadimplentes, setInadimplentes] = useState(mockInadimplentes);

  // Filtro simples
  const filtrados = inadimplentes.filter((i) => {
    const buscaLower = busca.toLowerCase();
    return (
      (!filial || i.filial === filial) &&
      (i.nome.toLowerCase().includes(buscaLower) ||
        i.matricula.toLowerCase().includes(buscaLower))
    );
  });

  // Exportação simples
  function exportToCSV() {
    const header = [
      "Nome",
      "Matrícula",
      "Valor",
      "Vencimento",
      "Dias em atraso",
      "Filial",
      "Status",
    ];
    const rows = filtrados.map((i) => [
      i.nome,
      i.matricula,
      i.valor,
      i.vencimento,
      i.diasAtraso,
      i.filial,
      i.status,
    ]);
    const csvContent = [header, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "inadimplentes.csv";
    link.click();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Consulta de Inadimplentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <div className="flex w-full sm:w-1/2 items-end gap-2">
              <Input
                type="text"
                placeholder="Buscar por nome ou matrícula..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="h-[42px]"
              />
              <select
                value={filial}
                onChange={(e) => setFilial(e.target.value)}
                className="h-[42px] border border-gray-300 rounded px-3 text-[#222222] bg-white"
                style={{ minWidth: 120 }}
              >
                <option value="">Todas Filiais</option>
                <option value="Filial A">Filial A</option>
                <option value="Filial B">Filial B</option>
                <option value="Filial C">Filial C</option>
              </select>
            </div>
            <div className="flex w-full sm:w-1/2 justify-end">
              <Button
                className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm"
                onClick={exportToCSV}
                type="button"
                title="Exportar CSV"
              >
                <Copy size={16} /> CSV
              </Button>
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
                    Nome
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Matrícula
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Valor
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Vencimento
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Dias em atraso
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Filial
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody
                className="bg-white divide-y divide-gray-100"
                style={{ height: "300px" }}
              >
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-gray-400">
                      Nenhum inadimplente encontrado.
                    </td>
                  </tr>
                ) : (
                  filtrados.map((i) => (
                    <tr
                      key={i.id}
                      className="hover:bg-gray-50"
                      style={{ height: "60px" }}
                    >
                      <td className="px-4 py-2">{i.nome}</td>
                      <td className="px-4 py-2">{i.matricula}</td>
                      <td className="px-4 py-2">
                        R$ {i.valor.toLocaleString()}
                      </td>
                      <td className="px-4 py-2">{i.vencimento}</td>
                      <td className="px-4 py-2">{i.diasAtraso}</td>
                      <td className="px-4 py-2">{i.filial}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700">
                          {i.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <Button
                          size="sm"
                          className="bg-green-100 text-green-700 hover:bg-green-200"
                          onClick={() =>
                            alert(`Cobrança enviada para ${i.nome}`)
                          }
                        >
                          Enviar cobrança
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
