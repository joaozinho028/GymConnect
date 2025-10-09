"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  Activity,
  AlertTriangle,
  Bell,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Plus,
  TrendingUp,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

type RecentActivity = {
  id: string;
  type: "aluno" | "pagamento" | "vencimento";
  message: string;
  timestamp: Date;
  priority: "low" | "medium" | "high";
};

type QuickAction = {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
};

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
  const [loadingStats, setLoadingStats] = useState(false);

  // Dados simulados para demonstração
  const [recentActivities] = useState<RecentActivity[]>([
    {
      id: "1",
      type: "aluno",
      message: "João Silva foi cadastrado",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min atrás
      priority: "low",
    },
    {
      id: "2",
      type: "pagamento",
      message: "Pagamento de Maria Santos foi confirmado",
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1h atrás
      priority: "medium",
    },
    {
      id: "3",
      type: "vencimento",
      message: "5 mensalidades vencem hoje",
      timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2h atrás
      priority: "high",
    },
    {
      id: "4",
      type: "aluno",
      message: "Pedro Costa atualizou seus dados",
      timestamp: new Date(Date.now() - 1000 * 60 * 180), // 3h atrás
      priority: "low",
    },
  ]);

  const quickActions: QuickAction[] = [
    {
      title: "Novo Aluno",
      description: "Cadastrar novo aluno",
      icon: <Plus size={24} />,
      href: "/alunos",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "Gerenciar Pagamentos",
      description: "Ver pagamentos pendentes",
      icon: <DollarSign size={24} />,
      href: "/pagamentos",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "Relatórios",
      description: "Gerar relatórios",
      icon: <FileText size={24} />,
      href: "/relatorios",
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      title: "Fluxo de Caixa",
      description: "Visualizar fluxo financeiro",
      icon: <TrendingUp size={24} />,
      href: "/fluxoCaixa",
      color: "bg-orange-500 hover:bg-orange-600",
    },
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && token && user && !adminLoading) {
      if (isAdmin) {
        carregarFiliais();
      } else {
        setSelectedFilial(user.id_filial);
        setLoading(false);
      }
    }
  }, [isAuthenticated, token, user, isAdmin, adminLoading]);

  useEffect(() => {
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
        setFiliais(data);

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
        setEstatisticas(data);
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 60) {
      return `${minutes}min atrás`;
    } else if (hours < 24) {
      return `${hours}h atrás`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-orange-600 bg-orange-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "aluno":
        return <Users size={16} className="text-blue-500" />;
      case "pagamento":
        return <DollarSign size={16} className="text-green-500" />;
      case "vencimento":
        return <AlertTriangle size={16} className="text-red-500" />;
      default:
        return <Activity size={16} className="text-gray-500" />;
    }
  };

  const selectedFilialData = filiais.find(
    (f) => f.id_filial === selectedFilial
  );

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      {/* Header com boas-vindas */}

      {/* Loading de verificação de permissões */}
      {adminLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Verificando permissões...</p>
          </div>
        </div>
      )}

      {/* Select de filial - apenas para administrador */}
      {!adminLoading && isAdmin && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4">
            <label
              className="font-medium text-gray-700"
              htmlFor="filial-select"
            >
              Filial:
            </label>
            <select
              id="filial-select"
              value={selectedFilial || ""}
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  setSelectedFilial(Number(value));
                }
              }}
              className="border rounded px-3 py-2 text-gray-700 bg-white min-w-[200px] cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm text-gray-500">
                  Carregando filiais...
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Total Cadastrados
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {loadingStats ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  estatisticas.cadastrados.toLocaleString()
                )}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Alunos Ativos
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {loadingStats ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  estatisticas.ativos.toLocaleString()
                )}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-gray-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Alunos Inativos
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {loadingStats ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  estatisticas.inativos.toLocaleString()
                )}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <UserX className="h-8 w-8 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Inadimplentes
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {loadingStats ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  estatisticas.inadimplentes.toLocaleString()
                )}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Seção inferior com atividades recentes e lembretes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atividades recentes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity size={20} className="text-blue-500" />
              Atividades Recentes
            </h2>
            <button className="text-blue-500 hover:text-blue-700 text-sm font-medium">
              Ver todas
            </button>
          </div>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className={`flex items-start gap-3 p-3 rounded-lg ${getPriorityColor(
                  activity.priority
                )}`}
              >
                <div className="mt-1">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Clock size={12} />
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lembretes e notificações */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Bell size={20} className="text-orange-500" />
              Lembretes
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
              <Calendar size={20} className="text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Vencimentos Hoje
                </p>
                <p className="text-xs text-gray-600">
                  5 mensalidades vencem hoje. Verificar pagamentos pendentes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <TrendingUp size={20} className="text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Relatório Mensal
                </p>
                <p className="text-xs text-gray-600">
                  Gerar relatório mensal até o final da semana.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
              <Users size={20} className="text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Meta de Cadastros
                </p>
                <p className="text-xs text-gray-600">
                  Faltam 3 cadastros para atingir a meta mensal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
