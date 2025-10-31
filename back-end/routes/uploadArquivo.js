const express = require("express");
const router = express.Router();
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");

const upload = multer({ storage: multer.memoryStorage() });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY 
);

// POST /api/upload-arquivo
router.post("/", upload.single("file"), async (req, res) => {
  const { id_empresa, id_filial, id_aluno } = req.body;
  const file = req.file;
  if (!file || !id_empresa || !id_filial || !id_aluno) {
    return res.status(400).json({ error: "Dados insuficientes." });
  }
  const filePath = `${id_empresa}/${id_filial}/${id_aluno}/${file.originalname}`;
  try {
    const { error } = await supabase.storage
      .from("alunos-arquivos")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    // Opcional: gerar URL pública
    const { data } = supabase.storage
      .from("alunos-arquivos")
      .getPublicUrl(filePath);
    return res.json({ success: true, url: data.publicUrl });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
