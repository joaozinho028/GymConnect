require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");

const usuarioRoutes = require("./routes/usuario");
const perfilRoutes = require("./routes/perfil");
const empresaRoutes = require("./routes/empresa");
const alunoRoutes = require("./routes/aluno");
const supabase = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/usuarios", usuarioRoutes);
app.use("/perfis", perfilRoutes);
app.use("/empresas", empresaRoutes);
app.use("/alunos", alunoRoutes);
app.get("/", (req, res) => {
  res.send("API está rodando.");
});

app.get("/test-supabase", async (req, res) => {
  const { data, error } = await supabase.from("empresas").select("*").limit(1);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json({ data });
});

// const PORT = process.env.PORT;
const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
