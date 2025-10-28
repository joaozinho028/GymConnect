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
import { LogOut, Menu } from "lucide-react";
import Image from "next/image";
import { FC, useEffect, useState } from "react";
import Sidebar from "./Sidebar";

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
      {/* Ícone de menu */}
      <button
        className="mr-4 cursor-pointer flex items-center justify-center p-2 rounded hover:bg-[#e0ffe0] focus:outline-none"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu size={28} />
      </button>

      {/* Logo / Título */}
      <div className="flex items-center">
        <Image
          src="/image/logo/logo.webp" // Ajuste a extensão para o arquivo correto (.png, .jpg, .svg, etc.)
          alt="GYM CONNECT Logo"
          width={30}
          height={30}
          className="mr-2"
        />
        <span className="text-black font-semibold text-lg tracking-wide select-none">
          GYM CONNECT
        </span>
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
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </header>
  );
};

export default Header;
