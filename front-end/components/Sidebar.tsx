"use client";

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
import { usePathname } from "next/navigation";
import { FC, useState } from "react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: FC<SidebarProps> = ({ open, onClose }) => {
  const pathname = usePathname();
  const { logout } = useAuth();
  const permissions = usePermissions();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const isActive = (href: string) =>
    pathname === href ? "bg-[#e0ffe0] font-semibold" : "hover:bg-[#f0f0f0]";

  const handleDropdown = (menu: string) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-full w-72 bg-white border-r shadow-lg z-50 flex flex-col transition-transform duration-200 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{ minWidth: 288 }} // 18rem = 288px
    >
      {/* Topo: botão fechar + logo */}
      <div className="flex items-center gap-2 h-16 px-6 border-b relative">
        <button
          className="mr-2 cursor-pointer flex items-center justify-center p-2 rounded hover:bg-[#e0ffe0] focus:outline-none"
          onClick={onClose}
        >
          <Menu size={28} />
        </button>
        <img src="/image/logo/logo.webp" alt="Logo" width={32} height={32} />
        <span className="font-bold text-base text-[#151515] ml-1">
          GYM CONNECT
        </span>
      </div>
      {/* Navegação */}
      <nav className="flex-1 p-4 space-y-2 text-black font-medium text-sm">
        {/* Dashboard e Kanban */}
        <div className="space-y-1">
          <Link
            href="/inicio"
            onClick={onClose}
            className={`flex items-center gap-2 px-3 py-2 rounded ${isActive(
              "/inicio"
            )}`}
          >
            <LayoutDashboard size={18} /> Dashboard
          </Link>
        </div>

        {/* Filiais */}
        {permissions.filiais && (
          <div>
            <button
              className="flex items-center gap-2 w-full px-3 py-2 rounded hover:bg-[#f0f0f0] focus:outline-none"
              onClick={() => handleDropdown("filiais")}
            >
              <Building2 size={18} /> Filiais{" "}
              <ChevronDown
                size={14}
                className={`ml-auto transition-transform ${
                  openDropdown === "filiais" ? "rotate-180" : ""
                }`}
              />
            </button>
            {openDropdown === "filiais" && (
              <div className="ml-6 mt-1 flex flex-col gap-1">
                <Link
                  href="/cadastroFiliais"
                  onClick={onClose}
                  className={`flex items-center gap-2 px-2 py-1 rounded ${isActive(
                    "/cadastroFiliais"
                  )}`}
                >
                  <PlusCircle size={14} /> Cadastro de Filiais
                </Link>
                <Link
                  href="/consultaFiliais"
                  onClick={onClose}
                  className={`flex items-center gap-2 px-2 py-1 rounded ${isActive(
                    "/consultaFiliais"
                  )}`}
                >
                  <Search size={14} /> Consulta de Filiais
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Alunos */}
        {permissions.alunos && (
          <div>
            <button
              className="flex items-center gap-2 w-full px-3 py-2 rounded hover:bg-[#f0f0f0] focus:outline-none"
              onClick={() => handleDropdown("alunos")}
            >
              <GraduationCap size={18} /> Alunos{" "}
              <ChevronDown
                size={14}
                className={`ml-auto transition-transform ${
                  openDropdown === "alunos" ? "rotate-180" : ""
                }`}
              />
            </button>
            {openDropdown === "alunos" && (
              <div className="ml-6 mt-1 flex flex-col gap-1">
                <Link
                  href="/cadastroAlunos"
                  onClick={onClose}
                  className={`flex items-center gap-2 px-2 py-1 rounded ${isActive(
                    "/cadastroAlunos"
                  )}`}
                >
                  <PlusCircle size={14} /> Cadastro de Alunos
                </Link>
                <Link
                  href="/consultaAlunos"
                  onClick={onClose}
                  className={`flex items-center gap-2 px-2 py-1 rounded ${isActive(
                    "/consultaAlunos"
                  )}`}
                >
                  <Search size={14} /> Consulta de Alunos
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Fluxo de Caixa */}
        {permissions.fluxo_caixa && (
          <Link
            href="/fluxoCaixa"
            onClick={onClose}
            className={`flex items-center gap-2 px-3 py-2 rounded ${isActive(
              "/fluxoCaixa"
            )}`}
          >
            <BarChart2 size={18} /> Fluxo de Caixa
          </Link>
        )}

        <Link
          href="/configuracoes"
          onClick={onClose}
          className={`flex items-center gap-2 px-3 py-2 rounded ${isActive(
            "/configuracoes"
          )}`}
        >
          <Settings size={18} /> Configurações
        </Link>
      </nav>
      <button
        onClick={logout}
        className="flex items-center gap-2 px-6 py-3 text-red-600 hover:bg-red-50 border-t font-semibold"
      >
        <LogOut size={18} /> Sair
      </button>
    </aside>
  );
};

export default Sidebar;
