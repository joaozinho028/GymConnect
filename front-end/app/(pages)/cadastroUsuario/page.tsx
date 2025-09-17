"use client";

import Button from "@/components/Forms/Button";
import Input from "@/components/Forms/Input";
import InputSelectComponent from "@/components/Forms/InputSelect";
import { GetForm } from "@/utils";
import { ChevronRight, Save } from "lucide-react";
import { useState } from "react";
import * as yup from "yup";

const CadastrarUsuarios = ({ ...rest }: any) => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState("");
  const [filial, setFilial] = useState("");
  const [yupSchema, setYupSchema] = useState<
    yup.ObjectSchema<{}, yup.AnyObject, {}, "">
  >(yup.object().shape({}));
  const { handleSubmit, ...form } = GetForm(yupSchema, setYupSchema);

  const onSubmitFunction = async () => {
    const aluno = {
      nome,
      email,
      senha,
      perfil,
    };
    console.log("Aluno cadastrado:", aluno);
  };

  const opcaoPerfil = [
    { value: 1, label: "Administrador" },
    { value: 2, label: "Atendimento" },
  ];

  const opcaoFilial = [
    { value: 1, label: "Filial 1" },
    { value: 2, label: "Filial 2" },
  ];

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
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              width="w-full"
            />
            <Input
              label="Email"
              name="email"
              type="email"
              error="Preencha esse campo!"
              required
              formulario={form}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setSenha(e.target.value)}
              width="w-full"
            />
            <InputSelectComponent
              label="Filial"
              name="filial"
              required
              error="Preencha esse campo!"
              formulario={form}
              value={filial}
              onChange={(e) => setFilial(e.target.value)}
              options={opcaoFilial}
              width="w-full"
            />
            <InputSelectComponent
              label="Perfil"
              name="perfil"
              required
              error="Preencha esse campo!"
              formulario={form}
              value={perfil}
              onChange={(e) => setPerfil(e.target.value)}
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
