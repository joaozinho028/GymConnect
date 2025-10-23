const supabase = require("../db");

// Configurações do Asaas
const ASAAS_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://sandbox.asaas.com/api/v3";

const ASAAS_API_KEY =
  process.env.NODE_ENV === "production"
    ? process.env.ASAAS_PRODUCTION
    : process.env.ASAAS_SANDBOX;

// Helper para fazer requisições ao Asaas
const asaasRequest = async (endpoint, method = "GET", data = null) => {
  const url = `${ASAAS_BASE_URL}${endpoint}`;
  const headers = {
    access_token: ASAAS_API_KEY,
    "Content-Type": "application/json",
    "User-Agent": "GymConnect/1.0",
  };
  const options = { method, headers };
  if (data && (method === "POST" || method === "PUT")) {
    options.body = JSON.stringify(data);
  }
  try {
    const response = await fetch(url, options);
    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(
        responseData.errors?.[0]?.description ||
          responseData.message ||
          "Erro na API Asaas"
      );
    }
    return responseData;
  } catch (error) {
    throw error;
  }
};

const criarLinkPagamento = async (dadosAluno, id_empresa, valor) => {
  const payload = {
    name: `${dadosAluno.nome_aluno}`,
    description: `Pagamento do plano ${dadosAluno.plano_aluno}`,
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    value: valor, // <-- aqui usa o valor buscado do banco
    chargeType: "INSTALLMENT",
    billingType: "UNDEFINED",
    notifyCustomer: false,
    email: dadosAluno.email_aluno,
    cpfCnpj: dadosAluno.cpf_aluno.replace(/\D/g, ""),
    dueDaysType: "BUSINESS_DAYS",
    dueDateLimitDays: 10,
    installmentCount: 1,
    maxInstallmentCount: 1,
  };
  const link = await asaasRequest("/paymentLinks", "POST", payload);
  return {
    id: link.id,
    nome: link.name,
    descricao: link.description,
    valor: link.value,
    url: link.url || link.paymentLinkUrl || link.data?.url || null,
    expiracao: link.endDate,
    status: link.status,
  };
};

const asaasWebhookHandler = async (req, res) => {
  try {
    console.log("=== [WEBHOOK RECEBIDO] ===");
    console.log("req.body:", JSON.stringify(req.body, null, 2));

    // Corrige o formato do evento recebido
    let event;
    if (typeof req.body === "object" && req.body.data) {
      event = JSON.parse(req.body.data);
    } else {
      event = req.body;
    }

    console.log("Evento recebido do Asaas:", event.event);

    if (event.event === "PAYMENT_RECEIVED") {
      // Troque aqui:
      const paymentLinkId = event.payment.paymentLink;
      const paymentId = event.payment.id;
      console.log(
        "Pagamento recebido! paymentLinkId:",
        paymentLinkId,
        "paymentId:",
        paymentId
      );

      // Buscar aluno temporário pelo paymentLinkId
      const { data: alunoTemp, error } = await supabase
        .from("alunos_temp")
        .select("*")
        .eq("asaas_payment_link_id", paymentLinkId)
        .single();

      console.log("Resultado busca aluno_temp:", { alunoTemp, error });

      if (!alunoTemp) {
        console.log(
          "Aluno temporário NÃO encontrado para paymentLinkId:",
          paymentLinkId
        );
        return res.status(200).send("Aluno temporário não encontrado.");
      }

      // Gerar matrícula única
      console.log(
        "Gerando matrícula única para:",
        alunoTemp.id_empresa,
        alunoTemp.id_filial
      );
      const matricula_aluno =
        await require("./alunoController").gerarMatriculaUnica(
          alunoTemp.id_empresa,
          alunoTemp.id_filial
        );
      console.log("Matrícula gerada:", matricula_aluno);

      // Cadastrar aluno definitivo
      const { data: novoAluno, error: erroAluno } = await supabase
        .from("alunos")
        .insert({
          nome_aluno: alunoTemp.nome_aluno,
          email_aluno: alunoTemp.email_aluno,
          telefone_aluno: alunoTemp.telefone_aluno,
          cpf_aluno: alunoTemp.cpf_aluno,
          plano_aluno: alunoTemp.plano_aluno,
          matricula_aluno,
          forma_pagamento:
            event.payment.billingType?.toLowerCase() || "indefinido",
          situacao: "regular",
          status_aluno: true,
          id_empresa: alunoTemp.id_empresa,
          id_filial: alunoTemp.id_filial,
          asaas_payment_id: event.payment.id,
          data_cadastro: new Date().toISOString(),
        })
        .select()
        .single();

      console.log("Resultado insert aluno:", { novoAluno, erroAluno });

      if (erroAluno) {
        console.error("Erro ao cadastrar aluno definitivo:", erroAluno);
        return res.status(500).send("Erro ao cadastrar aluno.");
      }

      // Remover da tabela temporária
      const { error: erroDelete } = await supabase
        .from("alunos_temp")
        .delete()
        .eq("id", alunoTemp.id);
      if (erroDelete) {
        console.error("Erro ao remover aluno_temp:", erroDelete);
      } else {
        console.log("Aluno_temp removido com sucesso:", alunoTemp.id);
      }

      console.log(
        "Aluno cadastrado automaticamente após pagamento!",
        novoAluno
      );
    }
    res.status(200).send("OK");
  } catch (error) {
    console.error("Erro no webhook do Asaas:", error);
    res.status(500).send("Erro");
  }
};

module.exports = {
  criarLinkPagamento,
  asaasRequest,
  asaasWebhookHandler,
};
