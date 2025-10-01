const efipay = require("../config/efiConfig");
const { createClient } = require("@supabase/supabase-js");
const WebhookController = require("./webhookController");

// Conectar ao Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

class PaymentController {
  // Criar cobrança
  async createStudentCharge(req, res) {
    try {
      const {
        aluno_nome,
        aluno_cpf,
        aluno_email,
        aluno_telefone,
        id_plano,
        forma_pagamento = "boleto",
      } = req.body;

      const { id_empresa } = req.user;

      // Validações
      if (
        !aluno_nome ||
        !aluno_cpf ||
        !aluno_email ||
        !aluno_telefone ||
        !id_plano ||
        !forma_pagamento
      ) {
        return res.status(400).json({
          success: false,
          message: "Todos os campos são obrigatórios",
        });
      }

      // Validar forma de pagamento
      const formasValidas = ["pix", "boleto", "credito", "debito"];
      if (!formasValidas.includes(forma_pagamento)) {
        return res.status(400).json({
          success: false,
          message:
            "Forma de pagamento inválida. Use: pix, boleto, credito ou debito",
        });
      }

      console.log("🔍 Buscando plano no Supabase:", { id_plano, id_empresa });

      // Buscar dados do plano no SUPABASE
      const { data: plano, error: planoError } = await supabase
        .from("planos")
        .select("*")
        .eq("id_plano", id_plano)
        .eq("id_empresa", id_empresa)
        .single();

      if (planoError || !plano) {
        console.error("❌ Erro ao buscar plano:", planoError);
        return res.status(404).json({
          success: false,
          message:
            "Plano não encontrado: " +
            (planoError?.message || "Plano não existe"),
        });
      }

      console.log("✅ Plano encontrado:", plano);

      // Calcular data de vencimento
      const vencimento = new Date();
      if (forma_pagamento === "boleto") {
        vencimento.setDate(vencimento.getDate() + 7); // 7 dias para boleto
      } else {
        vencimento.setDate(vencimento.getDate() + 1); // 1 dia para PIX/cartão
      }
      const vencimentoFormatado = vencimento.toISOString().split("T")[0];

      // Nome do plano para exibição
      const planoNome = `Plano ${
        plano.ciclo_pagamento_plano.charAt(0).toUpperCase() +
        plano.ciclo_pagamento_plano.slice(1)
      }`;

      // Mapear forma de pagamento para EFí Pay
      const paymentMethodMap = {
        boleto: "banking_billet",
        pix: "pix",
        credito: "credit_card",
        debito: "debit_card",
      };

      const efiPaymentMethod = paymentMethodMap[forma_pagamento];

      // Criar cobrança na EFí Pay
      const body = {
        items: [
          {
            name: `${planoNome} - ${aluno_nome}`,
            value: Math.round(plano.valor_plano * 100),
            amount: 1,
          },
        ],
        settings: {
          payment_method: efiPaymentMethod,
          expire_at: vencimentoFormatado,
          request_delivery_address: false,
        },
        // customer: {
        //   name: aluno_nome,
        //   cpf: aluno_cpf,
        //   email: aluno_email,
        //   phone_number: aluno_telefone,
        // },
        metadata: {
          custom_id: `${id_empresa}_${aluno_cpf}_${id_plano}_${forma_pagamento}`,
          ...(process.env.API_URL && {
            notification_url: `${process.env.API_URL}/api/webhook/efipay`,
          }),
        },
      };

      console.log("🌐 API_URL configurada:", process.env.API_URL);
      console.log("🔔 Notification URL:", body.metadata.notification_url);
      console.log(
        `📤 Criando cobrança EFí Pay (${forma_pagamento}):`,
        JSON.stringify(body, null, 2)
      );

      const efiResponse = await efipay.createOneStepLink([], body);
      console.log("✅ Resposta EFí Pay:", efiResponse.data);

      // Salvar cobrança pendente no banco
      const cobrancaPendente = {
        charge_id: efiResponse.data.charge_id,
        aluno_nome,
        aluno_cpf: aluno_cpf.replace(/\D/g, ""), // Limpar formatação
        aluno_email,
        aluno_telefone: aluno_telefone.replace(/\D/g, ""), // Limpar formatação
        id_empresa: parseInt(id_empresa),
        id_plano: parseInt(id_plano),
        forma_pagamento,
        valor: plano.valor_plano,
        status: efiResponse.data.status,
        payment_url: efiResponse.data.payment_url,
        data_criacao: new Date().toISOString(),
        processado: false,
      };

      const { error: insertError } = await supabase
        .from("cobrancas_pendentes")
        .insert(cobrancaPendente);

      if (insertError) {
        console.error("⚠️ Erro ao salvar cobrança pendente:", insertError);
        // Continua mesmo se der erro ao salvar
      }

      // SE FOR BOLETO: Cadastrar aluno com situação "Aguardando Pagamento"
      if (forma_pagamento === "boleto") {
        console.log(
          "📄 Boleto criado - Cadastrando aluno com situação 'Aguardando Pagamento'"
        );

        try {
          await WebhookController.cadastrarAluno({
            ...cobrancaPendente,
            situacao: "aguardando pagamento", // Situação correta
          });
        } catch (error) {
          console.error("⚠️ Erro ao cadastrar aluno do boleto:", error.message);
          // Continua mesmo se der erro no cadastro
        }
      }

      // Tipos de pagamento para resposta
      const tiposPagamento = {
        pix: {
          emoji: "📱",
          nome: "PIX",
          instrucao: "Escaneie o QR Code ou cole o código PIX",
        },
        boleto: {
          emoji: "🧾",
          nome: "Boleto Bancário",
          instrucao: "Pague no banco, app ou internet banking",
        },
        credito: {
          emoji: "💳",
          nome: "Cartão de Crédito",
          instrucao: "Pagamento com cartão de crédito",
        },
        debito: {
          emoji: "💳",
          nome: "Cartão de Débito",
          instrucao: "Pagamento com cartão de débito",
        },
      };

      const tipoPagamento = tiposPagamento[forma_pagamento];

      // Resposta final
      res.json({
        success: true,
        message: `${tipoPagamento.emoji} ${
          tipoPagamento.nome
        } criado com sucesso!${
          forma_pagamento === "boleto"
            ? " Aluno cadastrado com situação 'Aguardando Pagamento'."
            : ""
        }`,
        data: {
          charge_id: efiResponse.data.charge_id,
          payment_url: efiResponse.data.payment_url,
          valor: efiResponse.data.total / 100,
          status: efiResponse.data.status,
          expire_at: efiResponse.data.expire_at,
          plano: planoNome,
          forma_pagamento: forma_pagamento,
          tipo_pagamento: tipoPagamento.nome,
          instrucao: tipoPagamento.instrucao,
        },
      });
    } catch (error) {
      console.error("❌ Erro ao criar cobrança:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Erro interno do servidor",
      });
    }
  }

  // Teste simples
  async testPayment(req, res) {
    try {
      const { forma_pagamento = "boleto" } = req.query;

      res.json({
        success: true,
        message: `Teste de ${forma_pagamento} realizado!`,
        data: {
          forma_pagamento: forma_pagamento,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new PaymentController();
