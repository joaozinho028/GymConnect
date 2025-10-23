"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CashFlowItem = { month: string; entrada: number; saida: number };

type FilialData = {
  id_filial: number;
  nome_filial: string;
};

type EstatisticasData = {
  cadastrados: number;
  ativos: number;
  inativos: number;
  inadimplentes: number;
};

// Dados mockados do gráfico (manter como está)
const cashFlowMockData: CashFlowItem[] = [
  { month: "Janeiro", entrada: 12000, saida: 5000 },
  { month: "Fevereiro", entrada: 10000, saida: 4000 },
  { month: "Março", entrada: 15000, saida: 6000 },
  { month: "Abril", entrada: 9000, saida: 3000 },
  { month: "Maio", entrada: 13000, saida: 7000 },
  { month: "Junho", entrada: 11000, saida: 4000 },
  { month: "Julho", entrada: 14000, saida: 5000 },
  { month: "Agosto", entrada: 12500, saida: 5500 },
  { month: "Setembro", entrada: 0, saida: 0 },
  { month: "Outubro", entrada: 0, saida: 0 },
  { month: "Novembro", entrada: 0, saida: 0 },
  { month: "Dezembro", entrada: 0, saida: 0 },
];

export default function DashboardPage() {
  const { isAuthenticated, token, user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const router = useRouter();

  // Estados para dados reais
  const [filiais, setFiliais] = useState<FilialData[]>([]);
  const [selectedFilial, setSelectedFilial] = useState<number | null>(null);
  const [estatisticas, setEstatisticas] = useState<EstatisticasData>({
    cadastrados: 0,
    ativos: 0,
    inativos: 0,
    inadimplentes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false); // Estados para o gráfico (dados mockados)
  const [selectedMonths, setSelectedMonths] = useState<string[]>(["Agosto"]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Carregar filiais quando o componente montar (apenas para administradores)
  useEffect(() => {
    console.log(
      "useEffect carregarFiliais - isAuthenticated:",
      isAuthenticated,
      "token:",
      !!token,
      "user:",
      !!user,
      "isAdmin:",
      isAdmin,
      "adminLoading:",
      adminLoading
    );
    if (isAuthenticated && token && user && !adminLoading) {
      if (isAdmin) {
        carregarFiliais();
      } else {
        // Se não for admin, usar apenas a filial do usuário
        setSelectedFilial(user.id_filial);
        setLoading(false);
      }
    }
  }, [isAuthenticated, token, user, isAdmin, adminLoading]);

  // Carregar estatísticas quando a filial for selecionada
  useEffect(() => {
    console.log(
      "useEffect carregarEstatisticas - selectedFilial:",
      selectedFilial,
      "token:",
      !!token
    );
    if (selectedFilial && token) {
      carregarEstatisticas(selectedFilial);
    }
  }, [selectedFilial, token]);

  const carregarFiliais = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/empresas/listar-filiais`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Filiais carregadas:", data);
        setFiliais(data);

        // Definir filial padrão como a do usuário logado
        if (user?.id_filial && data.length > 0) {
          const filialExiste = data.find(
            (f: FilialData) => f.id_filial === user.id_filial
          );
          if (filialExiste) {
            setSelectedFilial(user.id_filial);
          } else {
            setSelectedFilial(data[0].id_filial);
          }
        } else if (data.length > 0) {
          setSelectedFilial(data[0].id_filial);
        }
      } else {
        console.error("Erro ao carregar filiais");
      }
    } catch (error) {
      console.error("Erro ao carregar filiais:", error);
    } finally {
      setLoading(false);
    }
  };

  const carregarEstatisticas = async (idFilial: number) => {
    try {
      setLoadingStats(true);
      console.log("Carregando estatísticas para filial:", idFilial);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/alunos/estatisticas/${idFilial}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Estatísticas carregadas:", data);
        setEstatisticas(data);
      } else {
        console.error("Erro ao carregar estatísticas");
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const toggleMonth = (month: string) => {
    setSelectedMonths((prev) => {
      if (prev.includes(month)) {
        return prev.filter((m) => m !== month);
      } else if (prev.length < 4) {
        return [...prev, month];
      } else {
        return prev; // limita a 4 meses
      }
    });
  };

  const filteredData = cashFlowMockData.filter((item) =>
    selectedMonths.includes(item.month)
  );

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-8">
      {/* Loading de verificação de permissões */}
      {adminLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Verificando permissões...</p>
          </div>
        </div>
      )}

      {/* Select de filial - apenas para administrador */}
      {!adminLoading && isAdmin && (
        <div className="mb-6 flex items-center gap-4">
          <label className="font-medium text-gray-700" htmlFor="filial-select">
            Filial:
          </label>
          <select
            id="filial-select"
            value={selectedFilial || ""}
            onChange={(e) => {
              const value = e.target.value;
              console.log("Filial selecionada:", value);
              if (value) {
                const filialId = Number(value);
                setSelectedFilial(filialId);
                setSelectedMonths(["Agosto"]);
              }
            }}
            className="border rounded px-3 py-2 text-gray-700 bg-white min-w-[200px] cursor-pointer"
            disabled={loading || filiais.length === 0}
          >
            {loading ? (
              <option value="">Carregando...</option>
            ) : filiais.length === 0 ? (
              <option value="">Nenhuma filial encontrada</option>
            ) : (
              <>
                <option value="">Selecione uma filial</option>
                {filiais.map((filial) => (
                  <option key={filial.id_filial} value={filial.id_filial}>
                    {filial.nome_filial}
                  </option>
                ))}
              </>
            )}
          </select>
          {loading && (
            <span className="text-sm text-gray-500">Carregando filiais...</span>
          )}
        </div>
      )}

      {/* Cards principais */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-green-100 text-green-800 shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-700">
            Alunos Cadastrados
          </h2>
          <p className="mt-2 text-3xl font-bold">
            {loadingStats ? "..." : estatisticas.cadastrados.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Alunos Cadastrados</p>
        </div>
        <div className="bg-green-100 text-green-800 shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-700">Alunos Ativos</h2>
          <p className="mt-2 text-3xl font-bold">
            {loadingStats ? "..." : estatisticas.ativos.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Alunos Ativos</p>
        </div>
        <div className="bg-green-100 text-green-800 shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-700">
            Alunos Inativos
          </h2>
          <p className="mt-2 text-3xl font-bold">
            {loadingStats ? "..." : estatisticas.inativos.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Alunos Inativos</p>
        </div>
        <div className="bg-green-100 text-green-800 shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-700">
            Pagamentos Inadimplentes
          </h2>
          <p className="mt-2 text-3xl font-bold">
            {loadingStats ? "..." : estatisticas.inadimplentes.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Pagamentos Inadimplentes</p>
        </div>
      </div>

      {/* Seletor de meses - apenas para administrador */}
      {!adminLoading && isAdmin && (
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Selecionar até 4 meses:
          </h2>
          <div className="flex flex-wrap gap-2">
            {cashFlowMockData.map((item) => (
              <button
                key={item.month}
                className={`px-4 py-2 rounded-full border ${
                  selectedMonths.includes(item.month)
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
                onClick={() => toggleMonth(item.month)}
              >
                {item.month}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Gráfico de fluxo de caixa - apenas para administrador */}
      {!adminLoading && isAdmin && (
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Fluxo de Caixa (Dados Simulados)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="entrada" fill="#4ade80" name="Entradas" />
              <Bar dataKey="saida" fill="#f87171" name="Saídas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
