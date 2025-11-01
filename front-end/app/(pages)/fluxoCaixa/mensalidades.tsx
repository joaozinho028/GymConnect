import { ChevronDownIcon, ChevronUpIcon, User, UserCheck2Icon, UserCircle2Icon } from "lucide-react";
import React, { useState } from "react";

const Mensalidades = () => {
  // 🔹 Mock de dados estruturado
  const dadosMock = [
    {
      id_filial: 1,
      nome_filial: "Academia Central",
      alunos: [
        {
          id_aluno: 1,
          nome_aluno: "João Silva",
          mensalidades: [
            { id: 1, valor: 120, plano: "Mensal", vencimento: "2025-09-10", situacao: "Paga" },
            { id: 2, valor: 120, plano: "Mensal", vencimento: "2025-10-10", situacao: "Pendente" },
            { id: 3, valor: 120, plano: "Mensal", vencimento: "2025-11-10", situacao: "Atrasada" },
          ],
        },
        {
          id_aluno: 2,
          nome_aluno: "Maria Souza",
          mensalidades: [
            { id: 4, valor: 150, plano: "Trimestral", vencimento: "2025-09-05", situacao: "Paga" },
            { id: 5, valor: 150, plano: "Trimestral", vencimento: "2025-12-05", situacao: "Pendente" },
          ],
        },
      ],
    },
    {
      id_filial: 2,
      nome_filial: "Unidade Norte",
      alunos: [
        {
          id_aluno: 3,
          nome_aluno: "Carlos Pereira",
          mensalidades: [
            { id: 6, valor: 100, plano: "Mensal", vencimento: "2025-10-15", situacao: "Paga" },
            { id: 7, valor: 100, plano: "Mensal", vencimento: "2025-11-15", situacao: "Pendente" },
          ],
        },
      ],
    },
  ];


  const [alunoAberto, setAlunoAberto] = useState<number | null>(null);
  const [filtroSituacao, setFiltroSituacao] = useState<Record<number, string>>({}); // { [id_aluno]: 'Todos' }

  const toggleAluno = (id:any) => {
    setAlunoAberto(alunoAberto === id ? null : id);
  };

  const getCorSituacao = (situacao:any) => {
    switch (situacao) {
      case "Paga":
        return "bg-green-100 text-green-700";
      case "Pendente":
        return "bg-yellow-100 text-yellow-700";
      case "Atrasada":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleFiltroChange = (id_aluno: number, value: string) => {
    setFiltroSituacao((prev) => ({ ...prev, [id_aluno]: value }));
  };

 return (
     <div className="p-4 max-w-full mx-auto space-y-6">
          <h1 className="text-2xl font-semibold text-gray-800">Mensalidades</h1>

   
    {dadosMock.map((filial) => (
      <div key={filial.id_filial} className="bg-white border rounded-lg shadow-sm p-3 mb-6">
        <h2 className="text-base font-semibold text-blue-700 mb-2 flex items-center gap-2">
          <span className="text-sm">🏢</span>
          <span className="text-sm">{filial.nome_filial}</span>
        </h2>
        {filial.alunos.map((aluno) => (
          <div key={aluno.id_aluno} className="mb-2 border-b last:border-none pb-2">
            <div
              onClick={() => toggleAluno(aluno.id_aluno)}
              className="flex items-center justify-between cursor-pointer px-2 py-2 hover:bg-gray-50 rounded"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {aluno.nome_aluno}
                </span>
              </div>
              {alunoAberto === aluno.id_aluno ? (
                <ChevronUpIcon className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
              )}
            </div>
              {alunoAberto === aluno.id_aluno && (
                <>
                  <div className="mb-2 flex items-center gap-2">
                    <label htmlFor={`filtro-${aluno.id_aluno}`} className="text-xs text-gray-600">Filtrar:</label>
                    <select
                      id={`filtro-${aluno.id_aluno}`}
                      className="border rounded px-2 py-1 text-xs"
                      value={filtroSituacao[aluno.id_aluno] || "Todos"}
                      onChange={e => handleFiltroChange(aluno.id_aluno, e.target.value)}
                    >
                      <option value="Todos">Todos</option>
                      <option value="Pendente">Pendentes</option>
                      <option value="Atrasada">Atrasadas</option>
                      <option value="Paga">Pagas</option>
                    </select>
                  </div>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {aluno.mensalidades
                      .filter((m) => {
                        const filtro = filtroSituacao[aluno.id_aluno] || "Todos";
                        if (filtro === "Todos") return true;
                        return m.situacao === filtro;
                      })
                      .map((m) => (
                        <div
                          key={m.id}
                          className="flex flex-col gap-1 p-3 bg-gray-50 border rounded shadow-sm hover:shadow-md transition"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-base font-semibold text-gray-800">
                              R$ {m.valor.toFixed(2)}
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${getCorSituacao(
                                m.situacao
                              )}`}
                            >
                              {m.situacao}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">Plano: {m.plano}</div>
                          <div className="text-xs text-gray-600">
                            Vencimento: {new Date(m.vencimento).toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              )}
          </div>
        ))}
      </div>
    ))}
  </div>
);
};

export default Mensalidades;
