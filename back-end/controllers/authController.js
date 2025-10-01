const supabase = require("../db"); // conexão para queries no banco
const { createClient } = require("@supabase/supabase-js");
const supabaseStorage = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
); // para o Storage

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    const { data: userData, error: userError } = await supabase
      .from("usuarios")
      .select(
        "id_usuario, nome_usuario, id_empresa, email_usuario, senha_usuario, id_filial, id_perfil, status_usuario"
      )
      .eq("email_usuario", email)
      .single();

    if (userError || !userData) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    // Verificar se o usuário está ativo
    if (!userData.status_usuario) {
      return res.status(401).json({
        message: "Usuário inativo, sem permissão para acessar o sistema!",
      });
    }

    const senhaValida = await bcrypt.compare(senha, userData.senha_usuario);
    if (!senhaValida) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const { data: perfilData, error: perfilError } = await supabase
      .from("perfis")
      .select("permissoes_perfil, status_perfil")
      .eq("id_perfil", userData.id_perfil)
      .single();

    console.log("🔍 Dados do perfil encontrados:", perfilData);

    if (perfilError) {
      console.error("Erro ao buscar permissões do perfil:", perfilError);
      return res
        .status(500)
        .json({ message: "Erro ao buscar permissões do perfil" });
    }

    // Verificar se o perfil está ativo
    if (!perfilData.status_perfil) {
      return res.status(401).json({
        message:
          "Perfil de acesso inativo. Entre em contato com o administrador.",
      });
    }

    const permissoes = perfilData?.permissoes_perfil || {
      alunos: true,
      filiais: true,
      fluxo_caixa: false,
      importacao: false,
      exportacao: false,
      configuracoes: {
        informacoes_bancarias: false,
        plano_gym_connect: false,
        configuracoes_app: false,
        historico_usuario: false,
        usuarios: true,
        perfis: true,
      },
    };

    const token = jwt.sign(
      {
        id_usuario: userData.id_usuario,
        id_empresa: userData.id_empresa,
        id_filial: userData.id_filial,
        id_perfil: userData.id_perfil,
        nome_usuario: userData.nome_usuario,
        email_usuario: userData.email_usuario,
        permissoes: permissoes,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        id_usuario: userData.id_usuario,
        nome_usuario: userData.nome_usuario,
        id_empresa: userData.id_empresa,
        id_filial: userData.id_filial,
        id_perfil: userData.id_perfil,
        email_usuario: userData.email_usuario,
        permissoes: permissoes,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no servidor" });
  }
};

const getProfile = async (req, res) => {
  try {
    console.log("Dados recebidos no req.user:", req.user);
    const { id_usuario } = req.user;

    // Query com join para trazer usuário, empresa, filial e perfil
    const { data, error } = await supabase
      .from("usuarios")
      .select(
        `
        id_usuario,
        nome_usuario,
        email_usuario,
        avatar_url,
        perfil:perfis (id_perfil, nome_perfil),
        empresa:empresas (id_empresa, nome_empresa, cnpj_empresa),
        filial:filiais (id_filial, nome_filial, endereco)
      `
      )
      .eq("id_usuario", id_usuario)
      .single();

    if (error || !data) {
      return res
        .status(404)
        .json({ message: "Usuário/Empresa/Filial/Perfil não encontrado(s)" });
    }

    // Ajustar resposta para manter compatibilidade
    const { empresa, filial, perfil, ...usuario } = data;
    res.json({ usuario, empresa, filial, perfil });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao buscar perfil" });
  }
};

// Função para validar força da senha
function validarSenhaForte(senha) {
  // Mínimo 6 caracteres, pelo menos 1 letra, 1 número e 1 caractere especial
  const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{6,}$/;
  return regex.test(senha);
}

const alterarSenha = async (req, res) => {
  try {
    const { senhaAtual, senhaNova } = req.body;
    const { id_usuario } = req.user;

    if (!senhaAtual || !senhaNova) {
      return res.status(400).json({ message: "Preencha todos os campos." });
    }

    if (!validarSenhaForte(senhaNova)) {
      return res.status(400).json({
        message:
          "A senha deve ter no mínimo 6 caracteres, incluindo letra, número e caractere especial.",
      });
    }

    // Buscar usuário
    const { data: usuario, error } = await supabase
      .from("usuarios")
      .select("senha_usuario")
      .eq("id_usuario", id_usuario)
      .single();
    if (error || !usuario) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    // Verificar senha atual
    const senhaCorreta = await bcrypt.compare(
      senhaAtual,
      usuario.senha_usuario
    );
    if (!senhaCorreta) {
      return res.status(401).json({ message: "Senha atual incorreta." });
    }

    // Gerar hash da nova senha
    const hashNovaSenha = await bcrypt.hash(senhaNova, 10);

    // Atualizar senha no banco
    const { error: updateError } = await supabase
      .from("usuarios")
      .update({ senha_usuario: hashNovaSenha })
      .eq("id_usuario", id_usuario);
    if (updateError) {
      return res.status(500).json({ message: "Erro ao atualizar senha." });
    }

    res.json({ message: "Senha alterada com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao alterar senha." });
  }
};

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const uploadAvatar = async (req, res) => {
  try {
    const { id_usuario } = req.user;
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: "Nenhuma imagem enviada." });
    }
    if (req.file.size > MAX_IMAGE_SIZE) {
      return res
        .status(400)
        .json({ message: "Imagem muito grande. Máximo 2MB." });
    }
    const fileExt = req.file.originalname.split(".").pop();
    const filePath = `avatars/${id_usuario}.${fileExt}`;
    // Upload para o bucket 'avatars'
    console.log("Preparando para upload no Supabase Storage:", {
      filePath,
      fileType: req.file.mimetype,
      bufferLength: req.file.buffer.length,
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY ? "***" : undefined,
    });
    const { error: uploadError } = await supabaseStorage.storage
      .from("avatars")
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });
    console.log("Resultado do upload no Supabase Storage:", { uploadError });
    if (uploadError) {
      return res
        .status(500)
        .json({ message: "Erro ao salvar imagem no Storage." });
    }
    // Gerar URL pública
    const { data } = supabaseStorage.storage
      .from("avatars")
      .getPublicUrl(filePath);
    const publicUrl = data.publicUrl;
    // Salvar URL no banco
    const { error: updateError } = await supabase
      .from("usuarios")
      .update({ avatar_url: publicUrl })
      .eq("id_usuario", id_usuario);
    if (updateError) {
      return res.status(500).json({ message: "Erro ao salvar URL no banco." });
    }
    res.json({ message: "Imagem enviada com sucesso!", url: publicUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao enviar imagem." });
  }
};

// Endpoint para buscar avatar
const getAvatar = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("usuarios")
      .select("avatar_blob")
      .eq("id_usuario", id)
      .single();
    if (error || !data || !data.avatar_blob) {
      return res.status(404).send();
    }
    res.setHeader("Content-Type", "image/png");
    res.send(Buffer.from(data.avatar_blob));
  } catch (err) {
    res.status(500).send();
  }
};

module.exports = { login, getProfile, alterarSenha, uploadAvatar, getAvatar };
