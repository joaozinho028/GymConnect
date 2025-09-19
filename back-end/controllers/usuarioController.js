const supabase = require("../db");
const bcrypt = require("bcrypt");

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
        `id_usuario, nome_usuario, email_usuario, status_usuario, perfis(nome_perfil), filiais(nome_filial), created_at`
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
    res.json({ message: "Status atualizado com sucesso!", user: data[0] });
  } catch (err) {
    res
      .status(500)
      .json({ message: err?.message || "Erro no servidor.", error: err });
  }
};

module.exports = { cadastrarUsuario, listarUsuarios, alterarStatusUsuario };
