"use client";

import Button from "@/components/Forms/Button";
import Input from "@/components/Forms/Input";
import InputSelectComponent from "@/components/Forms/InputSelect";
import { useAuth } from "@/contexts/AuthContext";
import { GetForm } from "@/utils";
import { ChevronRight, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import * as yup from "yup";

const CadastrarUsuarios = ({ ...rest }: any) => {
  // Centralizar controle dos campos no form handler
  const formRef = useRef<any>(null);
  const { token } = useAuth();

  const schema = yup.object().shape({
    nome: yup.string().required("Preencha o nome!"),
    email: yup.string().email("Email inválido!").required("Preencha o email!"),
    senha: yup
      .string()
      .min(6, "Mínimo 6 caracteres!")
      .required("Preencha a senha!"),
    perfil: yup.string().required("Selecione o perfil!"),
    filial: yup.string().required("Selecione a filial!"),
  });

  const { handleSubmit, ...form } = GetForm(schema);
  formRef.current = form;

  const onSubmitFunction = async (values: any) => {
    const usuario = {
      nome_usuario: values.nome,
      email_usuario: values.email,
      senha_usuario: values.senha,
      id_perfil: values.perfil,
      id_filial: values.filial,
    };
    try {
      const res = await fetch(
        "http://localhost:5000/usuarios/cadastrar-usuario",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(usuario),
        }
      );
      let data = null;
      try {
        data = await res.json();
      } catch (e) {
        data = {};
      }
      if (res.ok) {
        Swal.fire({
          icon: "success",
          text: data?.message || "Usuário cadastrado com sucesso!",
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
        form.reset();
      } else {
        Swal.fire({
          icon: "error",
          text: data?.message || "Erro ao cadastrar usuário.",
          timer: 2500,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        text: err?.message || "Erro ao conectar ao servidor.",
        timer: 2500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    }
  };

  // Opções dinâmicas de perfil e filial
  const [opcaoPerfil, setOpcaoPerfil] = useState([]);
  const [opcaoFilial, setOpcaoFilial] = useState([]);

  useEffect(() => {
    async function fetchOpcoes() {
      try {
        // Buscar perfis
        const resPerfil = await fetch(
          "http://localhost:5000/empresas/listar-perfis",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (resPerfil.ok) {
          const dataPerfil = await resPerfil.json();
          setOpcaoPerfil(
            (dataPerfil || []).map((p: any) => ({
              value: p.id_perfil ?? p.id,
              label: p.nome_perfil ?? p.nome,
            }))
          );
        }
        // Buscar filiais
        const resFilial = await fetch(
          "http://localhost:5000/empresas/listar-filiais",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (resFilial.ok) {
          const dataFilial = await resFilial.json();
          setOpcaoFilial(
            (dataFilial || []).map((f: any) => ({
              value: f.id_filial ?? f.id,
              label: f.nome_filial ?? f.nome,
            }))
          );
        }
      } catch (err) {
        // Silenciar erro, pode exibir alerta se desejar
      }
    }
    fetchOpcoes();
  }, []);

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-8">
      <div className="w-full max-w-none bg-white p-6 rounded-lg shadow-md sm:p-10">
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <span className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
            Configurações
          </span>
          <ChevronRight className="mx-2 h-4 w-4" />
          <span className="font-medium text-primary">Cadastro de Usuário</span>
        </div>

        <form
          onSubmit={handleSubmit(onSubmitFunction)}
          {...rest}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome"
              name="nome"
              required
              error="Preencha esse campo!"
              formulario={form}
              width="w-full"
            />
            <Input
              label="Email"
              name="email"
              type="email"
              error="Preencha esse campo!"
              required
              formulario={form}
              width="w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Senha"
              name="senha"
              required
              error="Preencha esse campo!"
              formulario={form}
              width="w-full"
              type="password"
            />
            <InputSelectComponent
              label="Filial"
              name="filial"
              required
              error="Preencha esse campo!"
              formulario={form}
              options={opcaoFilial}
              width="w-full"
            />
            <InputSelectComponent
              label="Perfil"
              name="perfil"
              required
              error="Preencha esse campo!"
              formulario={form}
              options={opcaoPerfil}
              width="w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:flex sm:justify-end sm:space-x-4 gap-2 sm:pt-4">
            <Button
              className="p-2 w-full sm:w-[150px] bg-green-600 cursor-pointer hover:bg-green-700 text-white hover:text-white"
              type="submit"
            >
              <Save size={18} className="inline-block mr-2" />
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CadastrarUsuarios;
