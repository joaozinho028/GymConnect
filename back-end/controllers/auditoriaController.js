const supabase = require("../db");

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

    const { data, error } = await supabase
      .from("auditoria")
      .insert([
        {
          id_empresa,
          id_usuario,
          id_filial,
          acao,
          descricao,
          data_acao: new Date().toISOString(),
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
      .select(
        `
        id_auditoria,
        acao,
        descricao,
        data_acao,
        id_usuario,
        id_filial,
        usuarios(nome_usuario, email_usuario),
        filiais(nome_filial)
      `
      )
      .eq("id_empresa", id_empresa)
      .order("data_acao", { ascending: false });

    // Aplicar filtros
    if (filtro_acao) {
      query = query.ilike("acao", `%${filtro_acao}%`);
    }

    if (filtro_usuario) {
      query = query.or(
        `usuarios.nome_usuario.ilike.%${filtro_usuario}%,usuarios.email_usuario.ilike.%${filtro_usuario}%`
      );
    }

    if (data_inicio) {
      query = query.gte("data_acao", new Date(data_inicio).toISOString());
    }

    if (data_fim) {
      const dataFimFormatada = new Date(data_fim);
      dataFimFormatada.setHours(23, 59, 59, 999);
      query = query.lte("data_acao", dataFimFormatada.toISOString());
    }

    // Paginação
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({
        message: "Erro ao consultar auditoria",
        error,
      });
    }

    // Mapear dados para formato amigável
    const auditorias = (data || []).map((a) => ({
      id: a.id_auditoria,
      acao: a.acao,
      descricao: a.descricao,
      data: new Date(a.data_acao).toLocaleString("pt-BR"),
      usuario: a.usuarios?.nome_usuario || "Usuário não encontrado",
      email_usuario: a.usuarios?.email_usuario || "",
      filial: a.filiais?.nome_filial || "Filial não encontrada",
      timestamp: a.data_acao,
    }));

    res.json({
      auditorias,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || data?.length || 0,
      },
    });
  } catch (err) {
    console.error("Erro ao consultar auditoria:", err);
    res.status(500).json({
      message: "Erro no servidor",
      error: err?.message,
    });
  }
};

module.exports = { registrarAuditoria, consultaAuditoria };
