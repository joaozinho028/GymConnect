const supabase = require("../db");

// Função utilitária para gerar descrição detalhada de edições
function gerarDescricaoEdicao(entidade, antigo, novo) {
  const alteracoes = [];
  for (const campo in novo) {
    if (
      Object.prototype.hasOwnProperty.call(antigo, campo) &&
      novo[campo] !== antigo[campo] &&
      campo !== "criado_em" &&
      campo !== "atualizado_em"
    ) {
      alteracoes.push(`${campo}: "${antigo[campo]}" → "${novo[campo]}"`);
    }
  }
  return `Alteração em ${entidade}: ${alteracoes.join(", ")}`;
}

const registrarAuditoria = async (
  id_empresa,
  id_usuario,
  id_filial,
  acao,
  descricao
) => {
  try {
    console.log("📝 Registrando auditoria:", {
      id_empresa,
      id_usuario,
      id_filial,
      acao,
      descricao,
    });

    // Nota: verificamos se a tabela tem a coluna 'descricao'
    // Se não tiver, o Supabase ignora este campo
    const { data, error } = await supabase
      .from("auditoria")
      .insert([
        {
          id_empresa,
          id_usuario,
          id_filial,
          acao,
          descricao,
          criado_em: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("❌ Erro ao registrar auditoria:", error);
      return { success: false, error };
    }

    console.log("✅ Auditoria registrada com sucesso:", data);
    return { success: true, data: data[0] };
  } catch (err) {
    console.error("❌ Erro inesperado ao registrar auditoria:", err);
    return { success: false, error: err };
  }
};

const consultaAuditoria = async (req, res) => {
  try {
    const { id_empresa } = req.user;
    const {
      page = 1,
      limit = 50,
      filtro_acao,
      filtro_usuario,
      data_inicio,
      data_fim,
    } = req.query;

    let query = supabase
      .from("auditoria")
      .select("*")
      .eq("id_empresa", id_empresa);

    if (filtro_acao) query = query.eq("acao", filtro_acao);
    if (filtro_usuario) query = query.eq("id_usuario", filtro_usuario);
    if (data_inicio) query = query.gte("criado_em", data_inicio);
    if (data_fim) query = query.lte("criado_em", data_fim);

    query = query.order("criado_em", { ascending: false });

    // Paginação
    const from = (page - 1) * limit;
    const to = from + Number(limit) - 1;
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ success: false, error });
    }

    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  registrarAuditoria,
  consultaAuditoria,
  gerarDescricaoEdicao,
};
