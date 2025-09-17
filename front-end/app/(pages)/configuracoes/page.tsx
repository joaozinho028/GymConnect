"use client";

import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  FileText,
  Layers,
  Search,
  Settings2,
  UserMinus2,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";

import CadastrarPerfis from "../cadastroPerfil/page";
import CadastrarUsuarios from "../cadastroUsuario/page";
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
};

export default function FormEditaPerfil() {
  // Menu estático (não modificado)
  const menus: MenuItem[] = [
    {
      name: "Meu Perfil",
      icon: Layers,
      component: ProfilePage,
    },
    {
      name: "Informações Bancárias",
      icon: CreditCard,
      component: DadosBancarios,
    },
    // {
    //   name: "Plano Gym Connect",
    //   icon: Layers,
    //   component: PlanoGymConnect, // comentado temporariamente
    // },
    // {
    //   name: "Configurações Aplicativo", // comentado temporariamente
    //   icon: Smartphone,
    //   component: ConfiguracoesApp,
    // },
    {
      name: "Histórico de Usuários",
      icon: UserMinus2,
      component: HistorioUsuario,
    },
    {
      name: "Usuários",
      icon: Users,
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
  ];

  // Estado para controlar qual menu e submenu está selecionado
  // Aqui guardamos índices: menuIndex e submenuIndex (opcional)
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);
  const [selectedSubmenuIndex, setSelectedSubmenuIndex] = useState<
    number | null
  >(null);

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
    menus[selectedMenuIndex].submenu &&
    selectedSubmenuIndex !== null &&
    menus[selectedMenuIndex].submenu![selectedSubmenuIndex].component
  ) {
    SelectedComponent =
      menus[selectedMenuIndex].submenu![selectedSubmenuIndex].component!;
  } else if (menus[selectedMenuIndex].component) {
    SelectedComponent = menus[selectedMenuIndex].component!;
  }

  return (
    <div className="w-full h-[87vh] flex flex-col md:flex-row">
      <nav className="w-64 md:w-64 bg-white dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700 p-4 h-full overflow-auto">
        <p className="text-lg mb-4 flex items-center gap-2 dark:text-white font-semibold">
          <Settings2 className="w-6 h-6" />
          Configurações
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Selecione uma opção abaixo para editar as configurações do sistema.
        </p>

        <ul className="space-y-2 text-sm">
          {menus.map((menu, i) => {
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
        {SelectedComponent ? (
          <SelectedComponent />
        ) : (
          <div>Selecione um menu</div>
        )}
      </section>
    </div>
  );
}
