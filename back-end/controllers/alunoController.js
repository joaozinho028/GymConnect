const db = require("../db");

const cadastrarAluno = async (req, res) => {
  try {
    const {
      nome_aluno,
      email_aluno,
      telefone_aluno,
      cpf_aluno,
      plano_aluno,
      matricula_aluno,
      token_aluno,
      status_aluno,
      situacao,
    } = req.body;

    const id_empresa = req.user;
    const id_filial = req.user;

    if (
      !id_empresa ||
      !id_filial ||
      !nome_aluno ||
      !cpf_aluno ||
      !matricula_aluno
    ) {
      return res
        .status(400)
        .json({ error: "Campos obrigatórios não preenchidos." });
    }

    const query = `INSERT INTO alunos (
      id_empresa, id_filial, nome_aluno, email_aluno, telefone_aluno, cpf_aluno, plano_aluno, matricula_aluno, token_aluno, status_aluno, situacao
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`;
    const values = [
      id_empresa,
      id_filial,
      nome_aluno,
      email_aluno,
      telefone_aluno,
      cpf_aluno,
      plano_aluno,
      matricula_aluno,
      token_aluno || null,
      (status_aluno = true),
      situacao || "regular",
    ];
    const { rows } = await db.query(query, values);
    return res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ error: "CPF ou matrícula já cadastrados." });
    }
    return res
      .status(500)
      .json({ error: "Erro ao cadastrar aluno.", details: error.message });
  }
};

module.exports = { cadastrarAluno };
