const supabase = require("../db");
const auditoriaService = require("../utils/auditoriaService");
const { validarCPF, validarEmail, limparCPF } = require("../utils/validadores");

/**
 * Registrar ação de auditoria
 */
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

const formatarCPFParaAuditoria = (cpf) => {
  if (!cpf) return "";
  const cpfLimpo = cpf.replace(/[^\d]/g, "");
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

/**
 * Gera matrícula única
 */
const gerarMatriculaUnica = async (id_empresa, id_filial) => {
  let tentativas = 0;
  const maxTentativas = 100;

  while (tentativas < maxTentativas) {
    const matricula = Math.floor(Math.random() * 90000) + 10000;
    const matriculaString = matricula.toString();

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

  return Date.now().toString().slice(-5);
};

/**
 * Cadastrar aluno individual
 */
const cadastrarAlunos = async (req, res) => {
  try {
    const {
      nome_aluno,
      email_aluno,
      telefone_aluno,
      cpf_aluno,
      plano_aluno,
      forma_pagamento,
    } = req.body;

    const { id_empresa, id_filial, id_usuario } = req.user;

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

    const cpfLimpo = limparCPF(cpf_aluno);
    const validacaoCPF = validarCPF(cpf_aluno);
    if (!validacaoCPF.valido) {
      return res.status(400).json({
        error: validacaoCPF.erro,
        tipo: "validacao_erro",
      });
    }

    const validacaoEmail = validarEmail(email_aluno);
    if (!validacaoEmail.valido) {
      return res.status(400).json({
        error: validacaoEmail.erro,
        tipo: "validacao_erro",
      });
    }

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

    const dadosAluno = {
      nome_aluno: nome_aluno.trim(),
      email_aluno: email_aluno.toLowerCase().trim(),
      telefone_aluno: telefone_aluno.trim(),
      cpf_aluno: cpfLimpo,
      plano_aluno:
        typeof plano_aluno === "string"
          ? plano_aluno.toLowerCase()
          : plano_aluno?.value?.toLowerCase?.() || "",
    };

    const matricula_aluno = await gerarMatriculaUnica(id_empresa, id_filial);

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
        data_cadastro_aluno: new Date().toISOString(),
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

    const cpfFormatado = formatarCPFParaAuditoria(cpfLimpo);
    const descricaoAuditoria = `Cadastrou o aluno: ${nome_aluno} (CPF: ${cpfFormatado}, Matrícula: ${matricula_aluno}). Plano: ${plano_aluno}, Situação: regular`;

    await registrarAuditoria(
      id_empresa,
      id_usuario,
      id_filial,
      "CADASTRO_ALUNO",
      descricaoAuditoria
    );

    res.status(201).json({
      message: "Aluno cadastrado com sucesso!",
      aluno: novoAluno,
    });
  } catch (error) {
    console.error("❌ Erro geral no cadastro de aluno:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
      tipo: "server_erro",
    });
  }
};

/**
 * Consultar alunos
 */
const consultarAlunos = async (req, res) => {
  try {
    const { id_empresa } = req.user;

    const { data: alunos, error } = await supabase
      .from("alunos")
      .select("*")
      .eq("id_empresa", id_empresa)
      .order("data_cadastro_aluno", { ascending: false });

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

/**
 * Obter estatísticas de alunos
 */
const obterEstatisticasAlunos = async (req, res) => {
  try {
    const { id_filial } = req.params;
    const { id_empresa } = req.user;

    const { data: alunos, error } = await supabase
      .from("alunos")
      .select("status_aluno, situacao")
      .eq("id_empresa", id_empresa)
      .eq("id_filial", id_filial);

    if (error) {
      console.error("Erro ao buscar alunos:", error);
      return res.status(500).json({ error: "Erro ao buscar estatísticas" });
    }

    const estatisticas = {
      cadastrados: alunos.length,
      ativos: alunos.filter((a) => a.status_aluno === true).length,
      inativos: alunos.filter((a) => a.status_aluno === false).length,
      inadimplentes: alunos.filter(
        (a) => a.situacao === "aguardando pagamento"
      ).length,
    };

    res.json(estatisticas);
  } catch (error) {
    console.error("Erro ao obter estatísticas:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

/**
 * Importar alunos em massa
 */
const importarAlunos = async (req, res) => {
  try {
    const { alunos } = req.body;
    const { id_empresa, id_filial, id_usuario } = req.user;

    if (!alunos || !Array.isArray(alunos) || alunos.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Lista de alunos é obrigatória e não pode estar vazia",
      });
    }

    const { data: dadosFilial } = await supabase
      .from("filiais")
      .select("nome_filial")
      .eq("id_filial", id_filial)
      .eq("id_empresa", id_empresa)
      .single();

    const nomeFilial = dadosFilial?.nome_filial || `Filial ${id_filial}`;
    const planosValidos = ["mensal", "trimestral", "semestral", "anual"];

    let sucesso = 0;
    let erros = 0;
    const errosDetalhados = [];
    const alunosImportados = [];

    const normalizarFormaPagamento = (forma) => {
      const mapeamento = {
        pix: "pix",
        boleto: "boleto",
        cartao: "credito",
        cartão: "credito",
        "cartão de crédito": "credito",
        credito: "credito",
        crédito: "credito",
        debito: "debito",
        débito: "debito",
      };
      const formaLimpa = forma.toLowerCase().trim();
      return mapeamento[formaLimpa] || formaLimpa;
    };

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

        if (!nome_aluno || nome_aluno.trim().length < 2) {
          errosDetalhados.push(`Linha ${linha}: Nome inválido`);
          erros++;
          continue;
        }

        const validacaoEmail = validarEmail(email_aluno);
        if (!validacaoEmail.valido) {
          errosDetalhados.push(`Linha ${linha}: ${validacaoEmail.erro}`);
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
        const planoLimpo = plano_aluno.toLowerCase().trim();

        if (!planosValidos.includes(planoLimpo)) {
          errosDetalhados.push(`Linha ${linha}: Plano inválido`);
          erros++;
          continue;
        }

        const formaPagamentoLimpa = normalizarFormaPagamento(forma_pagamento);
        const formasPagamentoValidas = ["pix", "boleto", "credito", "debito"];

        if (!formasPagamentoValidas.includes(formaPagamentoLimpa)) {
          errosDetalhados.push(`Linha ${linha}: Forma de pagamento inválida`);
          erros++;
          continue;
        }

        const { data: alunoExistente } = await supabase
          .from("alunos")
          .select("id_aluno")
          .eq("cpf_aluno", cpfLimpo)
          .eq("id_empresa", id_empresa)
          .limit(1);

        if (alunoExistente && alunoExistente.length > 0) {
          errosDetalhados.push(
            `Linha ${linha}: CPF já cadastrado (${cpf_aluno})`
          );
          erros++;
          continue;
        }

        const matricula = await gerarMatriculaUnica(id_empresa, id_filial);
        const status_aluno = formaPagamentoLimpa === "boleto" ? false : true;
        const situacao =
          formaPagamentoLimpa === "boleto"
            ? "aguardando pagamento"
            : "regular";

        const { data: novoAluno, error: erroInsercao } = await supabase
          .from("alunos")
          .insert({
            nome_aluno: nome_aluno.trim(),
            email_aluno: email_aluno.toLowerCase().trim(),
            telefone_aluno: telefone_aluno?.trim() || null,
            cpf_aluno: cpfLimpo,
            plano_aluno: planoLimpo,
            forma_pagamento: formaPagamentoLimpa,
            status_aluno,
            situacao,
            matricula_aluno: matricula,
            data_cadastro_aluno: new Date().toISOString(),
            id_empresa,
            id_filial,
          })
          .select()
          .single();

        if (erroInsercao) {
          errosDetalhados.push(
            `Linha ${linha}: Erro ao cadastrar - ${erroInsercao.message}`
          );
          erros++;
          continue;
        }

        alunosImportados.push({
          id_aluno: novoAluno.id_aluno,
          nome_aluno: novoAluno.nome_aluno,
          cpf_aluno: formatarCPFParaAuditoria(novoAluno.cpf_aluno),
          matricula_aluno: novoAluno.matricula_aluno,
        });

        sucesso++;
      } catch (err) {
        errosDetalhados.push(
          `Linha ${alunoData.linha || "N/A"}: Erro interno - ${err.message}`
        );
        erros++;
      }
    }

    if (sucesso > 0) {
      const descricaoAuditoria = `Importou ${sucesso} aluno(s) na filial ${nomeFilial}. Total processado: ${alunos.length}, ${erros} erro(s).`;
      await registrarAuditoria(
        id_empresa,
        id_usuario,
        id_filial,
        "IMPORTACAO_ALUNOS",
        descricaoAuditoria
      );
    }

    return res.status(200).json({
      success: sucesso > 0,
      message: `Importação concluída: ${sucesso} sucesso(s), ${erros} erro(s)`,
      data: {
        total_processados: alunos.length,
        sucesso,
        erros,
        detalhes: errosDetalhados,
        alunos_importados: alunosImportados,
      },
    });
  } catch (error) {
    console.error("Erro geral na importação:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor durante a importação",
      detalhe: error.message,
    });
  }
};

/**
 * Alterar status (ativo/inativo)
 */
const alterarStatusAluno = async (req, res) => {
  try {
    const { id_aluno, status_aluno } = req.body;
    const { id_empresa, id_filial, id_usuario } = req.user;

    if (!id_aluno || typeof status_aluno !== "boolean") {
      return res
        .status(400)
        .json({ message: "ID do aluno e status são obrigatórios." });
    }

    const { data: alunoAtual } = await supabase
      .from("alunos")
      .select("nome_aluno, cpf_aluno, matricula_aluno")
      .eq("id_aluno", id_aluno)
      .eq("id_empresa", id_empresa)
      .eq("id_filial", id_filial)
      .single();

    if (!alunoAtual) {
      return res.status(404).json({ message: "Aluno não encontrado." });
    }

    const { data, error } = await supabase
      .from("alunos")
      .update({
        status_aluno,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id_aluno", id_aluno)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: "Erro ao alterar status.", error });
    }

    const acao = status_aluno ? "ATIVACAO_ALUNO" : "INATIVACAO_ALUNO";
    const statusTexto = status_aluno ? "Ativou" : "Inativou";
    const cpfFormatado = formatarCPFParaAuditoria(alunoAtual.cpf_aluno);

    await registrarAuditoria(
      id_empresa,
      id_usuario,
      id_filial,
      acao,
      `${statusTexto} o aluno: ${alunoAtual.nome_aluno} (CPF: ${cpfFormatado}, Matrícula: ${alunoAtual.matricula_aluno})`
    );

    res.status(200).json({
      message: `Status do aluno ${
        status_aluno ? "ativado" : "inativado"
      } com sucesso!`,
      aluno: data,
    });
  } catch (error) {
    console.error("Erro ao alterar status:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

module.exports = {
  cadastrarAlunos,
  consultarAlunos,
  gerarMatriculaUnica,
  obterEstatisticasAlunos,
  editarAlunos,
  importarAlunos,
  alterarStatusAluno,
};
