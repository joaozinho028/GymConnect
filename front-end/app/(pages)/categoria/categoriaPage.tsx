import { Trash2, X } from "lucide-react";
import { useState } from "react";

// Tipo de categoria
interface Category {
  id: string;
  name: string;
}

const initialCategories: Category[] = [
  { id: "1", name: "Mensalidade" },
  { id: "2", name: "Despesas" },
  { id: "3", name: "Investimentos" },
];

export default function CategoriaPage() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [filter, setFilter] = useState("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");

  // Filtrar categorias
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(filter.toLowerCase())
  );

  // Abrir modal para adicionar
  const openModal = () => {
    setCategoryName("");
    setModalOpen(true);
  };

  // Fechar modal
  const closeModal = () => {
    setModalOpen(false);
    setCategoryName("");
  };

  // Salvar categoria
  const handleSave = () => {
    if (!categoryName.trim()) return;
    setCategories([
      ...categories,
      { id: Date.now().toString(), name: categoryName.trim() },
    ]);
    closeModal();
  };

  // Excluir categoria
  const handleDelete = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id));
  };

  return (
    <div className="p-6 w-full">
      {/* Filtro e botão adicionar */}
      <div className="flex items-center justify-between mb-4 w-full">
        <input
          type="text"
          placeholder="Filtrar categorias..."
          className="border rounded px-2 py-1 w-full max-w-xs"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <button
          onClick={openModal}
          type="button"
          className="bg-green-500 cursor-pointer text-white px-4 py-2 rounded hover:bg-green-600 transition"
        >
          Nova Categoria
        </button>
      </div>

      {/* Tabela */}
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
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={2} className="text-center py-6 text-gray-400">
                  Nenhuma categoria encontrada.
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-0 flex items-center justify-center z-[999]">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
            <button
              onClick={closeModal}
              className="absolute  cursor-pointer top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Nova Categoria</h2>
            <input
              type="text"
              className="border rounded px-3 py-2 w-full mb-4"
              placeholder="Nome da categoria"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 cursor-pointer rounded border hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="bg-green-500 cursor-pointer text-white px-4 py-2 rounded hover:bg-green-600 transition"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
