const supabase = require("../db");

// Listar perfis da empresa do usuário logado
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

// Listar filiais da empresa do usuário logado
const listarFiliais = async (req, res) => {
  try {
    const id_empresa = req.user.id_empresa;
    console.log("ID da empresa do usuário logado:", id_empresa);
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

module.exports = { listarPerfis, listarFiliais };
