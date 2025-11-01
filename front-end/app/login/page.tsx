"use client";

import { useAuth } from "@/contexts/AuthContext";
import logoCr from "@/public/image/banner.png";
import Image from "next/image";
import { FormEvent, useRef, useState } from "react";
import Swal from "sweetalert2";
import { ArrowLeft, ArrowRight, XCircle, CheckCircle } from "lucide-react";
import { validarCPF, validarSenha, validarSomenteLetras } from "@/utils/validadores";
import { mascaraCPF, mascaraCNPJ } from "@/utils/mascaras";

function mascaraSomenteLetras(valor: string) {
  return valor.replace(/[^A-Za-zÀ-ÿ\s]/g, "");
}

export default function LoginCadastro() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const inputUserRef = useRef<HTMLInputElement>(null);
  const inputPasswordRef = useRef<HTMLInputElement>(null);
  const btnLoginRef = useRef<HTMLButtonElement>(null);
  const [showCadastro, setShowCadastro] = useState(false);

  // Cadastro states
  const planos = [
    {
      id: 1,
      nome: "Básico",
      descricao: "Até 5 academias",
      opcoes: [
        { tipo: "Mensal", preco: "R$ 199,90" },
        { tipo: "Semestral", preco: "R$ 179,90" },
        { tipo: "Anual", preco: "R$ 159,90" },
      ],
    },
    {
      id: 2,
      nome: "Intermediário",
      descricao: "Até 10 academias",
      opcoes: [
        { tipo: "Mensal", preco: "R$ 259,00" },
        { tipo: "Semestral", preco: "R$ 239,00" },
        { tipo: "Anual", preco: "R$ 219,00" },
      ],
    },
    {
      id: 3,
      nome: "Avançado",
      descricao: "10 ou mais academias",
      opcoes: [
        { tipo: "Mensal", preco: "R$ 299,00" },
        { tipo: "Semestral", preco: "R$ 279,00" },
        { tipo: "Anual", preco: "R$ 249,00" },
      ],
    },
  ];
  const [step, setStep] = useState(1);
  const [planoEscolhido, setPlanoEscolhido] = useState<number | null>(null);
  const [periodicidade, setPeriodicidade] = useState<string>("Mensal");
  const [empresa, setEmpresa] = useState({ nome: "", cnpj: "" });
  const [usuario, setUsuario] = useState({ nome: "", email: "", senha: "", confirmacao: "" });

  // Validador de senha forte
