const supabase = require("../db");

const cadastrarPerfil = async (req, res) => {
  try {
    const { nome_perfil, permissoes_perfil, id_filial } = req.body;
    const { id_empresa } = req.user;

    if (!nome_perfil || !id_empresa || !permissoes_perfil || !id_filial) {
      console.log("Dados recebidos:", {
        nome_perfil,
        permissoes_perfil,
        id_filial,
        id_empresa,
      });
      return res
        .status(400)
        .json({ message: "Campos obrigatórios não informados ou inválidos." });
    }

    // Verificar se já existe perfil com o mesmo nome para a empresa
    const { data: perfilExistente, error: errorBusca } = await supabase
      .from("perfis")
      .select("id_perfil")
      .eq("nome_perfil", nome_perfil)
      .eq("id_empresa", id_empresa)
      .eq("id_filial", Number(id_filial))
      .maybeSingle();
    if (errorBusca) {
      return res.status(500).json({
        message: "Erro ao verificar perfil existente.",
        error: errorBusca,
      });
    }
    if (perfilExistente) {
      return res.status(409).json({
        message: "Já existe um perfil com esse nome para esta empresa.",
      });
    }

    const { data, error } = await supabase
      .from("perfis")
      .insert([
        {
          nome_perfil,
          id_empresa,
          id_filial: Number(id_filial),
          permissoes_perfil,
          status_perfil: true,
        },
      ])
      .select();
    if (error) {
      return res
        .status(500)
        .json({ message: "Erro ao cadastrar perfil.", error });
    }
    return res
      .status(201)
      .json({ message: "Perfil cadastrado com sucesso!", perfil: data[0] });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Erro interno do servidor.", error: err.message });
  }
};

const consultarPerfis = async (req, res) => {
  try {
    const { id_empresa } = req.user;
    const { id_filial, id_perfil } = req.query;
    if (!id_empresa) {
      return res.status(400).json({ message: "Empresa é obrigatória." });
    }
    let query = supabase
      .from("perfis")
      .select(
        `id_perfil, nome_perfil, permissoes_perfil, status_perfil, filiais(nome_filial), created_at`
      )
      .eq("id_empresa", id_empresa);
    if (id_filial) {
      query = query.eq("id_filial", Number(id_filial));
    }
    if (id_perfil) {
      query = query.eq("id_perfil", Number(id_perfil));
    }
    const { data, error } = await query;
    if (error) {
      return res.status(500).json({ message: "Erro ao buscar perfis.", error });
    }
    function formatModuleName(key) {
      // Remove underscores, capitalize words, e.g. plano_gym_connect -> Plano Gym Connect
      return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    }

    function parsePermissoes(permissoes) {
      if (!permissoes) return [];
      let obj = permissoes;
      if (typeof permissoes === "string") {
        try {
          obj = JSON.parse(permissoes);
        } catch {
          return [];
        }
      }
      const modulos = [];
      let configuracoesArr = [];
      for (const [key, value] of Object.entries(obj)) {
        if (
          key === "configuracoes" &&
          typeof value === "object" &&
          value !== null
        ) {
          for (const [confKey, confVal] of Object.entries(value)) {
            if (confVal) {
              configuracoesArr.push(formatModuleName(confKey));
            }
          }
        } else if (value) {
          modulos.push(`Módulo ${formatModuleName(key)}`);
        }
      }
      if (configuracoesArr.length > 0) {
        modulos.push(`Módulo Configurações (${configuracoesArr.join(", ")})`);
      }
      return modulos;
    }

    const perfis = (data || []).map((perfil) => ({
      id: perfil.id_perfil,
      nome: perfil.nome_perfil,
      permissoes: parsePermissoes(perfil.permissoes_perfil),
      status: perfil.status_perfil,
      filial: perfil.filiais?.nome_filial || "",
      criadoEm: perfil.created_at
        ? new Date(perfil.created_at).toLocaleString("pt-BR")
        : "",
    }));
    res.json(perfis);
  } catch (err) {
    res.status(500).json({ message: "Erro no servidor" });
  }
};

const alterarStatusPerfil = async (req, res) => {
  try {
    const { id_perfil, status_perfil } = req.body;
    const { id_empresa } = req.user;
    if (!id_perfil || typeof status_perfil !== "boolean" || !id_empresa) {
      return res
        .status(400)
        .json({ message: "Dados obrigatórios não informados." });
    }
    const { data, error } = await supabase
      .from("perfis")
      .update({ status_perfil })
      .eq("id_perfil", id_perfil)
      .eq("id_empresa", id_empresa)
      .select();
    if (error) {
      return res
        .status(500)
        .json({ message: "Erro ao alterar status do perfil.", error });
    }
    if (!data || data.length === 0) {
      return res.status(404).json({ message: "Perfil não encontrado." });
    }

    // Se inativar o perfil, inativa todos os usuários relacionados
    if (status_perfil === false) {
      const { error: errorUsuarios } = await supabase
        .from("usuarios")
        .update({ status_usuario: false })
        .eq("id_perfil", id_perfil)
        .eq("id_empresa", id_empresa);
      if (errorUsuarios) {
        return res.status(500).json({
          message: "Perfil inativado, mas houve erro ao inativar usuários.",
          error: errorUsuarios,
        });
      }
    }

    // Padronizar resposta: id, nome, status, permissoes, filial
    const perfil = data[0];
    return res.status(200).json({
      message:
        status_perfil === false
          ? "Status do perfil e dos usuários relacionados atualizado com sucesso."
          : "Status do perfil atualizado com sucesso.",
      perfil: {
        id: perfil.id_perfil,
        nome: perfil.nome_perfil,
        status: perfil.status_perfil,
        permissoes: perfil.permissoes_perfil,
        filial: perfil.id_filial,
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Erro interno do servidor.", error: err.message });
  }
};

module.exports = { cadastrarPerfil, consultarPerfis, alterarStatusPerfil };
