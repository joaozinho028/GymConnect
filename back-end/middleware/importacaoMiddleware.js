const validarImportacaoAlunos = (req, res, next) => {
  try {
    const { alunos } = req.body;

    if (!alunos) {
      return res.status(400).json({
        success: false,
        error: 'Campo "alunos" é obrigatório',
      });
    }

    if (!Array.isArray(alunos)) {
      return res.status(400).json({
        success: false,
        error: 'Campo "alunos" deve ser um array',
      });
    }

    if (alunos.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Lista de alunos não pode estar vazia",
      });
    }

    if (alunos.length > 1000) {
      return res.status(400).json({
        success: false,
        error: "Máximo de 1000 alunos por importação",
      });
    }

    // Validar estrutura básica de cada aluno
    const camposObrigatorios = [
      "nome_aluno",
      "email_aluno",
      "cpf_aluno",
      "plano_aluno",
      "forma_pagamento",
    ];

    for (let i = 0; i < alunos.length; i++) {
      const aluno = alunos[i];

      for (const campo of camposObrigatorios) {
        if (!aluno[campo]) {
          return res.status(400).json({
            success: false,
            error: `Campo "${campo}" é obrigatório para todos os alunos. Erro no índice ${i}`,
          });
        }
      }
    }

    next();
  } catch (error) {
    console.error("Erro na validação de importação:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno na validação",
    });
  }
};

module.exports = {
  validarImportacaoAlunos,
};
