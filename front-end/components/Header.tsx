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
import {
  BarChart2,
  Building2,
  ChevronDown,
  GraduationCap,
  Key,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Search,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { FC } from "react";

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
  const { logout } = useAuth();
  const user = {
    name: "João Silva",
    email: "joao.silva@email.com",
    avatarUrl:
      "https://ui-avatars.com/api/?name=Joao+Silva&background=0D8ABC&color=fff",
    nameEmpresa: "Jovitech Sistemas",
    filialEmpresa: "Empresa 1 Jaraguá",
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-14 bg-[#64FA36] shadow-md flex items-center px-6">
      {/* Logo / Título */}
      <span className="text-black font-semibold text-lg tracking-wide select-none">
        Gym Connect
      </span>

      {/* Menu horizontal */}
      <div className="ml-8 hidden md:flex items-center gap-6 text-black font-semibold  text-sm">
        <Link
          href="/inicio"
          className="flex items-center gap-2 hover:underline cursor-pointer"
        >
          <LayoutDashboard size={16} />
          Dashboard
        </Link>

        {/* Dropdown Filiais */}
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

        {/* Dropdown Alunos */}
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

        <Link
          href="fluxoCaixa"
          className="flex items-center gap-2 hover:underline cursor-pointer"
        >
          <BarChart2 size={16} />
          Fluxo de Caixa
        </Link>

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
            <button className="ml-5 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer">
              <Avatar className="h-9 w-9 border-2 border-white/40">
                {user?.avatarUrl && (
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                )}
                <AvatarFallback className="bg-white text-[#151515] font-semibold uppercase">
                  {user?.name?.[0] ?? "U"}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <div className="space-y-1 ml-1.5 mt-2">
              <p className="text-sm font-semibold text-foreground">
                {user.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Empresa: {user.nameEmpresa}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Filial: {user.nameEmpresa}
              </p>
            </div>
            <DropdownMenuSeparator />
            <div className="space-y-2">
              <DropdownMenuItem asChild>
                <Link
                  href="/change-password"
                  className="w-full text-sm text-blue-600 hover:underline"
                >
                  <Key size={16} className="mr-2" />
                  Alterar senha
                </Link>
              </DropdownMenuItem>

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
      </div>
    </header>
  );
};

export default Header;
