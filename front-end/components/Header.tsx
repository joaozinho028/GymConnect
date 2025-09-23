"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import {
  BarChart2,
  Building2,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Search,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { FC, useEffect, useState } from "react";

interface UserInfo {
  name: string;
  email: string;
  avatarUrl?: string;
  nameEmpresa?: string;
}

interface HeaderProps {
  onLogout?: () => void;
  user?: UserInfo;
}

const Header: FC<HeaderProps> = () => {
  const { logout, token } = useAuth();
  const permissions = usePermissions();
  const [userData, setUserData] = useState<any>(null);
  const [empresaData, setEmpresaData] = useState<any>(null);
  const [filialData, setFilialData] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (!token) return;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/profile`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      setUserData(data.usuario);
      setEmpresaData(data.empresa);
      setFilialData(data.filial);
    }
    fetchProfile();
  }, [token]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-14 bg-[#64FA36] shadow-md flex items-center px-4 sm:px-6">
      {/* Botão hamburguer mobile/tablet portrait */}
      <button
        className="lg:hidden mr-3 p-2 rounded focus:outline-none focus:ring-2 focus:ring-black/20"
        onClick={() => setSidebarOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu size={26} />
      </button>
      {/* Logo / Título */}
      <span className="text-black font-semibold text-lg tracking-wide select-none">
        Gym Connect
      </span>
      {/* Menu horizontal só em telas grandes (lg+) */}
      <div className="ml-8 hidden lg:flex items-center gap-6 text-black font-semibold text-sm">
        <Link
          href="/inicio"
          className="flex items-center gap-2 hover:underline cursor-pointer"
        >
          <LayoutDashboard size={16} />
          Dashboard
        </Link>

        {/* Dropdown Filiais - Só aparece se tiver permissão */}
        {permissions.filiais && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 cursor-pointer focus:outline-none">
              <Building2 size={16} />
              Filiais
              <ChevronDown size={14} className="ml-1" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white text-black rounded shadow-md mt-2">
              <DropdownMenuItem asChild>
                <Link
                  href="/cadastroFiliais"
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <PlusCircle size={14} />
                  Cadastro de Filiais
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/consultaFiliais"
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <Search size={14} />
                  Consulta de Filiais
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Dropdown Alunos - Só aparece se tiver permissão */}
        {permissions.alunos && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 cursor-pointer focus:outline-none">
              <GraduationCap size={16} />
              Alunos
              <ChevronDown size={14} className="ml-1" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white text-black rounded shadow-md mt-2">
              <DropdownMenuItem asChild>
                <Link
                  href="/cadastroAlunos"
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <PlusCircle size={14} />
                  Cadastro de Alunos
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/consultaAlunos"
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <Search size={14} />
                  Consulta de Alunos
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Fluxo de Caixa - Só aparece se tiver permissão */}
        {permissions.fluxo_caixa && (
          <Link
            href="fluxoCaixa"
            className="flex items-center gap-2 hover:underline cursor-pointer"
          >
            <BarChart2 size={16} />
            Fluxo de Caixa
          </Link>
        )}

        <Link
          href="/configuracoes"
          className="flex items-center gap-2 hover:underline cursor-pointer"
        >
          <Settings size={16} />
          Configurações
        </Link>
      </div>

      {/* Avatar do usuário */}
      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-5 mt-1 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer">
              <Avatar className="h-12 w-12 border-2 border-white/40">
                <AvatarImage
                  src={
                    userData?.avatar_url ||
                    (userData?.nome_usuario
                      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          userData.nome_usuario
                        )}`
                      : undefined)
                  }
                  alt={userData?.nome_usuario || "Usuário"}
                />
                <AvatarFallback className="bg-white text-[#151515] font-semibold uppercase">
                  {userData?.nome_usuario?.[0] ?? "U"}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <div className="space-y-1 ml-1.5 mt-2">
              <p className="text-sm font-semibold text-foreground">
                {userData?.nome_usuario || "Usuário"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Empresa: {empresaData?.nome_empresa || "-"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Filial: {filialData?.nome_filial || "-"}
              </p>
            </div>
            <DropdownMenuSeparator />
            <div className="space-y-2">
              <DropdownMenuItem
                onClick={logout}
                className="w-full text-sm text-red-600 cursor-pointer hover:text-red-700"
              >
                <LogOut size={16} className="mr-2" />
                Sair
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar */}
          <nav className="relative w-64 max-w-[80vw] h-full bg-white shadow-lg p-6 flex flex-col gap-4 animate-slide-in-left">
            <button
              className="absolute top-3 right-3 text-gray-600 hover:text-black"
              onClick={() => setSidebarOpen(false)}
              aria-label="Fechar menu"
            >
              ×
            </button>
            <span className="text-black font-semibold text-xl mb-4">Menu</span>
            <Link
              href="/inicio"
              className="flex items-center gap-2 py-2 text-black hover:underline"
              onClick={() => setSidebarOpen(false)}
            >
              <LayoutDashboard size={18} /> Dashboard
            </Link>

            {/* Filiais - Mobile - Só aparece se tiver permissão */}
            {permissions.filiais && (
              <div>
                <span className="text-xs text-gray-500 font-semibold">
                  Filiais
                </span>
                <div className="flex flex-col ml-2">
                  <Link
                    href="/cadastroFiliais"
                    className="flex items-center gap-2 py-1 text-black hover:underline"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <PlusCircle size={16} /> Cadastro de Filiais
                  </Link>
                  <Link
                    href="/consultaFiliais"
                    className="flex items-center gap-2 py-1 text-black hover:underline"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Search size={16} /> Consulta de Filiais
                  </Link>
                </div>
              </div>
            )}

            {/* Alunos - Mobile - Só aparece se tiver permissão */}
            {permissions.alunos && (
              <div>
                <span className="text-xs text-gray-500 font-semibold">
                  Alunos
                </span>
                <div className="flex flex-col ml-2">
                  <Link
                    href="/cadastroAlunos"
                    className="flex items-center gap-2 py-1 text-black hover:underline"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <PlusCircle size={16} /> Cadastro de Alunos
                  </Link>
                  <Link
                    href="/consultaAlunos"
                    className="flex items-center gap-2 py-1 text-black hover:underline"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Search size={16} /> Consulta de Alunos
                  </Link>
                </div>
              </div>
            )}

            {/* Fluxo de Caixa - Mobile - Só aparece se tiver permissão */}
            {permissions.fluxo_caixa && (
              <Link
                href="/fluxoCaixa"
                className="flex items-center gap-2 py-2 text-black hover:underline"
                onClick={() => setSidebarOpen(false)}
              >
                <BarChart2 size={18} /> Fluxo de Caixa
              </Link>
            )}
            <Link
              href="/configuracoes"
              className="flex items-center gap-2 py-2 text-black hover:underline"
              onClick={() => setSidebarOpen(false)}
            >
              <Settings size={18} /> Configurações
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="mt-4 flex items-center gap-2 p-2 rounded bg-gray-100 hover:bg-gray-200">
                  <Avatar className="h-8 w-8 border-2 border-white/40">
                    <AvatarImage
                      src={
                        userData?.avatar_url ||
                        (userData?.nome_usuario
                          ? `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              userData.nome_usuario
                            )}`
                          : undefined)
                      }
                      alt={userData?.nome_usuario || "Usuário"}
                    />
                    <AvatarFallback className="bg-white text-[#151515] font-semibold uppercase">
                      {userData?.nome_usuario?.[0] ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{userData?.nome_usuario || "Usuário"}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <div className="space-y-1 ml-1.5 mt-2">
                  <p className="text-sm font-semibold text-foreground">
                    {userData?.nome_usuario || "Usuário"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Empresa: {empresaData?.nome_empresa || "-"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Filial: {filialData?.nome_filial || "-"}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <div className="space-y-2">
                  <DropdownMenuItem
                    onClick={logout}
                    className="w-full text-sm text-red-600 hover:text-red-700"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sair
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
