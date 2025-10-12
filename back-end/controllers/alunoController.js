const supabase = require("../db");
const auditoriaService = require("../utils/auditoriaService");
const { validarCPF, validarEmail, limparCPF } = require("../utils/validadores");
const {
  gerarBoleto,
  processarPIX,
  processarCartaoCredito,
  calcularValorPlano,
  criarLinkPagamento,
  consultarStatusPagamento,
  asaasRequest, // Adicione esta linha
} = require("./asaasController");

// Função para registrar auditoria de alunos
const registrarAuditoria = async (
  id_empresa,
  id_usuario,
  id_filial,
  acao,
  descricao
) => {
  try {
    const { data, error } = await supabase.from("auditoria").insert([
      {
        id_empresa,
        id_usuario,
        id_filial,
        acao,
        descricao,
        data_acao: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Erro ao registrar auditoria:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Erro ao registrar auditoria:", error);
    return { success: false, error };
  }
};

// Função auxiliar para formatar CPF para auditoria
const formatarCPFParaAuditoria = (cpf) => {
  if (!cpf) return "";
  const cpfLimpo = cpf.replace(/[^\d]/g, "");
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

// Função para gerar matrícula única de 5 dígitos
const gerarMatriculaUnica = async (id_empresa, id_filial) => {
  let tentativas = 0;
  const maxTentativas = 100; // Evitar loop infinito

  while (tentativas < maxTentativas) {
    // Gerar 5 dígitos aleatórios (10000 a 99999)
    const matricula = Math.floor(Math.random() * 90000) + 10000;
    const matriculaString = matricula.toString();

    // Verificar se já existe na mesma filial
    const { data: matriculaExistente } = await supabase
      .from("alunos")
      .select("matricula_aluno")
      .eq("matricula_aluno", matriculaString)
      .eq("id_empresa", id_empresa)
      .eq("id_filial", id_filial)
      .single();

    if (!matriculaExistente) {
      return matriculaString;
    }

    tentativas++;
  }

  // Se não conseguir gerar após 100 tentativas, usar timestamp como fallback
  const timestamp = Date.now().toString().slice(-5);
  return timestamp;
};

const cadastrarAluno = async (req, res) => {
  try {
    const {
      nome_aluno,
      email_aluno,
      telefone_aluno,
      cpf_aluno,
      plano_aluno,
      forma_pagamento,
      dados_cartao, // Novo campo para dados do cartão
    } = req.body;

    const { id_empresa, id_filial, id_usuario } = req.user;

    console.log("📋 Iniciando cadastro de aluno:", {
      nome: nome_aluno,
      plano: plano_aluno,
      forma_pagamento,
      empresa: id_empresa,
      filial: id_filial,
    });

    // Validação dos campos obrigatórios
    if (
      !nome_aluno ||
      !email_aluno ||
      !telefone_aluno ||
      !cpf_aluno ||
      !plano_aluno ||
      !forma_pagamento
    ) {
      return res.status(400).json({
        error: "Todos os campos são obrigatórios",
        tipo: "validacao_erro",
      });
    }

    // Limpar CPF antes de validar e salvar
    const cpfLimpo = limparCPF(cpf_aluno);

    // Validar CPF
    const validacaoCPF = validarCPF(cpf_aluno);
    if (!validacaoCPF.valido) {
      return res.status(400).json({
        error: validacaoCPF.erro,
        tipo: "validacao_erro",
      });
    }

    // Validar email
    const validacaoEmail = validarEmail(email_aluno);
    if (!validacaoEmail.valido) {
      return res.status(400).json({
        error: validacaoEmail.erro,
        tipo: "validacao_erro",
      });
    }

    // Verificar se CPF já existe na mesma empresa
    const { data: alunoExistente } = await supabase
      .from("alunos")
      .select("cpf_aluno, nome_aluno")
      .eq("cpf_aluno", cpfLimpo)
      .eq("id_empresa", id_empresa)
      .single();

    if (alunoExistente) {
      return res.status(400).json({
        error: `CPF já cadastrado para o aluno: ${alunoExistente.nome_aluno}`,
        tipo: "validacao_erro",
      });
    }

    // Verificar se email já existe na mesma empresa
    const { data: emailExistente } = await supabase
      .from("alunos")
      .select("email_aluno, nome_aluno")
      .eq("email_aluno", email_aluno.toLowerCase())
      .eq("id_empresa", id_empresa)
      .single();

    if (emailExistente) {
      return res.status(400).json({
        error: `E-mail já cadastrado para o aluno: ${emailExistente.nome_aluno}`,
        tipo: "validacao_erro",
      });
    }

    // Preparar dados do aluno
    const dadosAluno = {
      nome_aluno: nome_aluno.trim(),
      email_aluno: email_aluno.toLowerCase().trim(),
      telefone_aluno: telefone_aluno.trim(),
      cpf_aluno: cpfLimpo,
      plano_aluno: plano_aluno.toLowerCase(),
    };

    let dadosResposta = {};

    // Processar de acordo com a forma de pagamento
    if (forma_pagamento === "boleto") {
      console.log("🎫 Processando BOLETO...");

      try {
        // Gerar boleto via Asaas
        const resultadoBoleto = await gerarBoleto(dadosAluno);

        // Gerar matrícula única
        const matricula_aluno = await gerarMatriculaUnica(
          id_empresa,
          id_filial
        );

        // Cadastrar aluno com status "aguardando_pagamento"
        const { data: novoAluno, error: erroAluno } = await supabase
          .from("alunos")
          .insert({
            ...dadosAluno,
            matricula_aluno,
            forma_pagamento,
            situacao: "aguardando pagamento",
            status_aluno: true, // Conforme sua regra
            id_empresa,
            id_filial,
            asaas_payment_id: resultadoBoleto.id, // Guardar ID do Asaas
            asaas_customer_id: resultadoBoleto.customer_id,
            data_cadastro: new Date().toISOString(),
          })
          .select()
          .single();

        if (erroAluno) {
          console.error("Erro ao inserir aluno:", erroAluno);
          return res.status(500).json({
            error: "Erro ao cadastrar aluno",
            tipo: "database_erro",
          });
        }

        // Registrar transação
        const valorPlano = calcularValorPlano(plano_aluno);
        await supabase.from("transacoes").insert({
          id_empresa,
          id_filial,
          id_aluno: novoAluno.id_aluno,
          id_usuario,
          valor: valorPlano,
          metodo_pagamento: "boleto",
          status: false, // Pendente até confirmação
          asaas_payment_id: resultadoBoleto.id,
        });

        // Registrar auditoria
        const cpfFormatado = formatarCPFParaAuditoria(cpfLimpo);
        const descricaoAuditoria = `Cadastrou o aluno: ${nome_aluno} (CPF: ${cpfFormatado}, Matrícula: ${matricula_aluno}). Plano: ${plano_aluno}, Pagamento: Boleto gerado, Situação: aguardando pagamento`;

        await registrarAuditoria(
          id_empresa,
          id_usuario,
          id_filial,
          "CADASTRO_ALUNO",
          descricaoAuditoria
        );

        dadosResposta = {
          message: "Aluno cadastrado com sucesso! Boleto gerado.",
          tipo: "boleto",
          aluno: novoAluno,
          boleto: {
            id: resultadoBoleto.id,
            valor: resultadoBoleto.valor,
            vencimento: resultadoBoleto.vencimento,
            linkBoleto: resultadoBoleto.linkBoleto,
            linkVisualizacao: resultadoBoleto.linkVisualizacao,
            codigoBarras: resultadoBoleto.codigoBarras,
          },
        };
      } catch (error) {
        console.error("❌ Erro ao processar boleto:", error.message);
        return res.status(500).json({
          error: "Erro ao gerar boleto. Tente novamente.",
          tipo: "pagamento_erro",
          detalhe: error.message,
        });
      }
    } else if (forma_pagamento === "pix") {
      console.log("💳 Processando PIX...");

      try {
        // Processar PIX via Asaas
        const resultadoPIX = await processarPIX(dadosAluno);

        // Para PIX, retorna os dados para o frontend mostrar o QR Code
        // NÃO cadastra o aluno ainda - só depois da confirmação do pagamento
        dadosResposta = {
          message: "PIX gerado com sucesso! Escaneie o QR Code para pagar.",
          tipo: "pix",
          pix: {
            id: resultadoPIX.id,
            valor: resultadoPIX.valor,
            qrCodePix: resultadoPIX.qrCodePix,
            qrCodeImage: resultadoPIX.qrCodeImage,
            expiraEm: resultadoPIX.expiraEm,
          },
          // Dados temporários para completar cadastro após pagamento
          dadosAluno: {
            ...dadosAluno,
            asaas_payment_id: resultadoPIX.id,
            asaas_customer_id: resultadoPIX.customer_id,
            id_empresa,
            id_filial,
            id_usuario,
          },
        };
      } catch (error) {
        console.error("❌ Erro ao processar PIX:", error.message);
        return res.status(500).json({
          error: "Erro ao gerar PIX. Tente novamente.",
          tipo: "pagamento_erro",
          detalhe: error.message,
        });
      }
    } else if (forma_pagamento === "credito" || forma_pagamento === "debito") {
      console.log(`💳 Processando ${forma_pagamento.toUpperCase()}...`);

      // Validar dados do cartão
      if (
        !dados_cartao ||
        !dados_cartao.numeroCartao ||
        !dados_cartao.nomeCartao ||
        !dados_cartao.mesVencimento ||
        !dados_cartao.anoVencimento ||
        !dados_cartao.cvv
      ) {
        return res.status(400).json({
          error: "Dados do cartão são obrigatórios",
          tipo: "validacao_erro",
        });
      }

      try {
        // Processar cartão via Asaas
        const resultadoCartao = await processarCartaoCredito(
          dadosAluno,
          dados_cartao
        );

        if (resultadoCartao.aprovado) {
          // PAGAMENTO APROVADO: Cadastrar aluno

          const matricula_aluno = await gerarMatriculaUnica(
            id_empresa,
            id_filial
          );

          const { data: novoAluno, error: erroAluno } = await supabase
            .from("alunos")
            .insert({
              ...dadosAluno,
              matricula_aluno,
              forma_pagamento,
              situacao: "regular",
              status_aluno: true,
              id_empresa,
              id_filial,
              asaas_payment_id: resultadoCartao.id,
              asaas_customer_id: resultadoCartao.customer_id,
              data_cadastro: new Date().toISOString(),
            })
            .select()
            .single();

          if (erroAluno) {
            console.error("Erro ao inserir aluno:", erroAluno);
            return res.status(500).json({
              error: "Erro ao cadastrar aluno após pagamento aprovado",
              tipo: "database_erro",
            });
          }

          // Registrar transação aprovada
          const valorPlano = calcularValorPlano(plano_aluno);
          await supabase.from("transacoes").insert({
            id_empresa,
            id_filial,
            id_aluno: novoAluno.id_aluno,
            id_usuario,
            valor: valorPlano,
            metodo_pagamento: forma_pagamento,
            status: true, // Aprovado
            asaas_payment_id: resultadoCartao.id,
          });

          // Registrar auditoria
          const cpfFormatado = formatarCPFParaAuditoria(cpfLimpo);
          const descricaoAuditoria = `Cadastrou o aluno: ${nome_aluno} (CPF: ${cpfFormatado}, Matrícula: ${matricula_aluno}). Plano: ${plano_aluno}, Pagamento: ${forma_pagamento} aprovado, Situação: regular`;

          await registrarAuditoria(
            id_empresa,
            id_usuario,
            id_filial,
            "CADASTRO_ALUNO",
            descricaoAuditoria
          );

          dadosResposta = {
            message: `Pagamento via ${forma_pagamento} aprovado! Aluno cadastrado com sucesso.`,
            tipo: "pagamento_aprovado",
            aluno: novoAluno,
            pagamento: {
              id: resultadoCartao.id,
              valor: resultadoCartao.valor,
              metodo: forma_pagamento,
            },
          };
        } else {
          // PAGAMENTO REJEITADO: Não cadastrar aluno
          dadosResposta = {
            message:
              "Pagamento rejeitado. Verifique os dados do cartão e tente novamente.",
            tipo: "pagamento_rejeitado",
            erro: resultadoCartao.motivo_rejeicao || "Cartão recusado",
            pagamento: {
              id: resultadoCartao.id,
              status: resultadoCartao.status,
            },
          };

          return res.status(400).json(dadosResposta);
        }
      } catch (error) {
        console.error(
          `❌ Erro ao processar ${forma_pagamento}:`,
          error.message
        );
        return res.status(500).json({
          error: `Erro ao processar pagamento via ${forma_pagamento}. Tente novamente.`,
          tipo: "pagamento_erro",
          detalhe: error.message,
        });
      }
    } else {
      return res.status(400).json({
        error: "Forma de pagamento inválida",
        tipo: "validacao_erro",
      });
    }

    console.log("✅ Cadastro processado com sucesso:", dadosResposta.tipo);
    res.status(201).json(dadosResposta);
  } catch (error) {
    console.error("❌ Erro geral no cadastro de aluno:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
      tipo: "server_erro",
    });
  }
};

// Nova função para confirmar pagamento PIX (será chamada via webhook ou polling)
const confirmarPagamentoPIX = async (req, res) => {
  try {
    const { asaas_payment_id, dadosAluno } = req.body;

    console.log("🔄 Confirmando pagamento PIX:", asaas_payment_id);

    // Consultar status no Asaas
    const { consultarStatusPagamento } = require("./asaasController");
    const statusPagamento = await consultarStatusPagamento(asaas_payment_id);

    if (statusPagamento.aprovado) {
      // Pagamento confirmado: Cadastrar aluno
      const matricula_aluno = await gerarMatriculaUnica(
        dadosAluno.id_empresa,
        dadosAluno.id_filial
      );

      const { data: novoAluno, error: erroAluno } = await supabase
        .from("alunos")
        .insert({
          ...dadosAluno,
          matricula_aluno,
          forma_pagamento: "pix",
          situacao: "regular",
          status_aluno: true,
          data_cadastro: new Date().toISOString(),
        })
        .select()
        .single();

      if (erroAluno) {
        throw erroAluno;
      }

      // Registrar transação
      const valorPlano = calcularValorPlano(dadosAluno.plano_aluno);
      await supabase.from("transacoes").insert({
        id_empresa: dadosAluno.id_empresa,
        id_filial: dadosAluno.id_filial,
        id_aluno: novoAluno.id_aluno,
        id_usuario: dadosAluno.id_usuario,
        valor: valorPlano,
        metodo_pagamento: "pix",
        status: true,
        asaas_payment_id,
      });

      // Registrar auditoria
      const cpfFormatado = formatarCPFParaAuditoria(dadosAluno.cpf_aluno);
      const descricaoAuditoria = `Cadastrou o aluno: ${dadosAluno.nome_aluno} (CPF: ${cpfFormatado}, Matrícula: ${matricula_aluno}). Plano: ${dadosAluno.plano_aluno}, Pagamento: PIX confirmado, Situação: regular`;

      await registrarAuditoria(
        dadosAluno.id_empresa,
        dadosAluno.id_usuario,
        dadosAluno.id_filial,
        "CADASTRO_ALUNO",
        descricaoAuditoria
      );

      res.json({
        success: true,
        message: "Pagamento PIX confirmado! Aluno cadastrado com sucesso.",
        aluno: novoAluno,
      });
    } else if (statusPagamento.vencido || statusPagamento.cancelado) {
      res.status(400).json({
        success: false,
        message: "Pagamento PIX expirou ou foi cancelado.",
        status: statusPagamento.status,
      });
    } else {
      res.json({
        success: false,
        message: "Pagamento PIX ainda pendente.",
        status: statusPagamento.status,
        aguardando: true,
      });
    }
  } catch (error) {
    console.error("❌ Erro ao confirmar pagamento PIX:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao confirmar pagamento PIX",
    });
  }
};

const consultarAlunos = async (req, res) => {
  try {
    const { id_empresa } = req.user;

    const { data: alunos, error } = await supabase
      .from("alunos")
      .select("*")
      .eq("id_empresa", id_empresa)
      .order("data_cadastro", { ascending: false });

    if (error) {
      console.error("Erro ao listar alunos:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }

    res.status(200).json(alunos);
  } catch (error) {
    console.error("Erro ao listar alunos:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

const obterEstatisticasAlunos = async (req, res) => {
  try {
    const { id_filial } = req.params;
    const { id_empresa } = req.user;

    console.log(
      `Buscando estatísticas para filial: ${id_filial}, empresa: ${id_empresa}`
    );

    // Buscar todos os alunos da filial e empresa
    const { data: alunos, error } = await supabase
      .from("alunos")
      .select("status_aluno, situacao")
      .eq("id_empresa", id_empresa)
      .eq("id_filial", id_filial);

    if (error) {
      console.error("Erro ao buscar alunos:", error);
      return res.status(500).json({ error: "Erro ao buscar estatísticas" });
    }

    // Contar alunos por status
    const estatisticas = {
      cadastrados: alunos.length,
      ativos: alunos.filter((aluno) => aluno.status_aluno === true).length,
      inativos: alunos.filter((aluno) => aluno.status_aluno === false).length,
      inadimplentes: alunos.filter(
        (aluno) => aluno.situacao === "aguardando pagamento"
      ).length,
    };

    console.log("Estatísticas calculadas:", estatisticas);

    res.json(estatisticas);
  } catch (error) {
    console.error("Erro ao obter estatísticas:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

const editarAlunos = async (req, res) => {
  try {
    const { id_empresa, id_filial, id_usuario } = req.user;
    const {
      id_aluno,
      nome_aluno,
      email_aluno,
      telefone_aluno,
      cpf_aluno,
      plano_aluno,
    } = req.body;

    if (!id_aluno) {
      return res.status(400).json({ message: "ID do aluno é obrigatório." });
    }

    // Buscar dados atuais do aluno para auditoria
    const { data: alunoAtual, error: errorBuscaAtual } = await supabase
      .from("alunos")
      .select(
        `
        nome_aluno, 
        email_aluno, 
        telefone_aluno, 
        cpf_aluno, 
        plano_aluno,
        matricula_aluno
      `
      )
      .eq("id_aluno", id_aluno)
      .eq("id_empresa", id_empresa)
      .eq("id_filial", id_filial)
      .single();

    if (errorBuscaAtual || !alunoAtual) {
      return res.status(404).json({
        message: "Aluno não encontrado ou não pertence a esta empresa/filial.",
      });
    }

    // Limpar CPF se fornecido
    let cpfLimpo = cpf_aluno;
    if (cpf_aluno) {
      const validacaoCPF = validarCPF(cpf_aluno);
      if (!validacaoCPF.valido) {
        return res.status(400).json({ error: validacaoCPF.erro });
      }
      cpfLimpo = validacaoCPF.cpfLimpo;
    }

    // Atualizar aluno
    const { error } = await supabase
      .from("alunos")
      .update({
        nome_aluno,
        email_aluno,
        telefone_aluno,
        cpf_aluno: cpfLimpo,
        plano_aluno,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id_aluno", id_aluno)
      .eq("id_empresa", id_empresa)
      .eq("id_filial", id_filial);

    if (error) {
      console.error("Erro ao editar aluno:", error);
      return res.status(500).json({ message: "Erro ao editar aluno." });
    }

    // Preparar auditoria das alterações
    const alteracoes = [];

    if (nome_aluno && alunoAtual.nome_aluno !== nome_aluno) {
      alteracoes.push(`Nome: '${alunoAtual.nome_aluno}' → '${nome_aluno}'`);
    }

    if (email_aluno && alunoAtual.email_aluno !== email_aluno) {
      alteracoes.push(`Email: '${alunoAtual.email_aluno}' → '${email_aluno}'`);
    }

    if (telefone_aluno && alunoAtual.telefone_aluno !== telefone_aluno) {
      alteracoes.push(
        `Telefone: '${alunoAtual.telefone_aluno}' → '${telefone_aluno}'`
      );
    }

    if (cpfLimpo && alunoAtual.cpf_aluno !== cpfLimpo) {
      const cpfAnterior = formatarCPFParaAuditoria(alunoAtual.cpf_aluno);
      const cpfNovo = formatarCPFParaAuditoria(cpfLimpo);
      alteracoes.push(`CPF: '${cpfAnterior}' → '${cpfNovo}'`);
    }

    if (plano_aluno && alunoAtual.plano_aluno !== plano_aluno) {
      alteracoes.push(`Plano: '${alunoAtual.plano_aluno}' → '${plano_aluno}'`);
    }

    // Registrar auditoria da edição
    if (alteracoes.length > 0) {
      const cpfFormatado = formatarCPFParaAuditoria(alunoAtual.cpf_aluno);
      const descricaoAuditoria = `Editou o aluno: ${
        alunoAtual.nome_aluno
      } (CPF: ${cpfFormatado}, Matrícula: ${
        alunoAtual.matricula_aluno
      }). Alterações: ${alteracoes.join(", ")}`;

      await registrarAuditoria(
        id_empresa,
        id_usuario,
        id_filial,
        "EDICAO_ALUNO",
        descricaoAuditoria
      );
    }

    res.json({ message: "Aluno atualizado com sucesso!" });
  } catch (error) {
    console.error("Erro ao editar aluno:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

const importarAlunos = async (req, res) => {
  try {
    const { alunos } = req.body;

    console.log("req.user completo:", req.user);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Token de autenticação inválido",
      });
    }

    const { id_empresa, id_filial, id_usuario } = req.user;

    console.log("Dados extraídos do JWT:", {
      id_empresa,
      id_filial,
      id_usuario,
    });

    if (!id_empresa || !id_filial) {
      return res.status(400).json({
        success: false,
        error: "Dados da empresa/filial não encontrados no token",
      });
    }

    if (!alunos || !Array.isArray(alunos)) {
      return res.status(400).json({
        success: false,
        error: "Lista de alunos é obrigatória e deve ser um array",
      });
    }

    if (alunos.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Lista de alunos não pode estar vazia",
      });
    }

    // Buscar nome da filial para auditoria
    const { data: dadosFilial, error: errorFilial } = await supabase
      .from("filiais")
      .select("nome_filial")
      .eq("id_filial", id_filial)
      .eq("id_empresa", id_empresa)
      .single();

    const nomeFilial = dadosFilial?.nome_filial || `Filial ${id_filial}`;

    let sucesso = 0;
    let erros = 0;
    const errosDetalhados = [];
    const alunosImportados = [];

    // Função para normalizar forma de pagamento
    const normalizarFormaPagamento = (forma) => {
      const mapeamento = {
        // PIX
        pix: "pix",

        // Boleto
        boleto: "boleto",

        // Cartão de Crédito - TODAS as variações para "credito"
        cartão: "credito",
        cartao: "credito",
        "cartão de credito": "credito",
        "cartão de crédito": "credito",
        "cartao de credito": "credito",
        "cartao de crédito": "credito",
        credito: "credito",
        crédito: "credito",
        credit: "credito",
        card: "credito",

        // Cartão de Débito - TODAS as variações para "debito"
        "cartão de debito": "debito",
        "cartão de débito": "debito",
        "cartao de debito": "debito",
        "cartao de débito": "debito",
        debito: "debito",
        débito: "debito",
        debit: "debito",
      };

      const formaLimpa = forma.toLowerCase().trim();
      const resultado = mapeamento[formaLimpa];

      console.log(
        `Normalizando: "${forma}" → "${formaLimpa}" → "${resultado || forma}"`
      );

      return resultado || forma;
    };

    // Processar cada aluno
    for (const alunoData of alunos) {
      try {
        const {
          nome_aluno,
          email_aluno,
          telefone_aluno,
          cpf_aluno,
          plano_aluno,
          forma_pagamento,
          linha,
        } = alunoData;

        console.log(`Processando linha ${linha}:`, alunoData);

        // Validações
        if (!nome_aluno || nome_aluno.trim().length < 2) {
          errosDetalhados.push(
            `Linha ${linha}: Nome é obrigatório e deve ter pelo menos 2 caracteres`
          );
          erros++;
          continue;
        }

        if (!email_aluno) {
          errosDetalhados.push(`Linha ${linha}: Email é obrigatório`);
          erros++;
          continue;
        }

        const validacaoEmail = validarEmail(email_aluno);
        if (!validacaoEmail.valido) {
          errosDetalhados.push(`Linha ${linha}: ${validacaoEmail.erro}`);
          erros++;
          continue;
        }

        if (!cpf_aluno) {
          errosDetalhados.push(`Linha ${linha}: CPF é obrigatório`);
          erros++;
          continue;
        }

        const validacaoCPF = validarCPF(cpf_aluno);
        if (!validacaoCPF.valido) {
          errosDetalhados.push(`Linha ${linha}: ${validacaoCPF.erro}`);
          erros++;
          continue;
        }

        const cpfLimpo = validacaoCPF.cpfLimpo;

        if (!plano_aluno || plano_aluno.trim().length === 0) {
          errosDetalhados.push(`Linha ${linha}: Plano é obrigatório`);
          erros++;
          continue;
        }

        if (!forma_pagamento || forma_pagamento.trim().length === 0) {
          errosDetalhados.push(
            `Linha ${linha}: Forma de pagamento é obrigatória`
          );
          erros++;
          continue;
        }

        // Valores válidos conforme constraint do banco
        const formasPagamentoValidas = [
          "pix",
          "boleto",
          "credito", // ← Manter assim
          "debito", // ← Manter assim
        ];

        const formaPagamentoLimpa = normalizarFormaPagamento(
          forma_pagamento.trim()
        );

        if (!formasPagamentoValidas.includes(formaPagamentoLimpa)) {
          errosDetalhados.push(
            `Linha ${linha}: Forma de pagamento '${forma_pagamento}' é inválida. Use: ${formasPagamentoValidas.join(
              ", "
            )}`
          );
          erros++;
          continue;
        }

        console.log(
          `Linha ${linha}: "${forma_pagamento}" → "${formaPagamentoLimpa}"`
        );

        const planosValidos = ["mensal", "trimestral", "semestral", "anual"];
        const planoLimpo = plano_aluno.toLowerCase().trim();

        if (!planosValidos.includes(planoLimpo)) {
          errosDetalhados.push(
            `Linha ${linha}: Plano '${plano_aluno}' é inválido. Use: ${planosValidos.join(
              ", "
            )}`
          );
          erros++;
          continue;
        }

        // Verificar CPF duplicado
        try {
          const { data: alunoExistente, error: erroConsultaCPF } =
            await supabase
              .from("alunos")
              .select("id_aluno, nome_aluno")
              .eq("cpf_aluno", cpfLimpo)
              .eq("id_empresa", id_empresa)
              .limit(1);

          if (erroConsultaCPF) {
            console.error(
              `Erro ao consultar CPF linha ${linha}:`,
              erroConsultaCPF
            );
            errosDetalhados.push(
              `Linha ${linha}: Erro interno ao verificar CPF - ${erroConsultaCPF.message}`
            );
            erros++;
            continue;
          }

          if (alunoExistente && alunoExistente.length > 0) {
            errosDetalhados.push(
              `Linha ${linha}: CPF ${cpf_aluno} já cadastrado para o aluno "${alunoExistente[0].nome_aluno}"`
            );
            erros++;
            continue;
          }
        } catch (errorCPF) {
          console.error(`Erro na consulta de CPF linha ${linha}:`, errorCPF);
          errosDetalhados.push(
            `Linha ${linha}: Erro interno ao verificar CPF duplicado - ${errorCPF.message}`
          );
          erros++;
          continue;
        }

        // Verificar email duplicado
        try {
          const { data: emailExistente, error: erroConsultaEmail } =
            await supabase
              .from("alunos")
              .select("id_aluno, nome_aluno")
              .eq("email_aluno", email_aluno.toLowerCase().trim())
              .eq("id_empresa", id_empresa)
              .limit(1);

          if (erroConsultaEmail) {
            console.error(
              `Erro ao consultar email linha ${linha}:`,
              erroConsultaEmail
            );
            errosDetalhados.push(
              `Linha ${linha}: Erro interno ao verificar email - ${erroConsultaEmail.message}`
            );
            erros++;
            continue;
          }

          if (emailExistente && emailExistente.length > 0) {
            errosDetalhados.push(
              `Linha ${linha}: Email ${email_aluno} já cadastrado para o aluno "${emailExistente[0].nome_aluno}"`
            );
            erros++;
            continue;
          }
        } catch (errorEmail) {
          console.error(
            `Erro na consulta de email linha ${linha}:`,
            errorEmail
          );
          errosDetalhados.push(
            `Linha ${linha}: Erro interno ao verificar email duplicado - ${errorEmail.message}`
          );
          erros++;
          continue;
        }

        // Status e situação
        let status_aluno = true;
        let situacao = "regular";

        if (formaPagamentoLimpa === "boleto") {
          status_aluno = false;
          situacao = "aguardando pagamento";
        }

        const matricula = await gerarMatriculaUnica(id_empresa, id_filial);

        console.log(`Tentando inserir aluno linha ${linha}:`, {
          nome_aluno: nome_aluno.trim(),
          email_aluno: email_aluno.toLowerCase().trim(),
          cpf_aluno: cpfLimpo,
          id_empresa,
          id_filial,
        });

        const { data: novoAluno, error: erroInsercao } = await supabase
          .from("alunos")
          .insert({
            nome_aluno: nome_aluno.trim(),
            email_aluno: email_aluno.toLowerCase().trim(),
            telefone_aluno: telefone_aluno ? telefone_aluno.trim() : null,
            cpf_aluno: cpfLimpo,
            plano_aluno: planoLimpo,
            forma_pagamento: formaPagamentoLimpa,
            status_aluno,
            situacao,
            matricula_aluno: matricula,
            data_cadastro: new Date().toISOString(),
            id_empresa,
            id_filial,
          })
          .select()
          .single();

        if (erroInsercao) {
          console.error(`Erro ao inserir aluno linha ${linha}:`, erroInsercao);
          errosDetalhados.push(
            `Linha ${linha}: Erro ao cadastrar - ${
              erroInsercao.message ||
              erroInsercao.details ||
              erroInsercao.hint ||
              "Erro desconhecido"
            }`
          );
          erros++;
          continue;
        }

        console.log(`Aluno inserido com sucesso linha ${linha}:`, novoAluno);

        alunosImportados.push({
          id_aluno: novoAluno.id_aluno,
          nome_aluno: novoAluno.nome_aluno,
          email_aluno: novoAluno.email_aluno,
          matricula_aluno: novoAluno.matricula_aluno,
          cpf_aluno: formatarCPFParaAuditoria(novoAluno.cpf_aluno),
          linha,
        });

        sucesso++;
      } catch (error) {
        console.error(
          `Erro ao processar aluno linha ${alunoData.linha || "N/A"}:`,
          error
        );
        errosDetalhados.push(
          `Linha ${alunoData.linha || "N/A"}: Erro interno - ${
            error.message || "Erro desconhecido"
          }`
        );
        erros++;
      }
    }

    // Registrar auditoria da importação
    if (sucesso > 0) {
      const descricaoAuditoria = `Importou ${sucesso} aluno(s) na filial: ${nomeFilial}. Total processado: ${
        alunos.length
      } registros${erros > 0 ? `, ${erros} erro(s)` : ""}`;

      await registrarAuditoria(
        id_empresa,
        id_usuario,
        id_filial,
        "Edição perfil",
        descricaoAuditoria
      );
    }

    // Resposta final
    const response = {
      success: sucesso > 0,
      message:
        sucesso > 0
          ? `Importação concluída: ${sucesso} aluno(s) importado(s) na filial ${nomeFilial}${
              erros > 0 ? `, ${erros} erro(s)` : ""
            }`
          : "Nenhum aluno foi importado com sucesso",
      data: {
        total_processados: alunos.length,
        sucesso,
        erros,
        filial: nomeFilial,
        detalhes: errosDetalhados.length > 0 ? errosDetalhados : undefined,
        alunos_importados: alunosImportados,
      },
    };

    console.log("Resposta final da importação:", response);

    return res.status(200).json(response);
  } catch (error) {
    console.error("Erro geral na importação:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor durante a importação",
      detalhe: error.message,
    });
  }
};

// Função para alternar status do aluno (ativar/inativar)
const alterarStatusAluno = async (req, res) => {
  try {
    const { id_aluno, status_aluno } = req.body;
    const { id_empresa, id_filial, id_usuario } = req.user;

    if (!id_aluno || typeof status_aluno !== "boolean") {
      return res.status(400).json({
        message: "ID do aluno e status são obrigatórios.",
      });
    }

    // Buscar dados atuais do aluno para auditoria
    const { data: alunoAtual, error: errorBusca } = await supabase
      .from("alunos")
      .select("nome_aluno, cpf_aluno, matricula_aluno")
      .eq("id_aluno", id_aluno)
      .eq("id_empresa", id_empresa)
      .eq("id_filial", id_filial)
      .single();

    if (errorBusca || !alunoAtual) {
      return res.status(404).json({
        message: "Aluno não encontrado.",
      });
    }

    // Atualizar status do aluno
    const { data, error } = await supabase
      .from("alunos")
      .update({
        status_aluno,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id_aluno", id_aluno)
      .eq("id_empresa", id_empresa)
      .eq("id_filial", id_filial)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        message: "Erro ao alterar status do aluno.",
        error,
      });
    }

    if (!data) {
      return res.status(404).json({
        message: "Aluno não encontrado.",
      });
    }

    // Registrar auditoria da alteração de status
    const acao = status_aluno ? "ATIVACAO_ALUNO" : "INATIVACAO_ALUNO";
    const statusTexto = status_aluno ? "Ativou" : "Inativou";
    const cpfFormatado = formatarCPFParaAuditoria(alunoAtual.cpf_aluno);
    const descricaoAuditoria = `${statusTexto} o aluno: ${alunoAtual.nome_aluno} (CPF: ${cpfFormatado}, Matrícula: ${alunoAtual.matricula_aluno})`;

    await registrarAuditoria(
      id_empresa,
      id_usuario,
      id_filial,
      acao,
      descricaoAuditoria
    );

    return res.status(200).json({
      message: `Status do aluno ${
        status_aluno ? "ativado" : "inativado"
      } com sucesso!`,
      aluno: {
        id: data.id_aluno,
        nome: data.nome_aluno,
        status: data.status_aluno,
        matricula: data.matricula_aluno,
      },
    });
  } catch (error) {
    console.error("Erro ao alterar status do aluno:", error);
    return res.status(500).json({
      message: "Erro interno do servidor.",
      error: error.message,
    });
  }
};

// Nova rota: inicia o processo e retorna o link
const iniciarCadastroAluno = async (req, res) => {
  try {
    const { nome_aluno, email_aluno, telefone_aluno, cpf_aluno, plano_aluno } =
      req.body;

    // Validações básicas...j
    // (igual ao seu código atual)

    const dadosAluno = {
      nome_aluno: nome_aluno.trim(),
      email_aluno: email_aluno.toLowerCase().trim(),
      telefone_aluno: telefone_aluno.trim(),
      cpf_aluno: cpf_aluno.replace(/\D/g, ""),
      plano_aluno: plano_aluno.toLowerCase(),
    };

    // Gera o link de pagamento
    const link = await criarLinkPagamento(dadosAluno);

    if (!link || !link.url) {
      return res
        .status(500)
        .json({ error: "Erro ao gerar link de pagamento." });
    }

    // Retorna o link para o front
    return res.status(200).json({
      success: true,
      paymentLinkId: link.id,
      paymentLinkUrl: link.url,
      valor: link.value,
      descricao: link.description,
    });
  } catch (error) {
    console.error("Erro ao gerar link de pagamento:", error);
    return res
      .status(500)
      .json({ error: "Erro interno ao gerar link de pagamento." });
  }
};

// Nova rota: confirma o pagamento e cadastra o aluno
const confirmarPagamentoLink = async (req, res) => {
  try {
    const { paymentLinkId, dadosAluno } = req.body;

    // Consulta status do link
    const linkStatus = await asaasRequest(
      `/paymentLinks/${paymentLinkId}`,
      "GET"
    );

    // Forçar status para teste
    linkStatus.status = "RECEIVED";

    // Verifica se foi pago
    if (linkStatus.status === "RECEIVED") {
      // Cadastrar aluno normalmente
      const matricula_aluno = await gerarMatriculaUnica(
        dadosAluno.id_empresa,
        dadosAluno.id_filial
      );

      const { data: novoAluno, error: erroAluno } = await supabase
        .from("alunos")
        .insert({
          ...dadosAluno,
          matricula_aluno,
          forma_pagamento:
            linkStatus.payments[0]?.billingType?.toLowerCase() || "indefinido",
          situacao: "regular",
          status_aluno: true,
          id_empresa: dadosAluno.id_empresa,
          id_filial: dadosAluno.id_filial,
          data_cadastro: new Date().toISOString(),
        })
        .select()
        .single();

      if (erroAluno) {
        return res
          .status(500)
          .json({ error: "Erro ao cadastrar aluno após pagamento." });
      }

      return res.status(201).json({
        success: true,
        message: "Pagamento confirmado e aluno cadastrado!",
        aluno: novoAluno,
        forma_pagamento: linkStatus.payments[0]?.billingType,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Pagamento ainda não realizado.",
        status: linkStatus.status,
      });
    }
  } catch (error) {
    console.error("Erro ao confirmar pagamento do link:", error);
    return res.status(500).json({ error: "Erro ao confirmar pagamento." });
  }
};

module.exports = {
  cadastrarAluno,
  confirmarPagamentoPIX, // Nova função
  consultarAlunos,
  // confirmarPagamentoBoleto,
  calcularValorPlano,
  gerarMatriculaUnica,
  obterEstatisticasAlunos,
  editarAlunos,
  importarAlunos,
  alterarStatusAluno,
  iniciarCadastroAluno,
  confirmarPagamentoLink,
};
