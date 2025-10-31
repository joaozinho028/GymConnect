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

// Listar transações
const listarTransacoes = async (req, res) => {
  const { id_empresa } = req.user;
  const { mes, filial } = req.query;
  // Busca com join para trazer nome do usuário
  let query = supabase
    .from("fluxo_caixa")
    .select(`
      id,
      valor,
      data,
      id_categoria,
      id_filial,
      tipo_pagamento,
      tipo,
      descricao,
      recorrente,
      dataInicio,
      dataFim,
      id_usuario,
      usuario:usuarios(nome_usuario)
    `)
    .eq("id_empresa", id_empresa);

  if (mes) query = query.eq("month", mes);
  if (filial) query = query.eq("filial", filial);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  // Formatar para o front-end
  const result = (data || []).map((t) => ({
    id: t.id,
    value: t.valor,
    date: t.data,
    id_categoria: t.id_categoria,
    id_filial: t.id_filial,
    paymentMethod: t.tipo_pagamento,
    type: t.tipo,
    description: t.descricao,
    recorrente: t.recorrente || false,
    dataInicio: t.dataInicio || "",
    dataFim: t.dataFim || "",
    usuario: t.usuario?.nome_usuario || "-"
  }));
  res.json(result);
};

// Criar transação
const criarTransacao = async (req, res) => {
  try {
    console.log('req.user:', req.user); // Log do usuário do token
    const { id_empresa, id_usuario } = req.user;
    const {
      valor,
      data,
      id_categoria,
      id_filial,
      tipo_pagamento,
      tipo,
      descricao,
      recorrente,
      dataInicio,
      dataFim,
      todasFiliais
    } = req.body;

    // LOG dos campos recebidos
    console.log('Recebido:', {
      valor,
      data,
      id_categoria,
      id_filial,
      tipo_pagamento,
      tipo,
      descricao,
      recorrente,
      dataInicio,
      dataFim,
      todasFiliais,
      id_usuario
    });

    // Validação dos campos obrigatórios
    if (
      valor === undefined ||
      valor === null ||
      isNaN(Number(valor)) ||
      (!recorrente && !data) ||
      (recorrente && (!dataInicio || !dataFim)) ||
      !id_categoria ||
      (!todasFiliais && !id_filial) ||
      !tipo_pagamento ||
      !tipo
    ) {
      return res.status(400).json({
        message:
          "Preencha todos os campos obrigatórios: valor, data (ou data inicial/final se recorrente), categoria, filial (ou todasFiliais), tipo de pagamento e tipo de transação."
      });
    }

    // Buscar todas as filiais se necessário
    let filiaisParaTransacao = [];
    if (todasFiliais) {
      const { data: filiaisData, error: filiaisError } = await supabase
        .from("filiais")
        .select("id_filial")
        .eq("id_empresa", id_empresa);
      if (filiaisError) {
        return res.status(500).json({ message: "Erro ao buscar filiais", error: filiaisError });
      }
      filiaisParaTransacao = filiaisData.map(f => f.id_filial);
    } else {
      filiaisParaTransacao = [id_filial];
    }

    // Se recorrente, gera múltiplas transações mensais para cada filial
    if (recorrente && dataInicio && dataFim) {
      const transacoes = [];
      let current = new Date(dataInicio);
      const end = new Date(dataFim);
      const dia = current.getDate();
      while (current <= end) {
        const ano = current.getFullYear();
        const mes = current.getMonth();
        let dataTransacao = new Date(ano, mes, dia);
        if (dataTransacao.getMonth() !== mes) {
          dataTransacao = new Date(ano, mes + 1, 0);
        }
        for (const filialId of filiaisParaTransacao) {
          transacoes.push({
            id_empresa,
            id_usuario,
            valor: Number(valor),
            data: dataTransacao.toISOString().slice(0, 10),
            id_categoria: Number(id_categoria),
            id_filial: Number(filialId),
            tipo_pagamento,
            tipo,
            descricao: descricao || null,
            recorrente: true,
            dataInicio,
            dataFim
          });
        }
        current.setMonth(current.getMonth() + 1);
      }
      const { data: dataRes, error } = await supabase
        .from("fluxo_caixa")
        .insert(transacoes)
        .select();
      if (error) {
        console.error("Erro ao cadastrar transações recorrentes:", error);
        return res.status(500).json({ message: "Erro ao cadastrar transações recorrentes", error });
      }
      return res.status(201).json({ message: "Transações recorrentes cadastradas", data: dataRes });
    }

    // Transação única para cada filial
    const transacoesUnicas = filiaisParaTransacao.map(filialId => ({
      id_empresa,
      id_usuario,
      valor: Number(valor),
      data,
      id_categoria: Number(id_categoria),
      id_filial: Number(filialId),
      tipo_pagamento,
      tipo,
      descricao: descricao || null,
      recorrente: false,
      dataInicio: null,
      dataFim: null
    }));

    const { data: dataRes, error } = await supabase
      .from("fluxo_caixa")
      .insert(transacoesUnicas)
      .select();
    if (error) {
      console.error("Erro ao cadastrar transação:", error);
      return res.status(500).json({ message: "Erro ao cadastrar transação", error });
    }
    res.status(201).json(dataRes);
  } catch (err) {
    console.error("Erro no servidor:", err);
    res.status(500).json({ message: "Erro no servidor" });
  }
};

// Editar transação
const editarTransacao = async (req, res) => {
  const { id_empresa } = req.user;
  const { id } = req.params;
  const { data, error } = await supabase
    .from("fluxo_caixa")
    .update({ ...req.body })
    .eq("id", id)
    .eq("id_empresa", id_empresa)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Excluir transação
const excluirTransacao = async (req, res) => {
  const { id_empresa } = req.user;
  const { id } = req.params;
  const { error } = await supabase
    .from("fluxo_caixa")
    .delete()
    .eq("id", id)
    .eq("id_empresa", id_empresa);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
};

module.exports = {
  cadastrarCategorias,
  listarCategorias,
  excluirCategoria,
  listarTransacoes,
  criarTransacao,
  editarTransacao,
  excluirTransacao,
};
