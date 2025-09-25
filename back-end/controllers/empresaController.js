const supabase = require("../db");

const cadastrarFilial = async (req, res) => {
  try {
    const id_empresa = req.user.id_empresa;
    const {
      nome_filial,
      cnpj_filial,
      telefone_filial,
      cep_filial,
      rua_filial,
      numero_filial,
      bairro_filial,
      cidade_filial,
      estado_filial,
    } = req.body;

    // Validações básicas
    if (
      !nome_filial ||
      !cnpj_filial ||
      !telefone_filial ||
      !cep_filial ||
      !rua_filial ||
      !numero_filial ||
      !bairro_filial ||
      !cidade_filial ||
      !estado_filial
    ) {
      return res
        .status(400)
        .json({ message: "Todos os campos são obrigatórios" });
    }

    // Verificar se o CNPJ já existe
    const { data: filialExistente, error: errorCheck } = await supabase
      .from("filiais")
      .select("id_filial")
      .eq("cnpj_filial", cnpj_filial)
      .single();

    if (filialExistente) {
      return res.status(400).json({ message: "CNPJ já cadastrado" });
    }

    // Criar objeto de endereço JSON
    const endereco = {
      cep: cep_filial,
      rua: rua_filial,
      numero: numero_filial,
      bairro: bairro_filial,
      cidade: cidade_filial,
      estado: estado_filial,
    };

    // Inserir nova filial
    const { data, error } = await supabase
      .from("filiais")
      .insert({
        id_empresa,
        nome_filial,
        cnpj_filial,
        telefone_filial,
        endereco,
        tipo_filial: "filial", // Sempre será filial
        status_filial: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao cadastrar filial:", error);
      return res
        .status(500)
        .json({ message: "Erro ao cadastrar filial", error });
    }

    res.status(201).json({
      message: "Filial cadastrada com sucesso",
      filial: data,
    });
  } catch (err) {
    console.error("Erro no servidor:", err);
    res.status(500).json({ message: "Erro no servidor" });
  }
};

const editarFilial = async (req, res) => {
  try {
    const id_empresa = req.user.id_empresa;
    const id_usuario = req.user.id;
    const id_filial_atual = req.user?.id_filial || null;

    const {
      id_filial,
      nome_filial,
      cnpj_filial,
      telefone_filial,
      cep_filial,
      rua_filial,
      numero_filial,
      bairro_filial,
      cidade_filial,
      estado_filial,
    } = req.body;

    // Validações básicas
    if (
      !id_filial ||
      !nome_filial ||
      !cnpj_filial ||
      !telefone_filial ||
      !cep_filial ||
      !rua_filial ||
      !numero_filial ||
      !bairro_filial ||
      !cidade_filial ||
      !estado_filial
    ) {
      return res
        .status(400)
        .json({ message: "Todos os campos são obrigatórios" });
    }

    // Verificar se a filial existe e pertence à empresa do usuário
    const { data: filialExistente, error: errorFilial } = await supabase
      .from("filiais")
      .select("*")
      .eq("id_filial", id_filial)
      .eq("id_empresa", id_empresa)
      .single();

    if (errorFilial || !filialExistente) {
      return res.status(404).json({
        message: "Filial não encontrada ou não pertence à sua empresa",
        error: errorFilial,
      });
    }

    // Verificar se o CNPJ foi alterado e se o novo CNPJ já existe para outra filial
    if (filialExistente.cnpj_filial !== cnpj_filial) {
      const { data: cnpjExistente, error: errorCnpj } = await supabase
        .from("filiais")
        .select("id_filial")
        .eq("cnpj_filial", cnpj_filial)
        .neq("id_filial", id_filial)
        .single();

      if (cnpjExistente) {
        return res
          .status(400)
          .json({ message: "CNPJ já cadastrado para outra filial" });
      }
    }

    // Criar objeto de endereço JSON
    const endereco = {
      cep: cep_filial,
      rua: rua_filial,
      numero: numero_filial,
      bairro: bairro_filial,
      cidade: cidade_filial,
      estado: estado_filial,
    };

    // Atualizar filial
    const { data, error } = await supabase
      .from("filiais")
      .update({
        nome_filial,
        cnpj_filial,
        telefone_filial,
        endereco,
      })
      .eq("id_filial", id_filial)
      .eq("id_empresa", id_empresa)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar filial:", error);
      return res
        .status(500)
        .json({ message: "Erro ao atualizar filial", error });
    }

    // Registrar na auditoria (se tiver)
    try {
      const { registrarAuditoria } = require("./auditoriaController");
      await registrarAuditoria(
        id_empresa,
        id_usuario,
        id_filial_atual,
        "EDICAO",
        `Filial ID:${id_filial} atualizada: ${nome_filial}`
      );
    } catch (auditoriaErr) {
      console.error("Erro ao registrar auditoria:", auditoriaErr);
      // não impede o sucesso da operação
    }

    res.json({
      message: "Filial atualizada com sucesso",
      filial: data,
    });
  } catch (err) {
    console.error("Erro no servidor:", err);
    res.status(500).json({ message: "Erro no servidor" });
  }
};

const listarPerfis = async (req, res) => {
  try {
    const id_empresa = req.user.id_empresa;
    console.log("ID da empresa do usuário logado:", id_empresa);

    const { data, error } = await supabase
      .from("perfis")
      .select("id_perfil, nome_perfil")
      .eq("id_empresa", id_empresa)
      .eq("status_perfil", true);
    if (error) {
      return res.status(500).json({ message: "Erro ao buscar perfis", error });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Erro no servidor" });
  }
};

const ConsultarFiliais = async (req, res) => {
  try {
    const { id_empresa } = req.user;
    const { id_filial } = req.query;

    if (!id_empresa) {
      return res.status(400).json({ message: "Empresa é obrigatória." });
    }

    let query = supabase
      .from("filiais")
      .select(
        `id_filial, nome_filial, cnpj_filial, telefone_filial, endereco, tipo_filial, status_filial, criado_em`
      )
      .eq("id_empresa", id_empresa);

    if (id_filial) {
      query = query.eq("id_filial", Number(id_filial));
    }

    const { data, error } = await query;

    if (error) {
      return res
        .status(500)
        .json({ message: "Erro ao buscar filiais.", error });
    }

    const filiais = (data || []).map((filial) => ({
      id: filial.id_filial,
      nome: filial.nome_filial,
      cnpj: filial.cnpj_filial,
      telefone: filial.telefone_filial,
      endereco: filial.endereco,
      tipo: filial.tipo_filial,
      status: filial.status_filial,
      criadoEm: filial.criado_em
        ? new Date(filial.criado_em).toLocaleString("pt-BR")
        : "",
    }));

    res.json(filiais);
  } catch (err) {
    res.status(500).json({ message: "Erro no servidor" });
  }
};

const listarFiliais = async (req, res) => {
  try {
    const id_empresa = req.user.id_empresa;
    // console.log("ID da empresa do usuário logado:", id_empresa);
    const { data, error } = await supabase
      .from("filiais")
      .select("id_filial, nome_filial")
      .eq("id_empresa", id_empresa)
      .eq("status_filial", true);
    if (error) {
      return res.status(500).json({ message: "Erro ao buscar filiais", error });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Erro no servidor" });
  }
};

module.exports = {
  cadastrarFilial,
  editarFilial,
  ConsultarFiliais,
  listarPerfis,
  listarFiliais,
};
