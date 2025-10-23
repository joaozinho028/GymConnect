require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const usuarioRoutes = require("./routes/usuario");
const perfilRoutes = require("./routes/perfil");
const empresaRoutes = require("./routes/empresa");
const alunoRoutes = require("./routes/alunos");
const auditoriaRoutes = require("./routes/auditoria");
const precificacaoRoutes = require("./routes/precificacao");
const dadosBancariosRoutes = require("./routes/dadosBancarios");
const fluxoCaixaRoutes = require("./routes/fluxoCaixa");
const supabase = require("./db");

const app = express();
app.use(cors());
app.use(express.json()); // <-- já existe

app.use("/auth", authRoutes);
app.use("/usuarios", usuarioRoutes);
app.use("/perfis", perfilRoutes);
app.use("/empresas", empresaRoutes);
app.use("/alunos", alunoRoutes);
app.use("/auditoria", auditoriaRoutes);
app.use("/precificacao", precificacaoRoutes);
app.use("/dadosBancarios", dadosBancariosRoutes);
app.use("/fluxo-caixa", fluxoCaixaRoutes);

app.get("/", (req, res) => {
  res.send("API está rodando.");
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
