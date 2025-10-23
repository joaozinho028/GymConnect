const supabase = require("../db");

const cadastrarCategorias = async (req, res) => {
  try {
    const id_empresa = req.user.id_empresa;
    const { name } = req.body;

    // Validação básica
    if (!name || name.trim() === "") {
      return res
        .status(400)
        .json({ message: "O nome da categoria é obrigatório" });
    }

    // Verificar se a categoria já existe para esta empresa
    const { data: categoriaExistente, error: errorCheck } = await supabase
      .from("categorias_fluxo_caixa")
      .select("id_categoria")
      .eq("id_empresa", id_empresa)
      .eq("nome_categoria", name)
      .single();

    if (categoriaExistente) {
      return res.status(400).json({ message: "Esta categoria já existe" });
    }

    // Inserir nova categoria
    const { data, error } = await supabase
      .from("categorias_fluxo_caixa")
      .insert({
        id_empresa,
        nome_categoria: name,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao cadastrar categoria:", error);
      return res
        .status(500)
        .json({ message: "Erro ao cadastrar categoria", error });
    }

    // Formatar resposta
    const categoria = {
      id: data.id_categoria,
      name: data.nome_categoria,
    };

    res.status(201).json({
      message: "Categoria cadastrada com sucesso",
      data: categoria,
    });
  } catch (err) {
    console.error("Erro no servidor:", err);
    res.status(500).json({ message: "Erro no servidor" });
  }
};

const listarCategorias = async (req, res) => {
  try {
    const id_empresa = req.user.id_empresa;

    const { data, error } = await supabase
      .from("categorias_fluxo_caixa")
      .select("id_categoria, nome_categoria")
      .eq("id_empresa", id_empresa)
      .order("nome_categoria", { ascending: true });

    if (error) {
      return res.status(500).json({
        message: "Erro ao buscar categorias",
        error,
      });
    }

    // Formatar dados para o padrão do frontend
    const categorias = (data || []).map((categoria) => ({
      id: categoria.id_categoria,
      name: categoria.nome_categoria,
    }));

    res.json(categorias);
  } catch (err) {
    console.error("Erro no servidor:", err);
    res.status(500).json({ message: "Erro no servidor" });
  }
};

const excluirCategoria = async (req, res) => {
  try {
    const id_empresa = req.user.id_empresa;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "ID da categoria é obrigatório" });
    }

    // Verificar se a categoria existe e pertence à empresa
    const { data: categoriaExistente, error: errorCheck } = await supabase
      .from("categorias_fluxo_caixa")
      .select("id_categoria")
      .eq("id_categoria", id)
      .eq("id_empresa", id_empresa)
      .single();

    if (!categoriaExistente) {
      return res.status(404).json({ message: "Categoria não encontrada" });
    }

    // Excluir a categoria
    const { error } = await supabase
      .from("categorias_fluxo_caixa")
      .delete()
      .eq("id_categoria", id)
      .eq("id_empresa", id_empresa);

    if (error) {
      console.error("Erro ao excluir categoria:", error);
      return res
        .status(500)
        .json({ message: "Erro ao excluir categoria", error });
    }

    res.json({
      message: "Categoria excluída com sucesso",
    });
  } catch (err) {
    console.error("Erro no servidor:", err);
    res.status(500).json({ message: "Erro no servidor" });
  }
};

module.exports = {
  cadastrarCategorias,
  listarCategorias,
  excluirCategoria,
};
