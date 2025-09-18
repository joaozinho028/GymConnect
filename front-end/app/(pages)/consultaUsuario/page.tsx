"use client";
import ModalComponente from "@/components/Modal/ModalComponent";
import { useAuth } from "@/contexts/AuthContext";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  FileDown,
  FileSpreadsheet,
  FileText,
  Pencil,
  Search,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import EditarCadastroUsuario from "./FormEditUsuario";

export default function ConsultaUsuarios() {
  const { token } = useAuth();
  const [busca, setBusca] = useState("");
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<any>(null);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    async function fetchUsuarios() {
      try {
        const res = await fetch(
          "http://localhost:5000/usuarios/listar-usuarios",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setUsuarios(data);
        } else {
          const data = await res.json();
          Swal.fire({
            icon: "error",
            text: data?.message || "Erro ao buscar usuários.",
            timer: 2500,
            showConfirmButton: false,
            toast: true,
            position: "top-end",
          });
        }
      } catch (err: any) {
        Swal.fire({
          icon: "error",
          text: err?.message || "Erro ao conectar ao servidor.",
          timer: 2500,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      }
    }
    if (token) fetchUsuarios();
  }, [token]);

  // Exportar CSV
  function exportToCSV(data: any[]) {
    const header = ["Nome", "Email", "Perfil", "Criado em"];
    const rows = data.map((usuario) => [
      usuario.nome,
      usuario.email,
      usuario.perfil,
      usuario.filial,
      usuario.criadoEm,
    ]);
    const csvContent = [header, ...rows]
      .map((e) => e.map((v) => `"${v}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "usuarios.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Exportar Excel (simplificado)
  function exportToExcel(data: any[]) {
    exportToCSV(data);
  }

  // Exportar PDF
  function exportToPDF(data: any[]) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const header = `
    <tr>
      <th style="padding:4px;border:1px solid #ccc;">Nome</th>
      <th style="padding:4px;border:1px solid #ccc;">Email</th>
      <th style="padding:4px;border:1px solid #ccc;">Perfil</th>
      <th style="padding:4px;border:1px solid #ccc;">Criado em</th>
    </tr>
  `;
    const rows = data
      .map(
        (usuario) => `
      <tr>
        <td style="padding:4px;border:1px solid #ccc;">${usuario.nome}</td>
        <td style="padding:4px;border:1px solid #ccc;">${usuario.email}</td>
        <td style="padding:4px;border:1px solid #ccc;">${usuario.perfil}</td>
        <td style="padding:4px;border:1px solid #ccc;">${usuario.criadoEm}</td>
      </tr>
    `
      )
      .join("");
    printWindow.document.write(`
    <html>
      <head><title>Usuários</title></head>
      <body>
        <h2>Usuários</h2>
        <table style="border-collapse:collapse;width:100%">${header}${rows}</table>
      </body>
    </html>
  `);
    printWindow.document.close();
    printWindow.print();
  }

  // Copiar tabela
  function copyTable(data: any[]) {
    const header = ["Nome", "Email", "Perfil", "Criado em"];
    const rows = data.map((usuario) => [
      usuario.nome,
      usuario.email,
      usuario.perfil,
      usuario.filial,
      usuario.criadoEm,
    ]);
    const tableText = [header, ...rows].map((e) => e.join("\t")).join("\n");
    navigator.clipboard.writeText(tableText);
    alert("Tabela copiada para a área de transferência!");
  }

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase()) ||
      u.perfil.toLowerCase().includes(busca.toLowerCase())
  );
  const totalPages = Math.max(
    1,
    Math.ceil(usuariosFiltrados.length / pageSize)
  );
  const pageItems = usuariosFiltrados.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Função para atualizar usuário na lista após edição
  const atualizarUsuarioNaLista = (usuarioEditado: any) => {
    setUsuarios((prev) =>
      prev.map((u) => (u.id === usuarioEditado.id ? usuarioEditado : u))
    );
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-8">
      <div className="w-full bg-white p-6 rounded-lg shadow-md sm:p-10">
        {/* Cabeçalho */}
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <span className="text-gray-500 hover:text-gray-700 cursor-pointer">
            Página Inicial
          </span>
          <ChevronRight className="mx-2 h-4 w-4" />
          <span className="font-medium text-primary">Consulta de Usuários</span>
        </div>

        {/* Barra de busca e botões */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="flex w-full sm:w-1/2 items-end">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Buscar.."
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPage(1);
                }}
                className="w-full h-[42px] p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-[#222222] pl-10"
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
            </div>
          </div>
          <div className="flex w-full sm:w-1/2 justify-end">
            <div className="flex flex-wrap gap-2">
              <button
                className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm"
                onClick={() => exportToCSV(usuariosFiltrados)}
              >
                <FileText size={16} /> CSV
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-green-100 text-green-700 hover:bg-green-200 text-sm"
                onClick={() => exportToExcel(usuariosFiltrados)}
              >
                <FileSpreadsheet size={16} /> Excel
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-red-100 text-red-700 hover:bg-red-200 text-sm"
                onClick={() => exportToPDF(usuariosFiltrados)}
              >
                <FileDown size={16} /> PDF
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 h-[42px] rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
                onClick={() => copyTable(usuariosFiltrados)}
              >
                <Copy size={16} /> Copiar
              </button>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Nome
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Perfil
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Filial
                </th>
                {/* <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Criado em
                </th> */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-400">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                <>
                  {pageItems.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <div className="flex flex-row items-center justify-center gap-3 min-w-[90px]">
                          {/* Botão Editar */}
                          <button
                            title="Editar"
                            className="p-2 rounded cursor-pointer hover:bg-gray-100 text-green-600"
                            onClick={() => {
                              setUsuarioSelecionado(usuario);
                              setModalOpen(true);
                            }}
                          >
                            <Pencil size={18} />
                          </button>
                          {/* Toggle Status Switch funcional */}
                          <button
                            type="button"
                            aria-label={
                              Boolean(usuario.status_usuario)
                                ? "Desativar usuário"
                                : "Ativar usuário"
                            }
                            className={`relative w-12 h-6 flex items-center rounded-full transition-colors duration-300 focus:outline-none border border-gray-300 cursor-pointer ${
                              Boolean(usuario.status_usuario)
                                ? "bg-green-400"
                                : "bg-red-400"
                            }`}
                            style={{ minWidth: 48 }}
                            onClick={async () => {
                              const novoStatus = !Boolean(
                                usuario.status_usuario
                              );
                              const confirm = await Swal.fire({
                                title: novoStatus
                                  ? "Ativar usuário?"
                                  : "Inativar usuário?",
                                text: novoStatus
                                  ? "Deseja ativar este usuário?"
                                  : "Deseja inativar este usuário?",
                                icon: "question",
                                showCancelButton: true,
                                confirmButtonText: novoStatus
                                  ? "Ativar"
                                  : "Inativar",
                                cancelButtonText: "Cancelar",
                                reverseButtons: true,
                                focusCancel: true,
                              });
                              if (!confirm.isConfirmed) return;
                              setUsuarios((prev) =>
                                prev.map((u) =>
                                  u.id === usuario.id
                                    ? { ...u, status_usuario: novoStatus }
                                    : u
                                )
                              );
                              try {
                                const res = await fetch(
                                  "http://localhost:5000/usuarios-edit/alterar-status",
                                  {
                                    method: "PUT",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({
                                      id_usuario: usuario.id,
                                      status_usuario: novoStatus,
                                    }),
                                  }
                                );
                                if (!res.ok) {
                                  const data = await res.json();
                                  setUsuarios((prev) =>
                                    prev.map((u) =>
                                      u.id === usuario.id
                                        ? { ...u, status_usuario: !novoStatus }
                                        : u
                                    )
                                  );
                                  Swal.fire({
                                    icon: "error",
                                    text:
                                      data?.message ||
                                      "Erro ao atualizar status.",
                                    timer: 2000,
                                    showConfirmButton: false,
                                    toast: true,
                                    position: "top-end",
                                  });
                                }
                              } catch (err) {
                                setUsuarios((prev) =>
                                  prev.map((u) =>
                                    u.id === usuario.id
                                      ? { ...u, status_usuario: !novoStatus }
                                      : u
                                  )
                                );
                                Swal.fire({
                                  icon: "error",
                                  text:
                                    String(err) ||
                                    "Erro ao conectar ao servidor.",
                                  timer: 2000,
                                  showConfirmButton: false,
                                  toast: true,
                                  position: "top-end",
                                });
                              }
                            }}
                          >
                            <span
                              className={`absolute transition-transform duration-300 h-5 w-5 rounded-full bg-white border border-gray-300 shadow ${
                                Boolean(usuario.status_usuario)
                                  ? "translate-x-6"
                                  : "translate-x-0"
                              }`}
                              style={{ top: 2 }}
                            />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-2 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-200">
                          <User size={18} className="text-gray-500" />
                        </span>
                        {usuario.nome}
                      </td>
                      <td className="px-4 py-2">{usuario.email}</td>
                      <td className="px-4 py-2">{usuario.perfil}</td>
                      <td className="px-4 py-2">{usuario.filial}</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 border rounded cursor-pointer bg-blue-100"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronRight className="transform rotate-180 h-4 w-4" />
            </button>
            <button
              className="px-3 py-1 border rounded cursor-pointer bg-blue-100"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronLeft className="transform rotate-180 h-4 w-4" />
            </button>
          </div>
        </div>

        <ModalComponente
          header="Editar Usuário"
          opened={modalOpen}
          onClose={() => setModalOpen(false)}
          hasForm={false}
          hasSaveButton={false}
          className="h-[80vh] w-[90vw] md:w-[100vw] lg:w-[900px]"
        >
          <EditarCadastroUsuario
            usuario={usuarioSelecionado}
            onSave={(usuarioEditado: any) => {
              atualizarUsuarioNaLista(usuarioEditado);
              setModalOpen(false);
              Swal.fire({
                icon: "success",
                text: "Usuário atualizado com sucesso!",
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: "top-end",
              });
            }}
          />
        </ModalComponente>
      </div>
    </div>
  );
}
