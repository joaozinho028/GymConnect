const express = require('express');
const router = express.Router();
const fileUpload = require('express-fileupload');
const uploadController = require('../controllers/uploadArquivosController');

router.use(fileUpload());

// POST /upload-arquivo
router.post('/', uploadController.uploadArquivo);


// GET /upload-arquivo/listar?id_empresa=...&id_filial=...&id_aluno=...
router.get('/listar', uploadController.listarArquivosAluno);

// DELETE /upload-arquivo/excluir
router.delete('/excluir', uploadController.excluirArquivo);

module.exports = router;
