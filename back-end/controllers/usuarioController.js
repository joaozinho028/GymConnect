
const db = require("../db");
const bcrypt = require("bcryptjs");
const auditoriaService = require("../utils/auditoriaService");
const supabase = require("../db");

const registrarAuditoria = async (
  id_empresa,
  id_usuario,
  id_filial,
  acao,
  descricao
) => {
  try {
    const { data, error } = await supabase.from("auditoria").insert([
      {
        id_empresa,
        id_usuario,
        id_filial,
        acao,
        descricao,
        data_acao: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Erro ao registrar auditoria:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Erro ao registrar auditoria:", error);
    return { success: false, error };
  }
};

const cadastrarUsuario = async (req, res) => {
  const { nome_usuario, email_usuario, senha_usuario, id_filial, id_perfil } =
    req.body;

  const { id_empresa } = req.user;

  try {
    // Verifica se já existe usuário com o mesmo email
    const { data: userExists } = await supabase
      .from("usuarios")
      .select("id_usuario")
      .eq("email_usuario", email_usuario)
      .single();

    if (userExists) {
      return res.status(400).json({ message: "Usuário já cadastrado" });
    }

    // Criptografa a senha
    const hash = await bcrypt.hash(senha_usuario, 10);

    // Insere usuário
    const { data, error } = await supabase
      .from("usuarios")
      .insert([
        {
          nome_usuario,
          email_usuario,
          senha_usuario: hash,
          id_empresa,
          id_filial,
          id_perfil,
          status_usuario: true,
        },
      ])
      .select();

    if (error) {
      return res.status(500).json({
        message: error.message || "Erro ao cadastrar usuário.",
        error,
      });
    }

    const auditoriaResult = await registrarAuditoria(
      id_empresa,
      req.user.id_usuario, // Usuário que fez o cadastro
      id_filial,
      "Cadastrou usuário",
      `Cadastrou o usuário: ${nome_usuario} (${email_usuario})`
    );

    res.status(201).json({
      message: "Usuário cadastrado com sucesso!",
      user: data && data[0] ? data[0] : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err?.message || "Erro no servidor.",
      error: err,
    });
  }
};

const listarUsuarios = async (req, res) => {
  try {
    const { id_empresa } = req.user;
    const { data, error } = await supabase
      .from("usuarios")
      .select(
        `id_usuario, nome_usuario, email_usuario, status_usuario, id_perfil, id_filial, perfis(nome_perfil), filiais(nome_filial), created_at`
      )
      .eq("id_empresa", id_empresa);
    if (error) {
      return res
        .status(500)
        .json({ message: "Erro ao buscar usuários", error });
    }
    // Mapear para formato amigável
    const usuarios = (data || []).map((u) => ({
      id: u.id_usuario,
      nome: u.nome_usuario,
      email: u.email_usuario,
      id_perfil: u.id_perfil,
      id_filial: u.id_filial,
      perfil: u.perfis?.nome_perfil || "",
      filial: u.filiais?.nome_filial || "",
      status_usuario: u.status_usuario,
      criadoEm: u.created_at
        ? new Date(u.created_at).toLocaleString("pt-BR")
        : "",
    }));
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ message: "Erro no servidor" });
  }
};

const alterarStatusUsuario = async (req, res) => {
  try {
    const { id_usuario, status_usuario } = req.body;
    const { id_empresa } = req.user;

    // Se for ativar o usuário, buscar o id_perfil dele e ativar o perfil também
    if (status_usuario === true) {
      // Buscar o usuário para pegar o id_perfil
      const { data: usuarioData, error: usuarioError } = await supabase
        .from("usuarios")
        .select("id_perfil")
        .eq("id_usuario", id_usuario)
        .eq("id_empresa", id_empresa)
        .maybeSingle();
      if (usuarioError) {
        return res
          .status(500)
          .json({ message: "Erro ao buscar usuário.", error: usuarioError });
      }
      if (!usuarioData || !usuarioData.id_perfil) {
        return res
          .status(404)
          .json({ message: "Usuário ou perfil não encontrado." });
      }
      // Ativar o perfil
      const { error: perfilError } = await supabase
        .from("perfis")
        .update({ status_perfil: true })
        .eq("id_perfil", usuarioData.id_perfil)
        .eq("id_empresa", id_empresa);
      if (perfilError) {
        return res.status(500).json({
          message: "Erro ao ativar perfil do usuário.",
          error: perfilError,
        });
      }
    }

    const { data, error } = await supabase
      .from("usuarios")
      .update({ status_usuario })
      .eq("id_usuario", id_usuario)
      .eq("id_empresa", id_empresa)
      .select();
    if (error) {
      return res
        .status(500)
        .json({ message: error.message || "Erro ao atualizar status.", error });
    }
    if (!data || data.length === 0) {
      return res
        .status(404)
        .json({ message: "Usuário não encontrado ou não pertence à empresa." });
    }

    // Registrar auditoria
    const acao = status_usuario ? "Ativou usuário" : "Inativou usuário";
    const usuarioAfetado = data[0];
    await registrarAuditoria(
      id_empresa,
      req.user.id_usuario, // Usuário que fez a alteração
      req.user.id_filial, // Filial do usuário que fez a alteração
      acao,
      `${acao}: ${usuarioAfetado.nome_usuario} (ID: ${usuarioAfetado.id_usuario})`
    );

    res.json({ message: "Status atualizado com sucesso!", user: data[0] });
  } catch (err) {
    res
      .status(500)
      .json({ message: err?.message || "Erro no servidor.", error: err });
  }
};

const editarUsuario = async (req, res) => {
  try {
    const { id_usuario, nome_usuario, email_usuario, id_perfil, id_filial } =
      req.body;
    const { id_empresa } = req.user;

    if (!id_usuario) {
      return res.status(400).json({
        message: "ID do usuário é obrigatório.",
      });
    }

    // Validar e converter IDs para inteiros ou null
    const perfilId = id_perfil && id_perfil !== "" ? parseInt(id_perfil) : null;
    const filialId = id_filial && id_filial !== "" ? parseInt(id_filial) : null;

    // Verificar se os IDs são válidos (se fornecidos)
    if (id_perfil && isNaN(perfilId)) {
      return res.status(400).json({
        message: "ID do perfil deve ser um número válido.",
      });
    }

    if (id_filial && isNaN(filialId)) {
      return res.status(400).json({
        message: "ID da filial deve ser um número válido.",
      });
    }

    // Verificar se o usuário existe e pertence à empresa
    const { data: usuarioExistente, error: errorBusca } = await supabase
      .from("usuarios")
      .select("id_usuario, nome_usuario, email_usuario, id_perfil, id_filial")
      .eq("id_usuario", id_usuario)
      .eq("id_empresa", id_empresa)
      .single();

    if (errorBusca || !usuarioExistente) {
      return res.status(404).json({
        message: "Usuário não encontrado ou não pertence à sua empresa.",
      });
    }

    // Verificar se o email já está sendo usado por outro usuário
    if (email_usuario !== usuarioExistente.email_usuario) {
      const { data: emailExists } = await supabase
        .from("usuarios")
        .select("id_usuario")
        .eq("email_usuario", email_usuario)
        .neq("id_usuario", id_usuario)
        .single();

      if (emailExists) {
        return res.status(400).json({
          message: "Este email já está sendo usado por outro usuário.",
        });
      }
    }

    // Atualizar o usuário
    const { data, error } = await supabase
      .from("usuarios")
      .update({
        nome_usuario,
        email_usuario,
        id_perfil: perfilId,
        id_filial: filialId,
        updated_at: new Date().toISOString(),
      })
      .eq("id_usuario", id_usuario)
      .eq("id_empresa", id_empresa)
      .select();

    if (error) {
      return res.status(500).json({
        message: error.message || "Erro ao atualizar usuário.",
        error,
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        message: "Usuário não encontrado.",
      });
    }

    // Registrar auditoria - verificar quais campos foram alterados
    const alteracoes = [];
    if (nome_usuario !== usuarioExistente.nome_usuario) {
      alteracoes.push(
        `Nome: "${usuarioExistente.nome_usuario}" → "${nome_usuario}"`
      );
    }
    if (email_usuario !== usuarioExistente.email_usuario) {
      alteracoes.push(
        `Email: "${usuarioExistente.email_usuario}" → "${email_usuario}"`
      );
    }
    if (perfilId !== usuarioExistente.id_perfil) {
      alteracoes.push(
        `Perfil ID: "${usuarioExistente.id_perfil}" → "${perfilId}"`
      );
    }
    if (filialId !== usuarioExistente.id_filial) {
      alteracoes.push(
        `Filial ID: "${usuarioExistente.id_filial}" → "${filialId}"`
      );
    }

    if (alteracoes.length > 0) {
      await registrarAuditoria(
        id_empresa,
        req.user.id_usuario, // Usuário que fez a edição
        req.user.id_filial, // Filial do usuário que fez a edição
        "Editou usuário",
        `Editou o usuário: ${
          usuarioExistente.nome_usuario
        } (ID: ${id_usuario}). Alterações: ${alteracoes.join(", ")}`
      );
    }

    res.json({
      message: "Usuário atualizado com sucesso!",
      user: data[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err?.message || "Erro no servidor.",
      error: err,
    });
  }
};

// Cadastro público de usuário (sem autenticação)
const cadastrarUsuarioPublico = async (req, res) => {
  const { nome_usuario, email_usuario, senha_usuario, id_empresa, id_perfil } = req.body;
  try {
    // Buscar filial matriz pelo id_empresa
    const { data: filial, error: errorFilial } = await supabase
      .from("filiais")
      .select("id_filial")
      .eq("id_empresa", id_empresa)
      .eq("tipo_filial", "matriz")
      .maybeSingle();
    if (errorFilial || !filial) {
      console.error('Erro ao buscar filial matriz:', errorFilial);
      return res.status(500).json({ message: "Erro ao buscar filial matriz.", error: errorFilial });
    }
    const id_filial = filial.id_filial;

    // Verifica se já existe usuário com o mesmo email
    const { data: userExists, error: errorBusca } = await supabase
      .from("usuarios")
      .select("id_usuario")
      .eq("email_usuario", email_usuario)
      .maybeSingle();
    if (errorBusca) {
      console.error('Erro ao buscar usuário existente:', errorBusca);
      return res.status(500).json({ message: "Erro ao buscar usuário existente.", error: errorBusca });
    }
    if (userExists) {
      return res.status(400).json({ message: "Usuário já cadastrado" });
    }
    // Criptografa a senha
    const bcrypt = require("bcryptjs");
    const hash = await bcrypt.hash(senha_usuario, 10);
    // Insere usuário
    const { data, error } = await supabase
      .from("usuarios")
      .insert([
        {
          nome_usuario,
          email_usuario,
          senha_usuario: hash,
          id_empresa,
          id_filial,
          id_perfil,
          status_usuario: true,
        },
      ])
      .select();
    if (error) {
      console.error('Erro ao inserir usuário:', error);
      return res.status(500).json({ message: error.message || "Erro ao cadastrar usuário.", error });
    }
    res.status(201).json({ message: "Usuário cadastrado com sucesso!", user: data && data[0] ? data[0] : null });
  } catch (err) {
    console.error('[cadastrarUsuarioPublico] Erro inesperado:', err);
    res.status(500).json({ message: err?.message || "Erro no servidor.", error: err });
  }
};

module.exports = {
  cadastrarUsuario,
  editarUsuario,
  listarUsuarios,
  alterarStatusUsuario,
  cadastrarUsuarioPublico,
};
