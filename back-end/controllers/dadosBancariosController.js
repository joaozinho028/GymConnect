const supabase = require("../db");

// Busca dados bancários da empresa pelo id_empresa
exports.getDadosBancarios = async (req, res) => {
  try {
    const { id_empresa } = req.user;
    const { data, error } = await supabase
      .from("dados_bancarios_empresa")
      .select("*")
      .eq("id_empresa", id_empresa)
      .limit(1)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    if (!data) {
      return res.json(null);
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao buscar dados bancários." });
  }
};

// Cadastra ou atualiza dados bancários da empresa
exports.saveDadosBancarios = async (req, res) => {
  try {
    const { id_empresa } = req.user;
    const { banco, agencia, conta, tipo_conta, cpf_cnpj, titular } = req.body;
    // Verifica se já existe
    const { data: existe, error: errorExiste } = await supabase
      .from("dados_bancarios_empresa")
      .select("id_dados_bancarios")
      .eq("id_empresa", id_empresa)
      .maybeSingle();
    if (errorExiste) throw errorExiste;
    if (existe) {
      // Atualiza
      const { error: updateError } = await supabase
        .from("dados_bancarios_empresa")
        .update({
          banco,
          agencia,
          conta,
          tipo_conta,
          cpf_cnpj,
          titular,
          atualizado_em: new Date(),
        })
        .eq("id_empresa", id_empresa);
      if (updateError) throw updateError;
    } else {
      // Insere
      const { error: insertError } = await supabase
        .from("dados_bancarios_empresa")
        .insert([
          { id_empresa, banco, agencia, conta, tipo_conta, cpf_cnpj, titular },
        ]);
      if (insertError) throw insertError;
    }
    res.json({ message: "Dados bancários salvos com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao salvar dados bancários." });
  }
};
