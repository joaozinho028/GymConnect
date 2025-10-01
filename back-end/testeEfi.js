require("dotenv").config();

async function testeSimples() {
  try {
    console.log("🔄 Teste simples - só boleto...");

    const efipay = require("./config/efiConfig");

    const body = {
      items: [
        {
          name: "Teste Boleto GymConnect",
          value: 1000, // R$ 10,00
          amount: 1,
        },
      ],
      settings: {
        payment_method: "banking_billet", // SÓ BOLETO
        expire_at: "2025-12-31",
        request_delivery_address: false,
      },
    };

    const response = await efipay.createOneStepLink([], body);
    console.log("✅ BOLETO CRIADO COM SUCESSO!");
    console.log("🧾 Link do boleto:", response.data.payment_url);
    console.log("📋 ID:", response.data.charge_id);
    console.log("💰 Valor: R$ 10,00");
    console.log("\n📱 Acesse o link para ver/baixar o boleto!");
  } catch (error) {
    console.log(
      "❌ Erro:",
      error.error_description?.message || error.message || error
    );
  }
}

testeSimples();
