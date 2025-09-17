const supabase = require("../db");
const bcrypt = require("bcrypt");

const register = async (req, res) => {
  const {
    nome_usuario,
    email_usuario,
    senha_usuario,
    id_empresa,
    id_filial,
    id_perfil,
  } = req.body;

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
      return res
        .status(500)
        .json({ message: "Erro ao cadastrar usuário", error });
    }

    res
      .status(201)
      .json({ message: "Usuário cadastrado com sucesso", user: data[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor" });
  }
};

module.exports = { register };
