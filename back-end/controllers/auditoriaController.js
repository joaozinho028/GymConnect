const db = require("../db");

const auditoriaController = {
  /**
   * Obtém todos os registros de auditoria com filtros opcionais
   */
  getAll: async (req, res) => {
    try {
      const { id_empresa, id_filial, data_inicio, data_fim, acao, id_usuario } =
        req.query;

      let query = `
        SELECT a.*, 
               u.nome as nome_usuario,
               e.nome_fantasia as nome_empresa,
               f.nome as nome_filial
        FROM auditoria a
        LEFT JOIN usuario u ON a.id_usuario = u.id_usuario
        LEFT JOIN empresa e ON a.id_empresa = e.id_empresa
        LEFT JOIN filial f ON a.id_filial = f.id_filial
        WHERE 1=1
      `;

      const params = [];
      let paramIndex = 1;

      if (id_empresa) {
        query += ` AND a.id_empresa = $${paramIndex++}`;
        params.push(id_empresa);
      }

      if (id_filial) {
        query += ` AND a.id_filial = $${paramIndex++}`;
        params.push(id_filial);
      }

      if (id_usuario) {
        query += ` AND a.id_usuario = $${paramIndex++}`;
        params.push(id_usuario);
      }

      if (acao) {
        query += ` AND a.acao = $${paramIndex++}`;
        params.push(acao);
      }

      if (data_inicio) {
        query += ` AND a.data_acao >= $${paramIndex++}`;
        params.push(data_inicio);
      }

      if (data_fim) {
        query += ` AND a.data_acao <= $${paramIndex++}`;
        params.push(data_fim);
      }

      query += " ORDER BY a.data_acao DESC";

      const result = await db.query(query, params);
      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Erro ao buscar registros de auditoria:", error);
      res.status(500).json({ error: "Erro ao buscar registros de auditoria" });
    }
  },

  /**
   * Obtém um registro de auditoria específico pelo ID
   */
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const query = `
        SELECT a.*, 
               u.nome as nome_usuario,
               e.nome_fantasia as nome_empresa,
               f.nome as nome_filial
        FROM auditoria a
        LEFT JOIN usuario u ON a.id_usuario = u.id_usuario
        LEFT JOIN empresa e ON a.id_empresa = e.id_empresa
        LEFT JOIN filial f ON a.id_filial = f.id_filial
        WHERE a.id_auditoria = $1
      `;

      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Registro de auditoria não encontrado" });
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error("Erro ao buscar registro de auditoria:", error);
      res.status(500).json({ error: "Erro ao buscar registro de auditoria" });
    }
  },

  /**
   * Busca registros de auditoria por tipo de entidade
   */
  getByEntidade: async (req, res) => {
    try {
      const { entidade, id_entidade } = req.params;
      const { id_empresa } = req.query;

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

      const params = [descricaoPattern];
      let query = `
        SELECT a.*, 
               u.nome as nome_usuario,
               e.nome_fantasia as nome_empresa,
               f.nome as nome_filial
        FROM auditoria a
        LEFT JOIN usuario u ON a.id_usuario = u.id_usuario
        LEFT JOIN empresa e ON a.id_empresa = e.id_empresa
        LEFT JOIN filial f ON a.id_filial = f.id_filial
        WHERE a.descricao ILIKE $1
      `;

      if (id_empresa) {
        query += ` AND a.id_empresa = $2`;
        params.push(id_empresa);
      }

      query += ` ORDER BY a.data_acao DESC`;

      const result = await db.query(query, params);
      res.status(200).json(result.rows);
    } catch (error) {
      console.error(
        "Erro ao buscar registros de auditoria por entidade:",
        error
      );
      res
        .status(500)
        .json({ error: "Erro ao buscar registros de auditoria por entidade" });
    }
  },
};

module.exports = auditoriaController;
