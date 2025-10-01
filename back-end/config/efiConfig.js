try {
  const EfiPay = require("gn-api-sdk-node");
} catch (error) {
  console.error("Erro ao carregar SDK:", error.message);
  throw error;
}

const EfiPay = require("gn-api-sdk-node");

const efipay = new EfiPay({
  sandbox: process.env.EFI_SANDBOX === "true",
  client_id:
    process.env.EFI_SANDBOX === "true"
      ? process.env.EFI_CLIENT_ID_SANDBOX
      : process.env.EFI_CLIENT_ID_PRODUCTION,
  client_secret:
    process.env.EFI_SANDBOX === "true"
      ? process.env.EFI_CLIENT_SECRET_SANDBOX
      : process.env.EFI_CLIENT_SECRET_PRODUCTION,
});

console.log("Configuração EFí Pay finalizada");

module.exports = efipay;
