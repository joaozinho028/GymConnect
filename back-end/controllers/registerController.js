const supabase = require("../db");
const bcrypt = require("bcrypt");

const register = async (req, res) => {
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

module.exports = { register };
