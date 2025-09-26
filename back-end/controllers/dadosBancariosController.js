const supabase = require("../db");

const buscarDadosBancarios = async (req, res) => {
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

const salvarDadosBancarios = async (req, res) => {
  try {
    const { id_empresa } = req.user;
    const { banco, agencia, conta, tipo_conta, cpf_cnpj, titular } = req.body;

    // Validação básica
    if (!banco || !agencia || !conta || !tipo_conta || !cpf_cnpj || !titular) {
      return res
        .status(400)
        .json({ message: "Todos os campos são obrigatórios" });
    }

    // Verifica se já existe
    const { data: existe, error: errorExiste } = await supabase
      .from("dados_bancarios_empresa")
      .select("id_dados_bancarios")
      .eq("id_empresa", id_empresa)
      .maybeSingle();

    if (errorExiste) throw errorExiste;

    let resultado;

    if (existe) {
      // Atualiza - GARANTINDO QUE TODOS OS CAMPOS SEJAM INCLUÍDOS
      const { data, error } = await supabase
        .from("dados_bancarios_empresa")
        .update({
          banco: banco, // Certifique-se de que este campo está sendo explicitamente atualizado
          agencia,
          conta,
          tipo_conta: tipo_conta, // Certifique-se de que este campo está sendo explicitamente atualizado
          cpf_cnpj,
          titular,
        })
        .eq("id_dados_bancarios", existe.id_dados_bancarios)
        .select();

      if (error) throw error;
      resultado = data;
    } else {
      // Insere novo - GARANTINDO QUE TODOS OS CAMPOS SEJAM INCLUÍDOS
      const { data, error } = await supabase
        .from("dados_bancarios_empresa")
        .insert({
          id_empresa,
          banco: banco, // Certifique-se de que este campo está sendo explicitamente inserido
          agencia,
          conta,
          tipo_conta: tipo_conta, // Certifique-se de que este campo está sendo explicitamente inserido
          cpf_cnpj,
          titular,
        })
        .select();

      if (error) throw error;
      resultado = data;
    }

    console.log("Dados bancários salvos:", resultado);

    res.json({
      message: "Dados bancários salvos com sucesso!",
      data: resultado,
    });
  } catch (err) {
    console.error("Erro ao salvar dados bancários:", err);
    res.status(500).json({ message: "Erro ao salvar dados bancários." });
  }
};

module.exports = { buscarDadosBancarios, salvarDadosBancarios };
