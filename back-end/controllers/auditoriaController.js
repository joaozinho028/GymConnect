const supabase = require("../db");

const auditoriaController = {
  /**
   * Obtém todos os registros de auditoria da empresa do usuário logado
   */
  getAll: async (req, res) => {
    try {
      console.log("Usuário logado:", req.user);

      const { id_empresa } = req.user;

      if (!id_empresa) {
        return res.status(400).json({
          error: "ID da empresa não encontrado no token do usuário",
        });
      }

      // Busca apenas os dados da auditoria filtrados pela empresa
      // Ordenando por criado_em descendente (mais atual primeiro)
      const { data, error } = await supabase
        .from("auditoria")
        .select("*")
        .eq("id_empresa", id_empresa)
        .order("criado_em", { ascending: false })
        .limit(1000);

      if (error) {
        console.error("Erro do Supabase:", error);
        throw error;
      }

      // Busca dados relacionados se existirem registros
      let formattedData = data;

      if (data && data.length > 0) {
        // Pega IDs únicos para buscar dados relacionados
        const userIds = [
          ...new Set(data.map((item) => item.id_usuario).filter(Boolean)),
        ];
        const filialIds = [
          ...new Set(data.map((item) => item.id_filial).filter(Boolean)),
        ];

        // Busca dados dos usuários
        let usuarios = [];
        if (userIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from("usuarios")
            .select("id_usuario, nome_usuario")
            .in("id_usuario", userIds);

          if (!usersError) {
            usuarios = usersData || [];
          }
        }

        // Busca dados das filiais
        let filiais = [];
        if (filialIds.length > 0) {
          const { data: filiaisData, error: filiaisError } = await supabase
            .from("filiais")
            .select("id_filial, nome_filial")
            .in("id_filial", filialIds);

          if (!filiaisError) {
            filiais = filiaisData || [];
          }
        }

        // Busca dados da empresa
        const { data: empresaData, error: empresaError } = await supabase
          .from("empresa")
          .select("id_empresa, nome_fantasia")
          .eq("id_empresa", id_empresa)
          .single();

        // Formata os dados combinando as informações
        formattedData = data.map((item) => {
          const usuario = usuarios.find(
            (u) => u.id_usuario === item.id_usuario
          );
          const filial = filiais.find((f) => f.id_filial === item.id_filial);

          return {
            ...item,
            nome_usuario: usuario?.nome_usuario || null,
            nome_empresa: empresaData?.nome_fantasia || null,
            nome_filial: filial?.nome_filial || null,
            data_hora: item.criado_em, // Adiciona o campo data_hora
          };
        });
      }

      console.log("Número de registros encontrados:", formattedData.length);

      res.status(200).json(formattedData);
    } catch (error) {
      console.error("Erro detalhado ao buscar registros de auditoria:", error);
      res.status(500).json({
        error: "Erro ao buscar registros de auditoria",
        details: error.message,
      });
    }
  },

  /**
   * Obtém um registro de auditoria específico pelo ID
   */
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const { id_empresa } = req.user;

      const { data, error } = await supabase
        .from("auditoria")
        .select("*")
        .eq("id_auditoria", id)
        .eq("id_empresa", id_empresa)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res
            .status(404)
            .json({ error: "Registro de auditoria não encontrado" });
        }
        throw error;
      }

      // Busca dados relacionados
      let formattedData = {
        ...data,
        data_hora: data.criado_em, // Adiciona o campo data_hora
      };

      // Busca usuário se existir
      if (data.id_usuario) {
        const { data: userData } = await supabase
          .from("usuarios")
          .select("nome_usuario")
          .eq("id_usuario", data.id_usuario)
          .single();

        formattedData.nome_usuario = userData?.nome_usuario || null;
      }

      // Busca filial se existir
      if (data.id_filial) {
        const { data: filialData } = await supabase
          .from("filiais")
          .select("nome_filial")
          .eq("id_filial", data.id_filial)
          .single();

        formattedData.nome_filial = filialData?.nome_filial || null;
      }

      // Busca empresa
      const { data: empresaData } = await supabase
        .from("empresa")
        .select("nome_fantasia")
        .eq("id_empresa", id_empresa)
        .single();

      formattedData.nome_empresa = empresaData?.nome_fantasia || null;

      res.status(200).json(formattedData);
    } catch (error) {
      console.error("Erro ao buscar registro de auditoria:", error);
      res.status(500).json({
        error: "Erro ao buscar registro de auditoria",
        details: error.message,
      });
    }
  },

  /**
   * Busca registros de auditoria por tipo de entidade
   */
  getByEntidade: async (req, res) => {
    try {
      const { entidade, id_entidade } = req.params;
      const { id_empresa } = req.user;

      // Mapeia o tipo de entidade para a descrição que contém o ID da entidade
      let descricaoPattern;
      switch (entidade.toLowerCase()) {
        case "aluno":
          descricaoPattern = `%aluno%id%${id_entidade}%`;
          break;
        case "usuario":
          descricaoPattern = `%usuário%id%${id_entidade}%`;
          break;
        case "perfil":
          descricaoPattern = `%perfil%id%${id_entidade}%`;
          break;
        case "plano":
        case "precificacao":
          descricaoPattern = `%plano%id%${id_entidade}%`;
          break;
        case "dadosbancarios":
          descricaoPattern = `%dados bancários%id%${id_entidade}%`;
          break;
        case "filial":
          descricaoPattern = `%filial%id%${id_entidade}%`;
          break;
        case "empresa":
          descricaoPattern = `%empresa%id%${id_entidade}%`;
          break;
        default:
          return res.status(400).json({ error: "Tipo de entidade inválido" });
      }

      const { data, error } = await supabase
        .from("auditoria")
        .select("*")
        .eq("id_empresa", id_empresa)
        .ilike("descricao", descricaoPattern)
        .order("criado_em", { ascending: false });

      if (error) {
        throw error;
      }

      // Busca dados relacionados (mesmo processo do getAll)
      let formattedData = data;

      if (data && data.length > 0) {
        const userIds = [
          ...new Set(data.map((item) => item.id_usuario).filter(Boolean)),
        ];
        const filialIds = [
          ...new Set(data.map((item) => item.id_filial).filter(Boolean)),
        ];

        let usuarios = [];
        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from("usuarios")
            .select("id_usuario, nome_usuario")
            .in("id_usuario", userIds);
          usuarios = usersData || [];
        }

        let filiais = [];
        if (filialIds.length > 0) {
          const { data: filiaisData } = await supabase
            .from("filiais")
            .select("id_filial, nome_filial")
            .in("id_filial", filialIds);
          filiais = filiaisData || [];
        }

        const { data: empresaData } = await supabase
          .from("empresa")
          .select("id_empresa, nome_fantasia")
          .eq("id_empresa", id_empresa)
          .single();

        formattedData = data.map((item) => {
          const usuario = usuarios.find(
            (u) => u.id_usuario === item.id_usuario
          );
          const filial = filiais.find((f) => f.id_filial === item.id_filial);

          return {
            ...item,
            nome_usuario: usuario?.nome_usuario || null,
            nome_empresa: empresaData?.nome_fantasia || null,
            nome_filial: filial?.nome_filial || null,
            data_hora: item.criado_em, // Adiciona o campo data_hora
          };
        });
      }

      res.status(200).json(formattedData);
    } catch (error) {
      console.error(
        "Erro ao buscar registros de auditoria por entidade:",
        error
      );
      res.status(500).json({
        error: "Erro ao buscar registros de auditoria por entidade",
        details: error.message,
      });
    }
  },
};

module.exports = auditoriaController;
