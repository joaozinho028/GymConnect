"use client";

import Button from "@/components/Forms/Button";
import Input from "@/components/Forms/Input";
import { useAuth } from "@/contexts/AuthContext";
import { GetForm } from "@/utils";
import { ChevronRight, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import * as yup from "yup";

// Tipo de categoria
interface Category {
  id: string;
  name: string;
}

export default function CadastrarCategoriaFluxo() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Formulário com validação
  const formRef = useRef<any>(null);

  const schema = yup.object().shape({
    nome: yup.string().required("Digite o nome da categoria"),
  });

  const { handleSubmit, ...form } = GetForm(schema);
  formRef.current = form;

  // Buscar categorias na API
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/fluxoCaixa/listar-categorias`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setCategories(data || []);
      } else {
        Swal.fire({
          icon: "error",
          text: "Erro ao carregar categorias",
          timer: 2500,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        text: err?.message || "Erro ao conectar ao servidor",
        timer: 2500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar categorias ao montar o componente
  useEffect(() => {
    fetchCategories();
  }, [token]);

  // Filtrar categorias
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(filter.toLowerCase())
  );

  // Abrir modal para adicionar
  const openModal = () => {
    form.reset();
    setModalOpen(true);
  };

  // Fechar modal
  const closeModal = () => {
    setModalOpen(false);
  };

  // Salvar categoria
  const onSubmitFunction = async (values: any) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/fluxoCaixa/cadastrar-categorias`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: values.nome }),
        }
      );

      let data = null;
      try {
        data = await res.json();
      } catch (e) {
        data = {};
      }

      if (res.ok) {
        Swal.fire({
          icon: "success",
          text: data?.message || "Categoria cadastrada com sucesso!",
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });

        // Adicionar a nova categoria à lista ou recarregar a lista
        fetchCategories();
        closeModal();
      } else {
        Swal.fire({
          icon: "error",
          text: data?.message || "Erro ao cadastrar categoria.",
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
  };

  // Excluir categoria
  const handleDelete = async (id: string) => {
    try {
      // Confirmação antes de excluir
      const result = await Swal.fire({
        title: "Confirmação",
        text: "Deseja realmente excluir esta categoria?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sim, excluir!",
        cancelButtonText: "Cancelar",
      });

      if (result.isConfirmed) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/fluxoCaixa/excluir-categorias/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        let data = null;
        try {
          data = await res.json();
        } catch (e) {
          data = {};
        }

        if (res.ok) {
          // Atualiza a lista local removendo o item
          setCategories(categories.filter((c) => c.id !== id));

          Swal.fire({
            icon: "success",
            text: data?.message || "Categoria excluída com sucesso!",
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: "top-end",
          });
        } else {
          Swal.fire({
            icon: "error",
            text: data?.message || "Erro ao excluir categoria.",
            timer: 2500,
            showConfirmButton: false,
            toast: true,
            position: "top-end",
          });
        }
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
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-8">
      <div className="w-full bg-white p-6 rounded-lg shadow-md sm:p-10">
        {/* Cabeçalho */}
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <span className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
            Configurações
          </span>
          <ChevronRight className="mx-2 h-4 w-4" />
          <span className="font-medium text-primary">
            Categorias Fluxo de Caixa
          </span>
        </div>

        <div className="flex items-center justify-between mb-4 w-full">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Filtrar categorias..."
              className="border rounded pl-8 pr-2 py-2 w-full"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <Button
            onClick={openModal}
            type="button"
            className="bg-green-600 cursor-pointer hover:bg-green-700 text-white px-4 py-2 rounded"
            disabled={isLoading}
          >
            <Plus size={18} className="inline-block mr-2" />
            Nova Categoria
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table
            className="min-w-full divide-y divide-gray-200"
            style={{ tableLayout: "fixed" }}
          >
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">
                  Ação
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Nome
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={2} className="text-center py-6 text-gray-400">
                    Carregando categorias...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={2} className="text-center py-6 text-gray-400">
                    {filter
                      ? "Nenhuma categoria encontrada com o filtro aplicado."
                      : "Nenhuma categoria cadastrada."}
                  </td>
                </tr>
              ) : (
                <>
                  {filteredCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50">
                      <td className="px-4 py-1 flex gap-2">
                        <button
                          title="Excluir"
                          className="p-2 rounded cursor-pointer hover:bg-gray-100 text-red-600"
                          onClick={() => handleDelete(cat.id)}
                          type="button"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                      <td className="px-4 py-1">{cat.name}</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-0 flex items-center justify-center z-[999]">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
            <button
              onClick={closeModal}
              className="absolute cursor-pointer top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Nova Categoria</h2>

            <form
              onSubmit={handleSubmit(onSubmitFunction)}
              className="space-y-4"
            >
              <Input
                label="Nome da Categoria"
                name="nome"
                required
                error="Preencha esse campo!"
                formulario={form}
                width="w-full"
              />

              <div className="flex justify-end gap-2">
                <Button
                  onClick={closeModal}
                  type="button"
                  className="px-4 py-2 cursor-pointer rounded border hover:bg-gray-50"
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-green-600 cursor-pointer hover:bg-green-700 text-white px-4 py-2 rounded"
                  type="submit"
                >
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
