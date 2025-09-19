const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const cadastrarAluno = require("../controllers/alunoController");

// Cadastro de aluno
router.post("/cadastrar-aluno", authMiddleware, cadastrarAluno);

module.exports = router;
