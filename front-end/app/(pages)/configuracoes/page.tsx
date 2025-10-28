"use client";

import { usePermissions } from "@/hooks/usePermissions";
import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  DollarSign,
  FilesIcon,
  FileText,
  Layers,
  Search,
  Settings2,
  Settings2Icon,
  Smartphone,
  UserMinus2,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import CadastrarPerfis from "../cadastroPerfil/page";
import CadastrarUsuarios from "../cadastroUsuario/page";
import ConfiguracaoPlanos from "../configuracaoPlanos/page";
import ConfiguracoesApp from "../configuracoesApp/page";
import CadastrarCategoriaFluxo from "../configuracoesFluxoCaixa/categorias/categorias";
import ConsultaPerfis from "../consultaPerfis/page";
import ConsultaUsuarios from "../consultaUsuario/page";
import DadosBancarios from "../dadosBancarios/page";
import HistorioUsuario from "../historicoUsuario/page";
import ProfilePage from "../meuPerifl/page";

type MenuItem = {
  name: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  component?: React.FC<any>;
  submenu?: MenuItem[];
  permission?: string; // Nova propriedade para controle de permissão
};

export default function FormEditaPerfil() {
  const permissions = usePermissions();
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  // Menu com controle de permissões
  const menus: MenuItem[] = [
    {
      name: "Meu Perfil",
      icon: Layers,
      component: ProfilePage,
      // Meu Perfil sempre visível (sem restrição)
    },
    {
      name: "Informações Bancárias",
      icon: CreditCard,
      component: DadosBancarios,
      permission: "configuracoes.informacoes_bancarias",
    },
    // {
    //   name: "Plano Gym Connect",
    //   icon: Layers,
    //   component: PlanoGymConnect, // comentado temporariamente
    //   permission: "plano_gym_connect",
    // },
    {
      name: "Configurações Aplicativo", // comentado temporariamente
      icon: Smartphone,
      component: ConfiguracoesApp,
      permission: "configuracoes_app",
    },
    {
      name: "Histórico de Usuários",
      icon: UserMinus2,
      component: HistorioUsuario,
      permission: "configuracoes.historico_usuario",
    },
    {
      name: "Usuários",
      icon: Users,
      permission: "configuracoes.usuarios",
      submenu: [
        {
          name: "Cadastrar Usuário",
          icon: UserPlus,
          component: CadastrarUsuarios,
        },
        {
          name: "Consultar Usuários",
          icon: Search,
          component: ConsultaUsuarios,
        },
      ],
    },
    {
      name: "Perfil",
      icon: FileText,
      permission: "configuracoes.perfis",
      submenu: [
        {
          name: "Cadastro de Perfil",
          icon: UserPlus,
          component: CadastrarPerfis,
        },
        {
          name: "Consulta de Perfil",
          icon: Search,
          component: ConsultaPerfis,
        },
      ],
    },

    {
      name: "Ajustes Fluxo de Caixa",
      icon: Settings2Icon,
      permission: "ajuste_fluxo_caixa.categorias",
      submenu: [
        {
          name: "Categorias",
          icon: FilesIcon,
          component: CadastrarCategoriaFluxo,
        },
      ],
    },

    {
      name: "Precificação",
      icon: DollarSign,
      permission: "precificacao.planos",
      submenu: [
        {
          name: "Planos",
          icon: FilesIcon,
          component: ConfiguracaoPlanos,
        },
      ],
    },
  ];

  // Função para verificar se um menu deve ser visível baseado nas permissões
  const hasPermission = (permission?: string): boolean => {
    if (!permission) return true; // Se não tem permissão definida, sempre visível

    // Check if the permission has a dot notation for nested permissions
    if (permission.includes(".")) {
      const [section, key] = permission.split(".");
      const sectionValue = permissions[section as keyof typeof permissions];

      // Check if sectionValue is an object before trying to access property
      if (
        sectionValue &&
        typeof sectionValue === "object" &&
        key in sectionValue
      ) {
        return Boolean(sectionValue[key as keyof typeof sectionValue]);
      }
      return false;
    }

    return Boolean(
      permissions.configuracoes?.[
        permission as keyof typeof permissions.configuracoes
      ]
    );
  };

  // Filtra os menus baseado nas permissões
  const filteredMenus = menus.filter((menu) => hasPermission(menu.permission));

  // Estado para controlar qual menu e submenu está selecionado
  // Aqui guardamos índices: menuIndex e submenuIndex (opcional)
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);
  const [selectedSubmenuIndex, setSelectedSubmenuIndex] = useState<
    number | null
  >(null);

  // Ajusta o índice selecionado se não houver menus filtrados ou se o índice está fora dos limites
  useEffect(() => {
    if (filteredMenus.length === 0) {
      setSelectedMenuIndex(0);
      setSelectedSubmenuIndex(null);
    } else if (selectedMenuIndex >= filteredMenus.length) {
      setSelectedMenuIndex(0);
      setSelectedSubmenuIndex(null);
    }
  }, [filteredMenus.length, selectedMenuIndex]);

  // Estado para dropdowns abertos
  const [openDropdowns, setOpenDropdowns] = useState<{
    [key: string]: boolean;
  }>({});

  const toggleDropdown = (key: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Função para clicar em menu sem submenu
  const handleMenuClick = (index: number) => {
    setSelectedMenuIndex(index);
    setSelectedSubmenuIndex(null);
  };

  // Função para clicar em submenu
  const handleSubmenuClick = (menuIndex: number, submenuIndex: number) => {
    setSelectedMenuIndex(menuIndex);
    setSelectedSubmenuIndex(submenuIndex);
  };

  // Descobre qual componente deve ser renderizado
  let SelectedComponent: React.FC<any> | null = null;
  if (
    filteredMenus[selectedMenuIndex]?.submenu &&
    selectedSubmenuIndex !== null &&
    filteredMenus[selectedMenuIndex].submenu![selectedSubmenuIndex].component
  ) {
    SelectedComponent =
      filteredMenus[selectedMenuIndex].submenu![selectedSubmenuIndex]
        .component!;
  } else if (filteredMenus[selectedMenuIndex]?.component) {
    SelectedComponent = filteredMenus[selectedMenuIndex].component!;
  }

  if (!isDesktop) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-center p-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 max-w-md w-full">
          <Settings2 className="w-10 h-10 mx-auto mb-4 text-gray-500" />
          <h2 className="text-lg font-semibold mb-2">Configurações</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Esta área está disponível apenas em computadores e notebooks.
            <br />
            Acesse em uma tela maior para editar as configurações do sistema.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full h-[87vh] flex flex-col md:flex-row">
      {/* ...existing code... */}
      <nav className="w-64 md:w-64 bg-white dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700 p-4 h-full overflow-auto">
        {/* ...existing code... */}
        <p className="text-lg mb-4 flex items-center gap-2 dark:text-white font-semibold">
          <Settings2 className="w-6 h-6" />
          Configurações
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Selecione uma opção abaixo para editar as configurações do sistema.
        </p>
        <ul className="space-y-2 text-sm">
          {/* Renderiza apenas menus com permissão */}
          {filteredMenus.map((menu, i) => {
            const Icon = menu.icon;
            const isDropdownOpen = openDropdowns[menu.name] || false;
            const isMenuSelected =
              selectedMenuIndex === i && selectedSubmenuIndex === null;
            if (menu.submenu) {
              return (
                <li key={menu.name}>
                  <button
                    onClick={() => toggleDropdown(menu.name)}
                    className="w-full flex justify-between items-center p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-expanded={isDropdownOpen}
                    aria-controls={`${menu.name}-submenu`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      <span
                        className={`font-medium ${
                          isMenuSelected
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {menu.name}
                      </span>
                    </div>
                    {isDropdownOpen ? (
                      <ChevronUp className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                    )}
                  </button>
                  {isDropdownOpen && (
                    <ul
                      id={`${menu.name}-submenu`}
                      className="mt-1 ml-6 space-y-1 border-l border-gray-300 dark:border-gray-700 pl-4"
                    >
                      {menu.submenu.map((sub, j) => {
                        const SubIcon = sub.icon;
                        const isSubSelected =
                          selectedMenuIndex === i && selectedSubmenuIndex === j;
                        return (
                          <li key={sub.name}>
                            <button
                              onClick={() => handleSubmenuClick(i, j)}
                              className={`w-full flex items-center gap-2 p-2 rounded-lg cursor-pointer transition
                                ${
                                  isSubSelected
                                    ? "bg-gray-200 dark:bg-gray-700 font-semibold"
                                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                                }`}
                            >
                              <SubIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                              {sub.name}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }
            return (
              <li key={menu.name}>
                <button
                  onClick={() => handleMenuClick(i)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg cursor-pointer transition
                    ${
                      isMenuSelected
                        ? "bg-gray-200 dark:bg-gray-700 font-semibold"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                >
                  <Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  {menu.name}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <section className="flex-1 p-5 overflow-auto bg-white dark:bg-gray-800 h-full">
        {filteredMenus.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh] text-center p-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 max-w-md w-full">
              <Settings2 className="w-10 h-10 mx-auto mb-4 text-gray-500" />
              <h2 className="text-lg font-semibold mb-2">Acesso Restrito</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Você não possui permissões para acessar as configurações do
                sistema.
                <br />
                Entre em contato com o administrador para obter acesso.
              </p>
            </div>
          </div>
        ) : SelectedComponent ? (
          <SelectedComponent />
        ) : (
          <div>Selecione um menu</div>
        )}
      </section>
    </div>
  );
}