function validarSenhaForte(senha: string) {
  return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{6,}$/.test(senha);
}
const [showSenha, setShowSenha] = useState(false);
const [showConfirmacao, setShowConfirmacao] = useState(false);
const [erroSenha, setErroSenha] = useState("");

  function handleEscolherPlano(id: number) {
    setPlanoEscolhido(id);
    setTimeout(() => setStep(2), 400);
  }
  function handleEmpresaSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!empresa.nome || !empresa.cnpj) {
      Swal.fire({ icon: "warning", text: "Preencha todos os campos da empresa.", timer: 2000, showConfirmButton: false, toast: true, position: "top-end" });
      return;
    }
    if (!validarSomenteLetras(empresa.nome)) {
      Swal.fire({ icon: "error", text: "O nome da empresa deve conter apenas letras.", timer: 2000, showConfirmButton: false, toast: true, position: "top-end" });
      return;
    }
    if (!validarCPF(empresa.cnpj)) {
      Swal.fire({ icon: "error", text: "CNPJ inválido.", timer: 2000, showConfirmButton: false, toast: true, position: "top-end" });
      return;
    }
    setStep(3);
  }
  async function handleUsuarioSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!usuario.nome || !usuario.email || !usuario.senha || !usuario.confirmacao) {
      Swal.fire({ icon: "warning", text: "Preencha todos os campos do usuário.", timer: 2000, showConfirmButton: false, toast: true, position: "top-end" });
      return;
    }
    if (!validarSomenteLetras(usuario.nome)) {
      Swal.fire({ icon: "error", text: "O nome do usuário deve conter apenas letras.", timer: 2000, showConfirmButton: false, toast: true, position: "top-end" });
      return;
    }
    if (!validarSenhaForte(usuario.senha)) {
      Swal.fire({ icon: "error", text: "A senha deve ter no mínimo 6 caracteres, incluindo letra, número e caractere especial.", timer: 2000, showConfirmButton: false, toast: true, position: "top-end" });
      return;
    }
    if (usuario.senha !== usuario.confirmacao) {
      Swal.fire({ icon: "error", text: "As senhas não conferem.", timer: 2000, showConfirmButton: false, toast: true, position: "top-end" });
      return;
    }
    try {
      // 1. Criar empresa
      const planoSelecionado = planos.find(p => p.id === planoEscolhido)?.nome || "";
      const resEmpresa = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/empresas/criar-empresa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_empresa: empresa.nome,
          cnpj_empresa: empresa.cnpj,
          plano_saas: planoSelecionado,
        })
      });
      const empresaData = await resEmpresa.json();
      if (!resEmpresa.ok || !empresaData.empresa?.id_empresa) {
        Swal.fire({ icon: "error", text: empresaData.message || "Erro ao cadastrar empresa." });
        return;
      }
      const id_empresa = empresaData.empresa.id_empresa;
      // 2. Criar perfil administrador
  const resPerfil = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/perfis/criar-administrador`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_empresa })
      });
      const perfilData = await resPerfil.json();
      if (!resPerfil.ok || !perfilData.perfil?.id_perfil) {
        Swal.fire({ icon: "error", text: perfilData.message || "Erro ao cadastrar perfil administrador." });
        return;
      }
      const id_perfil = perfilData.perfil.id_perfil;
      // 3. Criar usuário
      const resUsuario = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/cadastrar-usuario-publico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_usuario: usuario.nome,
          email_usuario: usuario.email,
          senha_usuario: usuario.senha,
          id_empresa,
          id_perfil,
        })
      });
      const usuarioData = await resUsuario.json();
      if (!resUsuario.ok || !usuarioData.user?.id_usuario) {
        Swal.fire({ icon: "error", text: usuarioData.message || "Erro ao cadastrar usuário." });
        return;
      }
      Swal.fire({ icon: "success", text: "Conta criada com sucesso!", timer: 2000, showConfirmButton: false, toast: true, position: "top-end" });
      setShowCadastro(false);
      setStep(1);
      setPlanoEscolhido(null);
      setEmpresa({ nome: "", cnpj: "" });
      setUsuario({ nome: "", email: "", senha: "", confirmacao: "" });
    } catch (err) {
      Swal.fire({ icon: "error", text: "Erro ao cadastrar. Tente novamente." });
    }
  }

  async function handleLogar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !senha) {
      Swal.fire({
        icon: "warning",
        text: "Preencha todos os campos.",
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
      inputUserRef.current?.focus();
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();
      if (res.status === 200) {
        Swal.fire({
          icon: "success",
          text: "Aguarde, você será redirecionado!",
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
        login(data.token, data.user);
      } else if (res.status === 401) {
        Swal.fire({
          icon: "error",
          text: data.message || "Email ou senha incorretos.",
          timer: 2500,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      } else if (res.status === 500) {
        Swal.fire({
          icon: "error",
          text: data.message || "Tente novamente mais tarde.",
          timer: 2500,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      } else {
        Swal.fire({
          icon: "error",
          text: data.error || "Ocorreu um erro inesperado.",
          timer: 2500,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        text: "Não foi possível conectar ao servidor.",
        timer: 2500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-screen min-h-screen justify-center items-center bg-[#F7F7F7]">
  <div className="bg-white w-full max-w-3xl md:max-w-5xl h-[700px] md:h-[700px] rounded-2xl flex flex-col md:flex-row shadow-xl overflow-hidden border border-[#eee] p-0">
  <div className="w-full md:w-1/2 h-full px-10 py-16 flex flex-col justify-center items-center">
      <div className="w-full animate-fadein">
        {!showCadastro ? (
          <>
            <h2 className="text-3xl font-bold text-center text-black mb-2">Bem-vindo!</h2>
            <p className="text-center text-gray-500 mb-8 text-base">Acesse sua conta para continuar</p>
            <form onSubmit={handleLogar} className="flex flex-col gap-5 w-full">
              <div>
                <label className="block mb-2 text-sm font-semibold text-black">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  ref={inputUserRef}
                  className="w-full px-4 py-3 border border-[#e5e5e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#65F938] text-black bg-[#FAFAFA] placeholder:text-gray-400"
                  required
                  placeholder="Digite seu e-mail"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-black">Senha</label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  ref={inputPasswordRef}
                  className="w-full px-4 py-3 border border-[#e5e5e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#65F938] text-black bg-[#FAFAFA] placeholder:text-gray-400"
                  required
                  placeholder="Digite sua senha"
                />
              </div>
              <div className="flex justify-between items-center mt-2 mb-2">
                <button type="button" className="text-sm text-gray-500 cursor-pointer hover:underline font-semibold" onClick={() => setShowCadastro(true)}>
                  Criar uma conta
                </button>
                <a href="/esqueci-senha" className="text-sm text-gray-500 hover:underline">Esqueceu a senha?</a>
              </div>
              <button
                type="submit"
                disabled={loading}
                ref={btnLoginRef}
                className="w-full h-12 text-lg font-bold text-black rounded-lg transition-all duration-200 shadow-sm hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#65F938] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#65F938', border: 'none', cursor: 'pointer' }}
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="flex justify-center gap-2 mb-6">
              {[1,2,3].map((s) => (
                <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-200`} style={{borderColor: step === s ? '#65F938' : '#e5e5e5', backgroundColor: step === s ? '#65F938' : step > s ? '#65F93822' : '#fff', color: step === s ? '#fff' : step > s ? '#222' : '#65F93899', boxShadow: step === s ? '0 2px 8px #65F93844' : undefined}}>{s}</div>
              ))}
            </div>
            <div className="mb-4 text-center text-black font-medium text-base">
              {step === 1 && "Escolha o plano ideal para sua empresa."}
              {step === 2 && "Preencha os dados da sua empresa."}
              {step === 3 && "Crie seu usuário de acesso ao sistema."}
            </div>
            {step === 1 && (
              <>
                <div className="flex justify-center gap-2 mb-4">
                  {["Mensal", "Semestral", "Anual"].map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      className={`px-4 py-2 rounded-lg font-semibold border transition-all duration-200 text-sm`}
                      style={{backgroundColor: periodicidade === tipo ? '#65F938' : '#fff', color: periodicidade === tipo ? '#fff' : '#65F938', borderColor: '#e5e5e5', boxShadow: periodicidade === tipo ? '0 2px 8px #65F93844' : undefined}}
                      onClick={() => setPeriodicidade(tipo)}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-4">
                  {planos.map((plano) => {
                    const opcao = plano.opcoes.find(o => o.tipo === periodicidade);
                    return (
                      <button
                        key={plano.id}
                        className={`border rounded-xl p-4 text-left transition-all duration-200 shadow-sm`}
                        style={{borderColor: planoEscolhido === plano.id ? '#65F938' : '#e5e5e5', backgroundColor: planoEscolhido === plano.id ? '#65F93822' : '#fff', boxShadow: planoEscolhido === plano.id ? '0 0 0 2px #65F93833' : undefined}}
                        onClick={() => handleEscolherPlano(plano.id)}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-lg">{plano.nome}</span>
                          <span className="text-gray-500 font-medium text-sm">{plano.descricao}</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <span className="px-2 py-1 rounded text-xs font-semibold border" style={{backgroundColor: '#65F93822', color: '#222', borderColor: '#e5e5e5'}}>
                            {opcao?.tipo}: {opcao?.preco}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <form onSubmit={handleEmpresaSubmit} className="flex flex-col gap-4 mt-2">
                  <label className="text-sm font-medium text-black">Nome da empresa</label>
                  <input
                    type="text"
                    value={empresa.nome}
                    onChange={e => setEmpresa({ ...empresa, nome: mascaraSomenteLetras(e.target.value) })}
                    className="p-3 border rounded-lg w-full focus:outline-none text-black bg-[#FAFAFA] placeholder:text-gray-400"
                    required
                    placeholder="Ex: Academia PowerFit"
                  />
                  <label className="text-sm font-medium text-black">CNPJ</label>
                  <input
                    type="text"
                    value={empresa.cnpj}
                    onChange={e => setEmpresa({ ...empresa, cnpj: mascaraCNPJ(e.target.value) })}
                    className="p-3 border rounded-lg w-full focus:outline-none text-black bg-[#FAFAFA] placeholder:text-gray-400"
                    required
                    placeholder="Ex: 00.000.000/0001-00"
                  />
                  <div className="text-black text-sm">Plano: <span className="font-bold text-black">{planos.find(p => p.id === planoEscolhido)?.nome} - {periodicidade}</span></div>
                  <div className="flex justify-between mt-2">
                    <button type="button" className="text-sm text-gray-600 cursor-pointer font-bold flex items-center" onClick={() => setStep(1)}>
                      <ArrowLeft size={16} className="inline mr-1" color="#6B7280" /> Passo anterior
                    </button>
                    <button type="button" className="text-sm text-gray-600 cursor-pointer font-bold flex items-center" onClick={() => setStep(3)}>
                      Próximo <ArrowRight size={16} className="inline ml-1" color="#6B7280" />
                    </button>
                  </div>
                </form>
              </>
            )}
            {step === 3 && (
              <>
                <form onSubmit={handleUsuarioSubmit} className="flex flex-col gap-4 mt-2">
                  <label className="text-sm font-medium text-black">Nome</label>
                  <input
                    type="text"
                    value={usuario.nome}
                    onChange={e => setUsuario({ ...usuario, nome: mascaraSomenteLetras(e.target.value) })}
                    className="p-3 border rounded-lg w-full focus:outline-none text-black bg-[#FAFAFA] placeholder:text-gray-400"
                    required
                    placeholder="Seu nome completo"
                  />
                  <label className="text-sm font-medium text-black">E-mail</label>
                  <input
                    type="email"
                    value={usuario.email}
                    onChange={e => setUsuario({ ...usuario, email: e.target.value })}
                    className="p-3 border rounded-lg w-full focus:outline-none text-black bg-[#FAFAFA] placeholder:text-gray-400"
                    required
                    placeholder="seu@email.com"
                  />
                  <label className="text-sm font-medium text-black">Senha</label>
                  <input
                    type="password"
                    value={usuario.senha}
                    onChange={e => setUsuario({ ...usuario, senha: e.target.value })}
                    className="p-3 border rounded-lg w-full focus:outline-none text-black bg-[#FAFAFA] placeholder:text-gray-400"
                    style={{borderColor: '#65F938', boxShadow: '0 0 0 2px #65F93833'}}
                    required
                    placeholder="Crie uma senha segura"
                  />
                  <label className="text-sm font-medium text-black">Confirmação de senha</label>
                  <input
                    type="password"
                    value={usuario.confirmacao}
                    onChange={e => setUsuario({ ...usuario, confirmacao: e.target.value })}
                    className="p-3 border rounded-lg w-full focus:outline-none text-black bg-[#FAFAFA] placeholder:text-gray-400"
                    style={{borderColor: '#65F938', boxShadow: '0 0 0 2px #65F93833'}}
                    required
                    placeholder="Repita a senha"
                  />
                  <div className="flex justify-between mt-2">
                    <button type="button" className="text-sm text-gray-600 cursor-pointer font-bold flex items-center" onClick={() => setStep(2)}>
                      <ArrowLeft size={16} className="inline mr-1" color="#6B7280" /> Passo anterior
                    </button>
                    <button type="submit" className="text-sm text-gray-600 cursor-pointer font-bold flex items-center">
                      Finalizar <CheckCircle size={16} className="inline ml-1" color="#6B7280" />
                    </button>
                  </div>
                </form>
              </>
            )}
            <div className="mt-6 text-center text-xs text-gray-600">Passo {step} de 3</div>
            <div className="text-center mt-4">
              <button type="button" className="underline font-bold cursor-pointer text-gray-600" onClick={() => setShowCadastro(false)}>
                <ArrowLeft size={16} className="inline mr-1 cursor-pointer" color="#6B7280" /> Voltar para login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
        <div className="hidden md:block md:w-1/2 h-full bg-white">
          <Image className="h-full w-full object-cover rounded-e-xl" src={logoCr} alt="Login visual" style={{minHeight: '700px', minWidth: '100%'}} />
        </div>
      </div>
    </div>
  );
}
