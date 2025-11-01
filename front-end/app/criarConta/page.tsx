"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { ArrowLeft, ArrowRight, XCircle, CheckCircle } from "lucide-react";

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

export default function CriarConta() {
  const [step, setStep] = useState(1);
  const [planoEscolhido, setPlanoEscolhido] = useState<number | null>(null);
  const [periodicidade, setPeriodicidade] = useState<string>("Mensal");
  const [pagamentoOk, setPagamentoOk] = useState(false);
  const [empresa, setEmpresa] = useState({ nome: "", cnpj: "" });
  const [usuario, setUsuario] = useState({ nome: "", email: "", senha: "", confirmacao: "" });

  // Step 1: Escolher plano
  function handleEscolherPlano(id: number) {
    setPlanoEscolhido(id);
    setTimeout(() => setStep(2), 500); // Simula validação
  }

  // Step 2: Pagamento (fake)
  function handlePagamentoFake() {
    setPagamentoOk(true);
    setTimeout(() => setStep(3), 500); // Simula validação
  }

  // Step 3: Empresa
  function handleEmpresaSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!empresa.nome || !empresa.cnpj) {
      Swal.fire({ icon: "warning", text: "Preencha todos os campos da empresa.", timer: 2000, showConfirmButton: false, toast: true, position: "top-end" });
      return;
    }
    setStep(4);
  }

  // Step 4: Usuário
  function handleUsuarioSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!usuario.nome || !usuario.email || !usuario.senha || !usuario.confirmacao) {
      Swal.fire({ icon: "warning", text: "Preencha todos os campos do usuário.", timer: 2000, showConfirmButton: false, toast: true, position: "top-end" });
      return;
    }
    if (usuario.senha !== usuario.confirmacao) {
      Swal.fire({ icon: "error", text: "As senhas não conferem.", timer: 2000, showConfirmButton: false, toast: true, position: "top-end" });
      return;
    }
    Swal.fire({ icon: "success", text: "Conta criada com sucesso!", timer: 2000, showConfirmButton: false, toast: true, position: "top-end" });
    // Aqui pode redirecionar ou limpar o formulário
  }

  return (
    <div className="flex w-screen min-h-screen justify-center items-center bg-gradient-to-br from-green-50 via-white to-green-100">
      <div className="bg-white w-full max-w-xl h-auto rounded-xl flex flex-col shadow-2xl overflow-hidden border border-green-200">
        <div className="w-full h-full px-4 sm:px-8 py-8 flex justify-center items-center bg-green-50">
          <div className="w-full max-w-md animate-fadein">
            <h2 className="text-3xl font-bold text-center text-green-700 mb-2 tracking-tight">Crie sua conta</h2>
            <p className="text-center text-green-600 mb-4 text-base">Comece agora em poucos passos!</p>
            <div className="flex justify-center gap-2 mb-6">
              {[1,2,3,4].map((s) => (
                <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-200 ${step === s ? "border-green-500 bg-green-600 text-white shadow-lg" : step > s ? "border-green-400 bg-green-100 text-green-700" : "border-green-300 bg-white text-green-400"}`}>{s}</div>
              ))}
            </div>
            {/* Instrução por etapa */}
            <div className="mb-4 text-center text-green-600 font-medium text-base">
              {step === 1 && "Escolha o plano ideal para sua empresa."}
              {step === 2 && "Simule o pagamento para continuar."}
              {step === 3 && "Preencha os dados da sua empresa."}
              {step === 4 && "Crie seu usuário de acesso ao sistema."}
            </div>
            {/* ...existing code... */}
            {step === 1 && (
              <>
                <div className="flex justify-center gap-2 mb-4">
                  {["Mensal", "Semestral", "Anual"].map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      className={`px-4 py-2 rounded font-semibold border transition-all duration-200 text-sm ${periodicidade === tipo ? "bg-green-600 text-white border-green-600" : "bg-white text-green-600 border-green-200 hover:bg-green-50"}`}
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
                        className={`border rounded-lg p-4 text-left transition-all duration-200 shadow-sm ${planoEscolhido === plano.id ? "border-green-500 bg-green-100 ring-2 ring-green-300" : "border-green-300 bg-white hover:bg-green-50"}`}
                        onClick={() => handleEscolherPlano(plano.id)}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-lg">{plano.nome}</span>
                          <span className="text-gray-500 font-medium text-sm">{plano.descricao}</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-semibold border border-green-100">
                            {opcao?.tipo}: {opcao?.preco}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {/* ...existing code... */}
              </>
            )}
            {step === 2 && (
              <>
                <div className="flex flex-col gap-4 items-center">
                  <div className="text-green-700 mb-2">
                    Plano escolhido: <span className="font-bold text-green-700">{planos.find(p => p.id === planoEscolhido)?.nome} - {periodicidade}</span>
                  </div>
                  <button
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold text-lg shadow hover:bg-green-700 transition-all duration-200"
                    onClick={handlePagamentoFake}
                  >
                    <CheckCircle size={20} className="inline mr-2" /> Simular pagamento
                  </button>
                </div>
                {/* ...existing code... */}
              </>
            )}
            {step === 3 && (
              <form onSubmit={handleEmpresaSubmit} className="flex flex-col gap-4 mt-2">
                <label className="text-sm font-medium text-green-700">Nome da empresa</label>
                <input
                  type="text"
                  value={empresa.nome}
                  onChange={e => setEmpresa({ ...empresa, nome: e.target.value })}
                  className="p-3 border border-green-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-400"
                  required
                  placeholder="Ex: Academia PowerFit"
                />
                <label className="text-sm font-medium text-green-700">CNPJ</label>
                <input
                  type="text"
                  value={empresa.cnpj}
                  onChange={e => setEmpresa({ ...empresa, cnpj: e.target.value })}
                  className="p-3 border border-green-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-400"
                  required
                  placeholder="Ex: 00.000.000/0001-00"
                />
                <div className="text-green-700 text-sm">Plano: <span className="font-bold text-green-700">{planos.find(p => p.id === planoEscolhido)?.nome} - {periodicidade}</span></div>
                {/* ...existing code... */}
              </form>
            )}
            {step === 4 && (
              <form onSubmit={handleUsuarioSubmit} className="flex flex-col gap-4 mt-2">
                <label className="text-sm font-medium text-green-700">Nome</label>
                <input
                  type="text"
                  value={usuario.nome}
                  onChange={e => setUsuario({ ...usuario, nome: e.target.value })}
                  className="p-3 border border-green-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-400"
                  required
                  placeholder="Seu nome completo"
                />
                <label className="text-sm font-medium text-green-700">E-mail</label>
                <input
                  type="email"
                  value={usuario.email}
                  onChange={e => setUsuario({ ...usuario, email: e.target.value })}
                  className="p-3 border border-green-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-400"
                  required
                  placeholder="seu@email.com"
                />
                <label className="text-sm font-medium text-green-700">Senha</label>
                <input
                  type="password"
                  value={usuario.senha}
                  onChange={e => setUsuario({ ...usuario, senha: e.target.value })}
                  className="p-3 border border-green-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-400"
                  required
                  placeholder="Crie uma senha segura"
                />
                <label className="text-sm font-medium text-green-700">Confirmação de senha</label>
                <input
                  type="password"
                  value={usuario.confirmacao}
                  onChange={e => setUsuario({ ...usuario, confirmacao: e.target.value })}
                  className="p-3 border border-green-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-400"
                  required
                  placeholder="Repita a senha"
                />
                {/* ...existing code... */}
              </form>
            )}
            {/* Feedback de progresso */}
            <div className="mt-6 text-center text-xs text-green-400">
              Passo {step} de 4
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
