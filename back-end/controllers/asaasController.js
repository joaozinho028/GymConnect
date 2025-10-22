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

module.exports = {
  criarLinkPagamento,
  asaasRequest,
};
