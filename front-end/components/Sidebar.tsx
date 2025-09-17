"use client";

// import logoSrc from "@/public/image/logoMenu.png";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FC, useState } from "react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: FC<SidebarProps> = ({ open, onClose }) => {
  const pathname = usePathname();

  const [cadastroOpen, setCadastroOpen] = useState(false);
  const [importacoesOpen, setImportacoesOpen] = useState(false);
  const [tarefasOpen, setTarefasOpen] = useState(false);
  const [agendamentoOpen, setAgendamentoOpen] = useState(false);
  const [conexoesOpen, setConexoesOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href ? "bg-white/20 font-semibold" : "hover:bg-white/10";

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-0" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#00264d] text-white transition-transform duration-300 z-50 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Topbar */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/20">
          {/* {logoSrc ? (
            <Image
              src={logoSrc}
              alt="Logo"
              width={120}
              height={32}
              className="hidden sm:block"
              priority
            />
          ) : ( */}
          <span className="font-semibold text-lg">Menu</span>
          {/* )} */}
          <button
            aria-label="Fechar menu"
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Navegação */}
        <nav className="p-4 space-y-6">
          {/* Dashboard e Kanban */}
          <div className="space-y-1">
            <Link
              href="/inicio"
              className={`block py-2 px-3 rounded ${isActive("/inicio")}`}
            >
              lorem ipsun
            </Link>
            <Link
              href="/kanban"
              className={`block py-2 px-3 rounded ${isActive("/kanban")}`}
            >
              lorem ipsun
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
