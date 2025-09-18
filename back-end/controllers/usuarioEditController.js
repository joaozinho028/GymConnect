const supabase = require("../db");

// Ativar/Inativar usuário (apenas status_usuario)
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

module.exports = { alterarStatusUsuario };
