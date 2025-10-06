const db = require("../db");
const bcrypt = require("bcryptjs");
const auditoriaService = require("../utils/auditoriaService");
const supabase = require("../db");

// Função para registrar auditoria (se não existir já)
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

    // Registrar auditoria
    console.log("🔍 Tentando registrar auditoria para cadastro de usuário...");
    const auditoriaResult = await registrarAuditoria(
      id_empresa,
      req.user.id_usuario, // Usuário que fez o cadastro
      id_filial,
      "Cadastrou usuário",
      `Cadastrou o usuário: ${nome_usuario} (${email_usuario})`
    );
    console.log("📝 Resultado da auditoria:", auditoriaResult);

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

// Método de criação (reformatado como função)
const create = async (req, res) => {
  try {
    // Extrair dados do corpo da requisição
    const { nome, email, senha, id_perfil, id_empresa, id_filial } = req.body;

    // Verificar se o usuário já existe
    const userExists = await db.query(
      "SELECT * FROM usuario WHERE email = $1",
      [email]
    );
    if (userExists.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Usuário com este e-mail já existe" });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Inserir novo usuário
    const result = await db.query(
      `INSERT INTO usuario (nome, email, senha, id_perfil, id_empresa, id_filial, ativo, criado_em) 
       VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP) RETURNING *`,
      [nome, email, hashedPassword, id_perfil, id_empresa, id_filial]
    );

    const novoUsuario = result.rows[0];

    // Registrar na auditoria
    await auditoriaService.registrarAcao(
      req.usuario.id_usuario,
      id_empresa,
      id_filial,
      "CADASTRO",
      `Cadastro de usuário: ${nome} (ID: ${novoUsuario.id_usuario})`,
      new Date()
    );

    // Remover a senha antes de retornar
    delete novoUsuario.senha;
    res.status(201).json(novoUsuario);
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
};

// Método de atualização (reformatado como função)
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, senha, id_perfil, id_filial } = req.body;

    // Obter dados atuais do usuário
    const usuarioAtual = await db.query(
      "SELECT * FROM usuario WHERE id_usuario = $1",
      [id]
    );

    if (usuarioAtual.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const dadosAntigos = usuarioAtual.rows[0];

    // Preparar campos para atualização
    const campos = [];
    const valores = [];
    let paramIndex = 1;

    if (nome !== undefined) {
      campos.push(`nome = $${paramIndex++}`);
      valores.push(nome);
    }

    if (email !== undefined) {
      campos.push(`email = $${paramIndex++}`);
      valores.push(email);
    }

    if (senha !== undefined) {
      const hashedPassword = await bcrypt.hash(senha, 10);
      campos.push(`senha = $${paramIndex++}`);
      valores.push(hashedPassword);
    }

    if (id_perfil !== undefined) {
      campos.push(`id_perfil = $${paramIndex++}`);
      valores.push(id_perfil);
    }

    if (id_filial !== undefined) {
      campos.push(`id_filial = $${paramIndex++}`);
      valores.push(id_filial);
    }

    campos.push(`atualizado_em = $${paramIndex++}`);
    valores.push(new Date());

    // Adicionar ID do usuário como último parâmetro
    valores.push(id);

    // Executar a atualização
    if (campos.length > 0) {
      const query = `
        UPDATE usuario
        SET ${campos.join(", ")}
        WHERE id_usuario = $${paramIndex}
        RETURNING *
      `;

      const result = await db.query(query, valores);
      const usuarioAtualizado = result.rows[0];

      // Criar objeto com dados novos para comparação na auditoria
      const dadosNovos = {
        nome: nome !== undefined ? nome : dadosAntigos.nome,
        email: email !== undefined ? email : dadosAntigos.email,
        id_perfil: id_perfil !== undefined ? id_perfil : dadosAntigos.id_perfil,
        id_filial: id_filial !== undefined ? id_filial : dadosAntigos.id_filial,
      };

      // Registrar na auditoria
      const descricao = auditoriaService.criarDescricaoEdicao(
        dadosAntigos,
        dadosNovos,
        `usuário ${dadosAntigos.nome} (ID: ${id})`
      );

      await auditoriaService.registrarAcao(
        req.usuario.id_usuario,
        dadosAntigos.id_empresa,
        dadosAntigos.id_filial,
        "EDICAO",
        descricao,
        new Date()
      );

      // Remover a senha antes de retornar
      delete usuarioAtualizado.senha;
      res.status(200).json(usuarioAtualizado);
    } else {
      res
        .status(400)
        .json({ error: "Nenhum campo para atualizar foi fornecido" });
    }
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({ error: "Erro ao atualizar usuário" });
  }
};

// Método para alternar o status (reformatado como função)
const toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Obter status atual
    const usuarioAtual = await db.query(
      "SELECT * FROM usuario WHERE id_usuario = $1",
      [id]
    );

    if (usuarioAtual.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const statusAtual = usuarioAtual.rows[0].ativo;
    const novoStatus = !statusAtual;

    // Atualizar status
    const result = await db.query(
      "UPDATE usuario SET ativo = $1, atualizado_em = CURRENT_TIMESTAMP WHERE id_usuario = $2 RETURNING *",
      [novoStatus, id]
    );

    // Registrar na auditoria
    await auditoriaService.registrarAcao(
      req.usuario.id_usuario,
      usuarioAtual.rows[0].id_empresa,
      usuarioAtual.rows[0].id_filial,
      novoStatus ? "ATIVACAO" : "INATIVACAO",
      `${novoStatus ? "Ativação" : "Inativação"} do usuário ${
        usuarioAtual.rows[0].nome
      } (ID: ${id})`,
      new Date()
    );

    // Remover a senha antes de retornar
    delete result.rows[0].senha;
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao alterar status do usuário:", error);
    res.status(500).json({ error: "Erro ao alterar status do usuário" });
  }
};

module.exports = {
  cadastrarUsuario,
  editarUsuario,
  listarUsuarios,
  alterarStatusUsuario,
  create,
  update,
  toggleStatus,
};
