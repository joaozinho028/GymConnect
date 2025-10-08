const supabase = require("../db");
const auditoriaService = require("../utils/auditoriaService");
const { validarCPF, validarEmail, limparCPF } = require("../utils/validadores");

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
    } = req.body;

    const { id_empresa, id_filial } = req.user;

    // Validação dos campos obrigatórios
    if (
      !nome_aluno ||
      !email_aluno ||
      !telefone_aluno ||
      !cpf_aluno ||
      !plano_aluno ||
      !forma_pagamento
    ) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios" });
    }

    // Verificar se CPF já existe na mesma filial
    const { data: alunoExistente } = await supabase
      .from("alunos")
      .select("cpf_aluno")
      .eq("cpf_aluno", cpf_aluno)
      .eq("id_empresa", id_empresa)
      .eq("id_filial", id_filial)
      .single();

    if (alunoExistente) {
      return res.status(400).json({ error: "CPF já cadastrado nesta filial" });
    }

    // Lógica baseada na forma de pagamento
    let dadosResposta = {};

    if (forma_pagamento === "boleto") {
      // BOLETO: Cadastrar aluno imediatamente com status "aguardando_pagamento"

      // Simular geração de boleto via Efí Bank
      const linkBoleto = await gerarBoleto({
        nome: nome_aluno,
        cpf: cpf_aluno,
        email: email_aluno,
        plano: plano_aluno,
      });

      // Gerar matrícula única
      const matricula_aluno = await gerarMatriculaUnica(id_empresa, id_filial);

      // Salvar aluno no banco com status aguardando
      const { data: novoAluno, error: erroAluno } = await supabase
        .from("alunos")
        .insert([
          {
            nome_aluno,
            email_aluno,
            telefone_aluno,
            cpf_aluno,
            plano_aluno,
            matricula_aluno,
            forma_pagamento,
            situacao: "aguardando pagamento",
            status_aluno: true,
            id_empresa,
            id_filial,
            data_cadastro: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (erroAluno) {
        console.error("Erro ao inserir aluno:", erroAluno);
        return res.status(500).json({ error: "Erro ao cadastrar aluno" });
      }

      // Registrar transação na tabela transacoes
      const valorPlano = calcularValorPlano(plano_aluno);

      const { data: transacao, error: erroTransacao } = await supabase
        .from("transacoes")
        .insert([
          {
            id_empresa,
            id_filial,
            id_aluno: novoAluno.id_aluno,
            id_usuario: req.user.id_usuario,
            valor: valorPlano,
            metodo_pagamento: "boleto",
            status: true,
          },
        ])
        .select()
        .single();

      if (erroTransacao) {
        console.error("Erro ao registrar transação:", erroTransacao);
      }

      dadosResposta = {
        message:
          "Aluno cadastrado com sucesso! Aguardando pagamento do boleto.",
        aluno: novoAluno,
        linkBoleto: linkBoleto,
        tipo: "boleto",
      };
    } else {
      // PIX/DÉBITO/CRÉDITO: NÃO cadastrar aluno ainda, apenas processar pagamento

      const valorPlano = calcularValorPlano(plano_aluno);

      // Simular processamento de pagamento via Efí Bank
      const resultadoPagamento = await processarPagamentoEfiBank({
        nome: nome_aluno,
        telefone: telefone_aluno,
        email: email_aluno,
        cpf: cpf_aluno,
        valor: valorPlano,
        forma_pagamento,
      });

      if (resultadoPagamento.status === "aprovado") {
        // PAGAMENTO APROVADO: Agora sim cadastrar o aluno

        // Gerar matrícula única
        const matricula_aluno = await gerarMatriculaUnica(
          id_empresa,
          id_filial
        );

        const { data: novoAluno, error: erroAluno } = await supabase
          .from("alunos")
          .insert([
            {
              nome_aluno,
              email_aluno,
              telefone_aluno,
              cpf_aluno,
              plano_aluno,
              matricula_aluno,
              forma_pagamento,
              situacao: "regular",
              status_aluno: true,
              id_empresa,
              id_filial,
              data_cadastro: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (erroAluno) {
          console.error("Erro ao inserir aluno:", erroAluno);
          return res
            .status(500)
            .json({ error: "Erro ao cadastrar aluno após pagamento" });
        }

        // Registrar transação aprovada
        const { data: transacao } = await supabase
          .from("transacoes")
          .insert([
            {
              id_empresa,
              id_filial,
              id_aluno: novoAluno.id_aluno,
              id_usuario: req.user.id_usuario,
              valor: valorPlano,
              metodo_pagamento: forma_pagamento,
              status: true,
            },
          ])
          .select()
          .single();

        dadosResposta = {
          message: "Pagamento aprovado! Aluno cadastrado com sucesso.",
          aluno: novoAluno,
          transacao: transacao,
          tipo: "pagamento_aprovado",
        };
      } else {
        // PAGAMENTO RECUSADO/PENDENTE: Não cadastrar aluno
        dadosResposta = {
          message: "Pagamento não pôde ser processado. Tente novamente.",
          erro: resultadoPagamento.erro,
          tipo: "pagamento_rejeitado",
        };

        return res.status(400).json(dadosResposta);
      }
    }

    res.status(201).json(dadosResposta);
  } catch (error) {
    console.error("Erro no cadastro de aluno:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Funções auxiliares para integração com Efí Bank

const gerarBoleto = async (dadosAluno) => {
  // Aqui você integraria com a API da Efí Bank para gerar boleto
  console.log("Gerando boleto via Efí Bank para:", dadosAluno);

  // Simular delay da API
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Simular resposta da Efí Bank
  return `https://efi.bank/boleto/${Date.now()}`;
};

const processarPagamentoEfiBank = async (dadosPagamento) => {
  // Aqui você integraria com a API da Efí Bank para processar pagamento
  console.log("Processando pagamento via Efí Bank:", dadosPagamento);

  // Simular delay da API de pagamento
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Simular resposta da Efí Bank (80% aprovado, 20% rejeitado para teste)
  const aprovado = Math.random() > 0.2;

  if (aprovado) {
    return {
      status: "aprovado",
      transacao_id: `efi_${Date.now()}`,
      valor: dadosPagamento.valor,
    };
  } else {
    return {
      status: "rejeitado",
      erro: "Cartão recusado ou saldo insuficiente",
    };
  }
};

const calcularValorPlano = (plano) => {
  // Calcular valor baseado no plano escolhido
  const valores = {
    mensal: 89.9,
    trimestral: 249.9,
    anual: 899.9,
  };

  return valores[plano] || 89.9;
};

// Função que será chamada pelo webhook da Efí Bank (futuro)
const confirmarPagamentoBoleto = async (dadosWebhook) => {
  // Esta função será chamada quando a Efí Bank confirmar o pagamento do boleto
  console.log("Webhook recebido da Efí Bank:", dadosWebhook);

  // Atualizar status do aluno para "ativo"
  const { data, error } = await supabase
    .from("alunos")
    .update({ status_aluno: "ativo" })
    .eq("id_aluno", dadosWebhook.id_aluno)
    .select();

  // Atualizar status da transação
  await supabase
    .from("transacoes")
    .update({ status: "aprovado" })
    .eq("id_aluno", dadosWebhook.id_aluno)
    .eq("metodo_pagamento", "boleto");

  return data;
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
    const { id_empresa, id_filial } = req.user;
    const {
      id_aluno,
      nome_aluno,
      email_aluno,
      telefone_aluno,
      cpf_aluno,
      plano_aluno,
      // Adicione outros campos que desejar permitir edição
    } = req.body;

    if (!id_aluno) {
      return res.status(400).json({ message: "ID do aluno é obrigatório." });
    }

    // Atualizar aluno apenas da empresa e filial do usuário autenticado
    const { error } = await supabase
      .from("alunos")
      .update({
        nome_aluno,
        email_aluno,
        telefone_aluno,
        cpf_aluno,
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
          "debito",  // ← Manter assim
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

        // Auditoria (opcional)
        try {
          if (auditoriaService && auditoriaService.registrarAcao) {
            await auditoriaService.registrarAcao(
              id_usuario,
              "CREATE",
              "alunos",
              novoAluno.id_aluno,
              {
                aluno_importado: true,
                linha_arquivo: linha,
                dados_originais: {
                  nome_aluno: alunoData.nome_aluno,
                  email_aluno: alunoData.email_aluno,
                  cpf_aluno: alunoData.cpf_aluno,
                },
              },
              id_empresa
            );
          }
        } catch (auditoriaError) {
          console.error("Erro ao registrar auditoria:", auditoriaError);
        }

        alunosImportados.push({
          id_aluno: novoAluno.id_aluno,
          nome_aluno: novoAluno.nome_aluno,
          email_aluno: novoAluno.email_aluno,
          matricula_aluno: novoAluno.matricula_aluno,
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

    // Resposta final
    const response = {
      success: sucesso > 0,
      message:
        sucesso > 0
          ? `Importação concluída: ${sucesso} aluno(s) importado(s)${
              erros > 0 ? `, ${erros} erro(s)` : ""
            }`
          : "Nenhum aluno foi importado com sucesso",
      data: {
        total_processados: alunos.length,
        sucesso,
        erros,
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

module.exports = {
  cadastrarAluno,
  consultarAlunos,
  confirmarPagamentoBoleto,
  calcularValorPlano,
  gerarMatriculaUnica,
  obterEstatisticasAlunos,
  editarAlunos,
  importarAlunos,
};
