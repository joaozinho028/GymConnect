"use client";

import { useAuth } from "@/contexts/AuthContext";
import logoCr from "@/public/image/login.png";
import Image from "next/image";
import { FormEvent, useRef, useState } from "react";
import Swal from "sweetalert2";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const inputUserRef = useRef<HTMLInputElement>(null);
  const inputPasswordRef = useRef<HTMLInputElement>(null);
  const btnLoginRef = useRef<HTMLButtonElement>(null);

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
    <div className="flex w-screen min-h-screen justify-center items-center bg-gray-100">
      <div className="bg-white w-full max-w-xl md:max-w-6xl h-auto md:h-[85vh] rounded-xl flex flex-col md:flex-row shadow-2xl overflow-hidden">
        {/* Coluna esquerda: formulário */}
        <div className="w-full md:w-1/2 h-full px-4 sm:px-8 py-8 flex justify-center items-center bg-gray-50">
          <div className="w-full max-w-md">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-800">
              Bem-vindo
            </h2>
            <p className="text-base md:text-lg text-center text-gray-500 mb-6">
              Faça login para acessar o sistema
            </p>

            <form onSubmit={handleLogar} className="flex flex-col w-full">
              <label className="mb-2 text-sm font-medium text-gray-700">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                ref={inputUserRef}
                className="mb-4 p-3 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-[#222222]"
                required
              />

              <label className="mb-2 text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                ref={inputPasswordRef}
                className="mb-4 p-3 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-[#222222]"
                required
              />

              <div className="text-right mb-4">
                <a
                  href="/esqueci-senha"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Esqueceu a senha?
                </a>
              </div>
              <button
                type="submit"
                disabled={loading}
                ref={btnLoginRef}
                className="w-full mt-5 h-12 text-lg md:text-xl font-bold text-black rounded-lg hover:brightness-110 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: "#64FA36",
                  borderColor: "#64FA36",
                  cursor: "pointer",
                }}
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>
        </div>
        {/* Coluna direita: imagem só aparece em md+ */}
        <div className="hidden md:block md:w-1/2 h-full bg-white">
          <Image
            className="h-full w-full object-cover rounded-e-xl"
            src={logoCr}
            alt="Login visual"
          />
        </div>
      </div>
    </div>
  );
}
