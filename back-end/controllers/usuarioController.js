const supabase = require("../db");

// Listar usuários da empresa do usuário logado
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

module.exports = { listarUsuarios };
