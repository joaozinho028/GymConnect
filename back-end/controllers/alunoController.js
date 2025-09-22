const supabase = require("../db");

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
      status_aluno: "aprovado",
      transacao_id: `efi_${Date.now()}`,
      valor: dadosPagamento.valor,
    };
  } else {
    return {
      status_aluno: "rejeitado",
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
    .update({ status_aluno: "aprovado" })
    .eq("id_aluno", dadosWebhook.id_aluno)
    .eq("metodo_pagamento", "boleto");

  return data;
};

const consultarAlunos = async (req, res) => {
  try {
    const { id_empresa, id_filial } = req.user;

    const { data: alunos, error } = await supabase
      .from("alunos")
      .select("*")
      .eq("id_empresa", id_empresa)
      .eq("id_filial", id_filial)
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

module.exports = {
  cadastrarAluno,
  consultarAlunos,
  confirmarPagamentoBoleto,
  calcularValorPlano,
  gerarMatriculaUnica,
  obterEstatisticasAlunos,
};
