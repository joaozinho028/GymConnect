const supabase = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    // Buscar usuário pelo email
    const { data: userData, error: userError } = await supabase
      .from("usuarios")
      .select(
        "id_usuario, nome_usuario, id_empresa, email_usuario, senha_usuario, id_filial, id_perfil"
      )
      .eq("email_usuario", email)
      .single();

    if (userError || !userData) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    // Validar senha usando bcrypt
    const senhaValida = await bcrypt.compare(senha, userData.senha_usuario);
    if (!senhaValida) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    // Gerar token JWT com dados relevantes
    const token = jwt.sign(
      {
        id_usuario: userData.id_usuario,
        id_empresa: userData.id_empresa,
        id_filial: userData.id_filial,
        id_perfil: userData.id_perfil,
        nome_usuario: userData.nome_usuario,
        email_usuario: userData.email_usuario,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        id_usuario: userData.id_usuario,
        nome_usuario: userData.nome_usuario,
        id_empresa: userData.id_empresa,
        id_filial: userData.id_filial,
        id_perfil: userData.id_perfil,
        email_usuario: userData.email_usuario,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor" });
  }
};

const getProfile = async (req, res) => {
  try {
    const { id_usuario, id_empresa, id_filial } = req.user;

    // Buscar dados do usuário
    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select(
        "id_usuario, nome_usuario, email_usuario, id_perfil, avatar_url, ultima_atividade"
      )
      .eq("id_usuario", id_usuario)
      .single();
    if (usuarioError || !usuario) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    // Buscar dados da empresa
    const { data: empresa, error: empresaError } = await supabase
      .from("empresas")
      .select("nome_empresa, cnpj_empresa")
      .eq("id_empresa", id_empresa)
      .single();
    if (empresaError || !empresa) {
      return res.status(404).json({ message: "Empresa não encontrada" });
    }

    // Buscar dados da filial
    const { data: filial, error: filialError } = await supabase
      .from("filiais")
      .select("nome_filial, endereco")
      .eq("id_filial", id_filial)
      .single();
    if (filialError || !filial) {
      return res.status(404).json({ message: "Filial não encontrada" });
    }

    res.json({ usuario, empresa, filial });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao buscar perfil" });
  }
};

module.exports = { login, getProfile };
