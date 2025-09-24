const supabase = require("../db");
const { registrarAuditoria } = require("./auditoriaController");

const cadastrarPlano = async (req, res) => {
  try {
    const id_empresa = req.user?.id_empresa;
    const id_usuario = req.user?.id;
    const id_filial = req.user?.id_filial || null;

    // Aceita tanto os nomes usados no front (ciclo_pagamento, valor) quanto os nomes da tabela
    const {
      ciclo_pagamento: cicloBody,
      ciclo_pagamento_plano: cicloBody2,
      valor: valorBody,
      valor_plano: valorBody2,
    } = req.body;

    const ciclo = cicloBody2 || cicloBody;
    const valorRaw = valorBody2 ?? valorBody;

    if (!id_empresa) {
      return res
        .status(400)
        .json({ message: "Empresa não identificada no token" });
    }

    if (
      !ciclo ||
      valorRaw === undefined ||
      valorRaw === null ||
      valorRaw === ""
    ) {
      return res.status(400).json({
        message: "Os campos ciclo_pagamento e valor_plano são obrigatórios",
      });
    }

    // Normalizar valor para número (aceita string com vírgula ou ponto)
    const valorNumber = parseFloat(
      String(valorRaw)
        .replace(/[^0-9,-.]/g, "")
        .replace(",", ".")
    );
    if (isNaN(valorNumber) || valorNumber <= 0) {
      return res.status(400).json({ message: "Valor do plano inválido" });
    }

    // Verificar se já existe plano com o mesmo ciclo para esta empresa
    const { data: planoExistente, error: errConsulta } = await supabase
      .from("planos")
      .select("id_plano, ciclo_pagamento_plano")
      .eq("id_empresa", id_empresa)
      .eq("ciclo_pagamento_plano", ciclo)
      .maybeSingle();

    if (errConsulta) {
      console.error("Erro ao verificar plano existente:", errConsulta);
      return res.status(500).json({
        message: "Erro ao verificar plano existente",
        error: errConsulta,
      });
    }

    // Se já existe um plano com esse ciclo, retorna erro
    if (planoExistente) {
      return res.status(409).json({
        message: `Já existe um plano ${ciclo} cadastrado para esta empresa`,
        planoExistente: planoExistente.id_plano,
      });
    }

    // Inserir no banco - removido campo status_plano
    const { data, error } = await supabase
      .from("planos")
      .insert({
        id_empresa,
        ciclo_pagamento_plano: ciclo,
        valor_plano: valorNumber,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao cadastrar plano:", error);
      return res
        .status(500)
        .json({ message: "Erro ao cadastrar plano", error });
    }

    // Registrar auditoria (descricao simples com dados do plano)
    try {
      await registrarAuditoria(
        id_empresa,
        id_usuario,
        id_filial,
        "CADASTRO",
        `Plano cadastrado: ciclo=${ciclo}, valor=${valorNumber}`
      );
    } catch (audErr) {
      console.error("Erro ao registrar auditoria do plano:", audErr);
      // não bloqueia o sucesso do cadastro
    }

    return res
      .status(201)
      .json({ message: "Plano cadastrado com sucesso", plano: data });
  } catch (err) {
    console.error("Erro no servidor ao cadastrar plano:", err);
    return res
      .status(500)
      .json({ message: "Erro no servidor", error: err?.message || err });
  }
};

const ConsultarPlanos = async (req, res) => {
  try {
    const id_empresa = req.user?.id_empresa;
    const { id_plano, ciclo, page = 1, limit = 50 } = req.query;

    if (!id_empresa) {
      return res
        .status(400)
        .json({ message: "Empresa não identificada no token" });
    }

    let query = supabase
      .from("planos")
      .select("*")
      .eq("id_empresa", id_empresa)
      .order("id_plano", { ascending: false });

    if (id_plano) query = query.eq("id_plano", Number(id_plano));
    if (ciclo) query = query.ilike("ciclo_pagamento_plano", `%${ciclo}%`);

    // Paginação
    const offset = (Number(page) - 1) * Number(limit);
    query = query.range(offset, offset + Number(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Erro ao consultar planos:", error);
      return res
        .status(500)
        .json({ message: "Erro ao consultar planos", error });
    }

    const planos = (data || []).map((p) => ({
      id: p.id_plano,
      ciclo: p.ciclo_pagamento_plano,
      valor: p.valor_plano,
    }));

    return res.json({
      planos,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || (data || []).length,
      },
    });
  } catch (err) {
    console.error("Erro no servidor ao consultar planos:", err);
    return res
      .status(500)
      .json({ message: "Erro no servidor", error: err?.message || err });
  }
};

const atualizarPlano = async (req, res) => {
  try {
    const id_empresa = req.user?.id_empresa;
    const id_usuario = req.user?.id;
    const id_filial = req.user?.id_filial || null;

    const { id_plano, valor, valor_plano } = req.body;
    const novoValorRaw = valor_plano ?? valor;

    if (!id_empresa)
      return res
        .status(400)
        .json({ message: "Empresa não identificada no token" });
    if (!id_plano)
      return res.status(400).json({ message: "id_plano é obrigatório" });

    // Verifica plano existente e pertence à empresa
    const { data: planoExistente, error: errGet } = await supabase
      .from("planos")
      .select("*")
      .eq("id_plano", Number(id_plano))
      .single();

    if (errGet) {
      return res
        .status(500)
        .json({ message: "Erro ao buscar plano", error: errGet });
    }
    if (!planoExistente)
      return res.status(404).json({ message: "Plano não encontrado" });
    if (Number(planoExistente.id_empresa) !== Number(id_empresa))
      return res
        .status(403)
        .json({ message: "Plano não pertence à empresa do usuário" });

    // Normalizar e validar novo valor
    if (
      novoValorRaw === undefined ||
      novoValorRaw === null ||
      novoValorRaw === ""
    ) {
      return res.status(400).json({ message: "Valor do plano é obrigatório" });
    }
    const novoValor = parseFloat(
      String(novoValorRaw)
        .replace(/[^0-9,-.]/g, "")
        .replace(",", ".")
    );
    if (isNaN(novoValor) || novoValor <= 0) {
      return res.status(400).json({ message: "Valor inválido" });
    }

    // Atualizar no banco
    const { data: updated, error: errUpdate } = await supabase
      .from("planos")
      .update({ valor_plano: novoValor })
      .eq("id_plano", Number(id_plano))
      .select()
      .single();

    if (errUpdate) {
      console.error("Erro ao atualizar plano:", errUpdate);
      return res
        .status(500)
        .json({ message: "Erro ao atualizar plano", error: errUpdate });
    }

    // Registrar auditoria com valores antigo/novo
    try {
      await registrarAuditoria(
        id_empresa,
        id_usuario,
        id_filial,
        "EDICAO",
        `Plano atualizado id=${id_plano}: valor_antigo=${planoExistente.valor_plano}, valor_novo=${novoValor}`
      );
    } catch (audErr) {
      console.error("Erro ao registrar auditoria de atualização:", audErr);
    }

    return res.json({ message: "Plano atualizado", plano: updated });
  } catch (err) {
    console.error("Erro no servidor ao atualizar plano:", err);
    return res
      .status(500)
      .json({ message: "Erro no servidor", error: err?.message || err });
  }
};

module.exports = {
  cadastrarPlano,
  ConsultarPlanos,
  atualizarPlano,
};
