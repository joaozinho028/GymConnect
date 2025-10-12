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
    const {
      banco,
      agencia,
      conta,
      tipo_conta,
      cpf_cnpj,
      titular,
      chave_pix,
      tipo_chave_pix,
    } = req.body;

    // Validação básica
    if (!banco || !agencia || !conta || !tipo_conta || !cpf_cnpj || !titular) {
      return res
        .status(400)
        .json({
          message: "Todos os campos obrigatórios devem ser preenchidos",
        });
    }

    // Validação do CNPJ (14 dígitos)
    const cnpjLimpo = cpf_cnpj.replace(/\D/g, "");
    if (cnpjLimpo.length !== 14) {
      return res.status(400).json({ message: "CNPJ deve conter 14 dígitos" });
    }

    // Validação da chave PIX se fornecida
    if (chave_pix && !tipo_chave_pix) {
      return res.status(400).json({
        message: "Tipo da chave PIX é obrigatório quando chave PIX é fornecida",
      });
    }

    // Verifica se já existe registro para esta empresa
    const { data: existe, error: errorExiste } = await supabase
      .from("dados_bancarios_empresa")
      .select("id_dados_bancarios")
      .eq("id_empresa", id_empresa)
      .maybeSingle();

    if (errorExiste) throw errorExiste;

    const dadosParaSalvar = {
      banco,
      agencia,
      conta,
      tipo_conta,
      cpf_cnpj: cnpjLimpo,
      titular,
      chave_pix: chave_pix || null,
      tipo_chave_pix: chave_pix ? tipo_chave_pix : null,
      atualizado_em: new Date().toISOString(),
    };

    let resultado;

    if (existe) {
      // Atualiza registro existente
      const { data, error } = await supabase
        .from("dados_bancarios_empresa")
        .update(dadosParaSalvar)
        .eq("id_dados_bancarios", existe.id_dados_bancarios)
        .select();

      if (error) throw error;
      resultado = data[0];
    } else {
      // Insere novo registro
      const { data, error } = await supabase
        .from("dados_bancarios_empresa")
        .insert({
          id_empresa,
          ...dadosParaSalvar,
          criado_em: new Date().toISOString(),
        })
        .select();

      if (error) throw error;
      resultado = data[0];
    }

    console.log("Dados bancários salvos:", resultado);

    res.json({
      message: "Dados bancários salvos com sucesso!",
      data: resultado,
    });
  } catch (err) {
    console.error("Erro ao salvar dados bancários:", err);
    res.status(500).json({
      message: "Erro interno do servidor ao salvar dados bancários.",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Buscar configurações de transferência
const buscarConfiguracoesTrasferencia = async (req, res) => {
  try {
    const { id_empresa } = req.user;

    const { data, error } = await supabase
      .from("configuracoes_transferencia_empresa")
      .select("*")
      .eq("id_empresa", id_empresa)
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    if (!data) {
      // Retorna configuração padrão se não existir
      return res.json({
        ativo: false,
        intervalo: "DAILY",
        horario: "18:00",
        valor_minimo: 10.0,
        tipo_transferencia: "PIX",
      });
    }

    res.json({
      ativo: data.ativo,
      intervalo: data.intervalo,
      horario: data.horario.substring(0, 5), // Formato HH:MM
      valor_minimo: parseFloat(data.valor_minimo),
      tipo_transferencia: data.tipo_transferencia,
      asaas_account_id: data.asaas_account_id,
      asaas_api_key: data.asaas_api_key,
    });
  } catch (err) {
    console.error("Erro ao buscar configurações de transferência:", err);
    res
      .status(500)
      .json({ message: "Erro ao buscar configurações de transferência." });
  }
};

// Salvar configurações de transferência + integração Asaas
const salvarConfiguracoesTrasferencia = async (req, res) => {
  try {
    const { id_empresa } = req.user;
    const {
      ativo,
      intervalo,
      horario,
      valor_minimo,
      tipo_transferencia,
      chave_pix,
      tipo_chave_pix,
      dados_bancarios,
    } = req.body;

    // Validações básicas
    if (valor_minimo < 10) {
      return res.status(400).json({
        message: "Valor mínimo deve ser de pelo menos R$ 10,00",
      });
    }

    // Buscar dados bancários atuais para validar se existem
    const { data: dadosBancarios, error: errorDados } = await supabase
      .from("dados_bancarios_empresa")
      .select("*")
      .eq("id_empresa", id_empresa)
      .single();

    if (errorDados && errorDados.code !== "PGRST116") throw errorDados;

    if (!dadosBancarios && ativo) {
      return res.status(400).json({
        message:
          "É necessário cadastrar dados bancários antes de ativar transferências automáticas",
      });
    }

    // Verifica se já existe configuração
    const { data: configExiste, error: errorConfig } = await supabase
      .from("configuracoes_transferencia_empresa")
      .select("id_configuracao")
      .eq("id_empresa", id_empresa)
      .maybeSingle();

    if (errorConfig) throw errorConfig;

    const configParaSalvar = {
      ativo,
      intervalo,
      horario: horario + ":00", // Adiciona segundos
      valor_minimo,
      tipo_transferencia: chave_pix ? "PIX" : "TED",
      atualizado_em: new Date().toISOString(),
    };

    let resultado;

    if (configExiste) {
      // Atualiza configuração existente
      const { data, error } = await supabase
        .from("configuracoes_transferencia_empresa")
        .update(configParaSalvar)
        .eq("id_configuracao", configExiste.id_configuracao)
        .select();

      if (error) throw error;
      resultado = data[0];
    } else {
      // Insere nova configuração
      const { data, error } = await supabase
        .from("configuracoes_transferencia_empresa")
        .insert({
          id_empresa,
          ...configParaSalvar,
          criado_em: new Date().toISOString(),
        })
        .select();

      if (error) throw error;
      resultado = data[0];
    }

    // TODO: Aqui você implementará a integração com Asaas
    // Exemplo de como seria:
    /*
    if (ativo) {
      try {
        // Criar/atualizar configuração no Asaas
        const asaasResponse = await configurarTransferenciaAsaas({
          empresa_id: id_empresa,
          dados_bancarios: dadosBancarios,
          chave_pix,
          tipo_chave_pix,
          configuracao: configParaSalvar
        });
        
        // Salvar IDs do Asaas na configuração
        if (asaasResponse.account_id) {
          await supabase
            .from("configuracoes_transferencia_empresa")
            .update({
              asaas_account_id: asaasResponse.account_id,
              asaas_api_key: asaasResponse.api_key
            })
            .eq("id_configuracao", resultado.id_configuracao);
        }
      } catch (asaasError) {
        console.error("Erro na integração Asaas:", asaasError);
        // Não falha a operação, mas loga o erro
      }
    }
    */

    console.log("Configurações de transferência salvas:", resultado);

    res.json({
      message: "Configurações de transferência salvas com sucesso!",
      data: resultado,
    });
  } catch (err) {
    console.error("Erro ao salvar configurações de transferência:", err);
    res.status(500).json({
      message: "Erro interno do servidor ao salvar configurações.",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

module.exports = {
  buscarDadosBancarios,
  salvarDadosBancarios,
  buscarConfiguracoesTrasferencia,
  salvarConfiguracoesTrasferencia,
};
