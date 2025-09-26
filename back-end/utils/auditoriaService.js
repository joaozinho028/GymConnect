const db = require("../db");

/**
 * Serviço para registrar ações de auditoria no sistema
 */
const auditoriaService = {
  /**
   * Registra uma ação de auditoria
   * @param {number} id_usuario - ID do usuário que realizou a ação
   * @param {number} id_empresa - ID da empresa relacionada à ação
   * @param {number} id_filial - ID da filial relacionada à ação
   * @param {string} acao - Tipo de ação realizada (CADASTRO, EDICAO, ATIVACAO, INATIVACAO)
   * @param {string} descricao - Descrição detalhada da ação
   * @param {Date} data_acao - Data e hora da ação (opcional, padrão é agora)
   * @returns {Promise<Object>} - O registro de auditoria criado
   */
  registrarAcao: async (
    id_usuario,
    id_empresa,
    id_filial,
    acao,
    descricao,
    data_acao = null
  ) => {
    try {
      const query = `
        INSERT INTO auditoria (id_usuario, id_empresa, id_filial, acao, descricao, data_acao)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const values = [
        id_usuario,
        id_empresa,
        id_filial,
        acao,
        descricao,
        data_acao || new Date(),
      ];

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Erro ao registrar auditoria:", error);
      throw error;
    }
  },

  /**
   * Constrói uma descrição detalhada para auditorias de edição
   * @param {Object} dadosAntigos - Objeto com os dados antes da edição
   * @param {Object} dadosNovos - Objeto com os dados após a edição
   * @param {string} entidade - Nome da entidade que está sendo editada
   * @returns {string} Descrição formatada das alterações
   */
  criarDescricaoEdicao: (dadosAntigos, dadosNovos, entidade) => {
    const alteracoes = [];

    for (const campo in dadosNovos) {
      // Ignora campos que não devem ser registrados na auditoria
      if (
        ["id", "criado_em", "atualizado_em", "senha", "password"].includes(
          campo
        )
      ) {
        continue;
      }

      // Verifica se o valor foi alterado
      if (dadosAntigos[campo] !== dadosNovos[campo]) {
        const valorAntigo =
          dadosAntigos[campo] === null ? "não definido" : dadosAntigos[campo];
        const valorNovo =
          dadosNovos[campo] === null ? "não definido" : dadosNovos[campo];

        alteracoes.push(`Campo "${campo}": "${valorAntigo}" -> "${valorNovo}"`);
      }
    }

    if (alteracoes.length === 0) {
      return `Edição de ${entidade} sem alterações efetivas`;
    }

    return `Edição de ${entidade}. Alterações: ${alteracoes.join(" | ")}`;
  },
};

module.exports = auditoriaService;
