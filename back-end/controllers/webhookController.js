const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

class WebhookController {
  // Webhook da EFí Pay
  async handleEfiPayWebhook(req, res) {
    try {
      console.log(
        "🔔 Webhook EFí Pay recebido:",
        JSON.stringify(req.body, null, 2)
      );

      const { data } = req.body;

      if (!data || !data.charge) {
        return res.status(400).json({ error: "Dados inválidos" });
      }

      const { charge, payment } = data;
      const chargeId = charge.charge_id;
      const status = charge.status;
      const customId = charge.custom_id; // formato: {id_empresa}_{aluno_cpf}_{id_plano}_{forma_pagamento}

      console.log(`📊 Status do pagamento ${chargeId}: ${status}`);

      // Extrair dados do custom_id
      const [id_empresa, aluno_cpf, id_plano, forma_pagamento] =
        customId.split("_");

      // Buscar cobrança pendente no banco
      const { data: cobrancaPendente, error: cobrancaError } = await supabase
        .from("cobrancas_pendentes")
        .select("*")
        .eq("charge_id", chargeId)
        .single();

      if (cobrancaError || !cobrancaPendente) {
        console.error("❌ Cobrança não encontrada:", cobrancaError);
        return res.status(404).json({ error: "Cobrança não encontrada" });
      }

      // Atualizar status da cobrança
      await supabase
        .from("cobrancas_pendentes")
        .update({
          status: status,
          data_atualizacao: new Date().toISOString(),
        })
        .eq("charge_id", chargeId);

      // Se pagamento foi aprovado, processar aluno
      if (status === "paid" || status === "settled") {
        console.log("✅ Pagamento confirmado! Processando aluno...");

        if (cobrancaPendente.forma_pagamento === "boleto") {
          // Para boleto: atualizar situação de "Aguardando Pagamento" para "Ativo"
          await this.ativarAluno(cobrancaPendente);
        } else {
          // Para PIX/Cartão: cadastrar aluno pela primeira vez
          await this.cadastrarAluno({
            ...cobrancaPendente,
            situacao: "Ativo",
          });
        }

        // Marcar como processado
        await supabase
          .from("cobrancas_pendentes")
          .update({ processado: true })
          .eq("charge_id", chargeId);
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("❌ Erro no webhook:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Função para cadastrar aluno no sistema
  async cadastrarAluno(dadosCobranca) {
    try {
      console.log("👤 Cadastrando aluno:", dadosCobranca.aluno_nome);

      // Buscar dados do plano
      const { data: plano } = await supabase
        .from("planos")
        .select("*")
        .eq("id_plano", dadosCobranca.id_plano)
        .eq("id_empresa", dadosCobranca.id_empresa)
        .single();

      if (!plano) {
        throw new Error("Plano não encontrado");
      }

      // Calcular data de vencimento da mensalidade
      const hoje = new Date();
      let proximoVencimento = new Date(hoje);

      switch (plano.ciclo_pagamento_plano?.toLowerCase()) {
        case "mensal":
          proximoVencimento.setMonth(proximoVencimento.getMonth() + 1);
          break;
        case "trimestral":
          proximoVencimento.setMonth(proximoVencimento.getMonth() + 3);
          break;
        case "semestral":
          proximoVencimento.setMonth(proximoVencimento.getMonth() + 6);
          break;
        case "anual":
          proximoVencimento.setFullYear(proximoVencimento.getFullYear() + 1);
          break;
        default:
          proximoVencimento.setMonth(proximoVencimento.getMonth() + 1);
      }

      // Determinar situação baseada no parâmetro
      const situacao = dadosCobranca.situacao || "Ativo";

      // Preparar dados para inserção
      const dadosAluno = {
        nome_aluno: dadosCobranca.aluno_nome,
        email_aluno: dadosCobranca.aluno_email,
        telefone_aluno: dadosCobranca.aluno_telefone,
        cpf_aluno: dadosCobranca.aluno_cpf,
        id_empresa: dadosCobranca.id_empresa,
        id_plano: dadosCobranca.id_plano,
        status_aluno: true, // SEMPRE true - aluno ativo
        situacao: situacao, // "Ativo" ou "Aguardando Pagamento"
        data_inicio: hoje.toISOString().split("T")[0],
        proximo_vencimento: proximoVencimento.toISOString().split("T")[0],
        forma_pagamento: dadosCobranca.forma_pagamento,
        valor_mensalidade: plano.valor_plano,
        observacoes: `Cadastrado via pagamento automático - Situação: ${situacao} - Charge ID: ${dadosCobranca.charge_id}`,
      };

      console.log("📝 Dados do aluno para inserção:", dadosAluno);

      // Cadastrar aluno na tabela alunos
      const { data: novoAluno, error: alunoError } = await supabase
        .from("alunos")
        .insert(dadosAluno)
        .select()
        .single();

      if (alunoError) {
        console.error("❌ Erro detalhado ao cadastrar aluno:", alunoError);
        throw new Error(`Erro ao cadastrar aluno: ${alunoError.message}`);
      }

      console.log("✅ Aluno cadastrado com sucesso:", novoAluno.nome_aluno);
      console.log("📊 Status: Ativo (true)");
      console.log("📋 Situação:", situacao);
      return novoAluno;
    } catch (error) {
      console.error("❌ Erro ao cadastrar aluno:", error);
      throw error;
    }
  }

  // Função para ativar aluno que estava "Aguardando Pagamento" (Boleto)
  async ativarAluno(dadosCobranca) {
    try {
      console.log(
        "🔄 Atualizando situação do aluno:",
        dadosCobranca.aluno_nome
      );

      // Buscar aluno existente pelo CPF e empresa
      const { data: aluno, error: alunoError } = await supabase
        .from("alunos")
        .select("*")
        .eq("cpf_aluno", dadosCobranca.aluno_cpf)
        .eq("id_empresa", dadosCobranca.id_empresa)
        .single();

      if (alunoError || !aluno) {
        console.log("⚠️ Aluno não encontrado, cadastrando...");
        // Se não encontrar, cadastra (caso de erro anterior)
        return await this.cadastrarAluno({
          ...dadosCobranca,
          situacao: "Ativo", // Situação ativa após pagamento
        });
      }

      // Atualizar situação para "Ativo" (status_aluno já era true)
      const { error: updateError } = await supabase
        .from("alunos")
        .update({
          situacao: "Ativo", // Mudança de "Aguardando Pagamento" para "Ativo"
          observacoes:
            (aluno.observacoes || "") +
            ` | Pagamento confirmado em ${new Date().toLocaleString(
              "pt-BR"
            )} - Charge ID: ${dadosCobranca.charge_id}`,
        })
        .eq("id_aluno", aluno.id_aluno);

      if (updateError) {
        throw new Error(
          `Erro ao atualizar situação do aluno: ${updateError.message}`
        );
      }

      console.log("✅ Situação do aluno atualizada:", aluno.nome_aluno);
      console.log("📊 Status: Ativo (true) - mantido");
      console.log("📋 Situação: Ativo - atualizada");
      return aluno;
    } catch (error) {
      console.error("❌ Erro ao atualizar situação do aluno:", error);
      throw error;
    }
  }
}

module.exports = new WebhookController();
