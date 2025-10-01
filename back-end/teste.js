require("dotenv").config();

async function testarPayment() {
  try {
    console.log("🧪 Testando sistema de pagamento...");

    const mockUser = { id_empresa: 1 };

    const mockReq = {
      user: mockUser,
      body: {
        aluno_nome: "João Silva Teste",
        aluno_cpf: "13178036989",
        aluno_email: "joao.marcelinO@gmail.com",
        aluno_telefone: "47992813141",
        id_plano: 1,
        forma_pagamento: "boleto", // ESPECÍFICO: boleto, pix, credito ou debito
      },
    };

    const mockRes = {
      json: (data) => {
        console.log("✅ Resposta:", JSON.stringify(data, null, 2));
      },
      status: (code) => ({
        json: (data) => {
          console.log(`❌ Erro ${code}:`, JSON.stringify(data, null, 2));
        },
      }),
    };

    const PaymentController = require("./controllers/paymentController");
    await PaymentController.createStudentCharge(mockReq, mockRes);
  } catch (error) {
    console.error("❌ Erro no teste:", error);
  }
}

testarPayment();