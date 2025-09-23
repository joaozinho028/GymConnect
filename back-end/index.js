require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const usuarioRoutes = require("./routes/usuario");
const perfilRoutes = require("./routes/perfil");
const empresaRoutes = require("./routes/empresa");
const alunoRoutes = require("./routes/alunos");
const auditoriaRoutes = require("./routes/auditoria");
const supabase = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/usuarios", usuarioRoutes);
app.use("/perfis", perfilRoutes);
app.use("/empresas", empresaRoutes);
app.use("/alunos", alunoRoutes);
app.use("/auditoria", auditoriaRoutes);

// Endpoint para teste de saúde (usado pelo ping)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get("/", (req, res) => {
  res.send("API está rodando.");
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

//SISTEMA ANTI-HIBERNAÇÃO DO RENDER
const fetch = require("node-fetch");

const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://sistema-gym-connect.onrender.com/login";
const BACKEND_URL =
  process.env.BACKEND_URL || "https://gymconnect-txn1.onrender.com/health";

// Função melhorada de ping com timeout e retry
async function ping(url, name) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "GymConnect-KeepAlive/1.0",
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      console.log(
        `✅ Ping ${name} (${url}) - Status: ${
          response.status
        } - ${new Date().toLocaleString("pt-BR")}`
      );
    } else {
      console.log(
        `⚠️ Ping ${name} (${url}) - Status: ${
          response.status
        } - ${new Date().toLocaleString("pt-BR")}`
      );
    }
  } catch (error) {
    if (error.name === "AbortError") {
      console.error(
        `❌ Ping ${name} (${url}) - Timeout após 30s - ${new Date().toLocaleString(
          "pt-BR"
        )}`
      );
    } else {
      console.error(
        `❌ Ping ${name} (${url}) - Erro: ${
          error.message
        } - ${new Date().toLocaleString("pt-BR")}`
      );
    }
  }
}

// Função para executar pings
async function executePings() {
  console.log(
    `🔄 Executando pings anti-hibernação - ${new Date().toLocaleString(
      "pt-BR"
    )}`
  );
  await Promise.all([
    ping(FRONTEND_URL, "Frontend"),
    ping(BACKEND_URL, "Backend"),
  ]);
}

// Só executa se não estiver em desenvolvimento
if (process.env.NODE_ENV !== "development") {
  console.log("🚀 Sistema anti-hibernação ativado para produção");

  // Ping inicial com delay para dar tempo do servidor subir
  setTimeout(() => {
    executePings();
  }, 30000); // 30 segundos após iniciar

  // Ping a cada 10 minutos (600000ms)
  setInterval(executePings, 10 * 60 * 1000);
} else {
  console.log("🔧 Sistema anti-hibernação desativado para desenvolvimento");
}
