"use client";
import Button from "@/components/Forms/Button";
import Input from "@/components/Forms/Input";
import InputSelectComponent from "@/components/Forms/InputSelect";
import { useAuth } from "@/contexts/AuthContext";
import { GetForm } from "@/utils";
import { ChevronRight, Save } from "lucide-react";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import * as yup from "yup";

const CadastrarAluno = ({ ...rest }: any) => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [plano, setPlano] = useState("");
  const [opcoesPlano, setOpcoesPlano] = useState<any[]>([]);
  const { token, user } = useAuth();
  // Removido pagamento/Asaas
  const [yupSchema, setYupSchema] = useState<
    yup.ObjectSchema<{}, yup.AnyObject, {}, "">
  >(yup.object().shape({}));
  const { handleSubmit, setValue, ...form } = GetForm(yupSchema, setYupSchema);

  const formWithSetValue = { ...form, setValue };

  // Função para limpar formulário
  const limparFormulario = () => {
  setNome("");
  setEmail("");
  setTelefone("");
  setCpf("");
  setPlano("");
  setValue("plano", null);
  };

  useEffect(() => {
    async function fetchPlanos() {
      try {
        const resPlanos = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/empresas/listar-planos`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (resPlanos.ok) {
          const dataPlanos = await resPlanos.json();
          setOpcoesPlano(
            (dataPlanos || []).map((f: any) => ({
              value: f.ciclo_pagamento_plano, // <-- ciclo, não id!
              label: f.ciclo_pagamento_plano,
            }))
          );
        }
      } catch {}
    }
    fetchPlanos();
  }, [token]);

  // Cadastro simples de aluno
  const onSubmitFunction = async () => {
    const formValues = form.getValues();
    const planoValue = (formValues as any).plano?.value || plano;

    const aluno = {
      nome_aluno: nome,
      email_aluno: email,
      telefone_aluno: telefone,
      cpf_aluno: cpf,
      plano_aluno: planoValue,
      id_empresa: user?.id_empresa,
      id_filial: user?.id_filial,
      situacao: "regular",
      status_aluno: true
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/alunos/cadastrar-alunos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(aluno),
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Cadastro realizado!",
          text: "Aluno cadastrado com sucesso.",
        });
        limparFormulario();
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text: data?.error || "Erro ao cadastrar aluno.",
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Erro!",
        text: err?.message || "Erro ao conectar ao servidor.",
      });
    }
  };

  // Removido confirmação de pagamento

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-8">
      <div className="w-full max-w-none bg-white p-6 rounded-lg shadow-md sm:p-10">
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <span className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
            Página Inicial
          </span>
          <ChevronRight className="mx-2 h-4 w-4" />
          <span className="font-medium text-primary">Cadastro de Aluno</span>
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
              formulario={formWithSetValue}
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
              formulario={formWithSetValue}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              width="w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Telefone"
              name="telefone"
              required
              error="Preencha esse campo!"
              mascara="telefone"
              formulario={formWithSetValue}
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              width="w-full"
            />
            <Input
              label="CPF"
              name="cpf"
              required
              error="Preencha esse campo!"
              mascara="cpf"
              formulario={formWithSetValue}
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              width="w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
            <InputSelectComponent
              label="Plano"
              name="plano"
              required
              error="Preencha esse campo!"
              formulario={formWithSetValue}
              onChange={(selectedOption: any) => {
                const value = selectedOption ? selectedOption.value : "";
                setPlano(value);
                setValue("plano", selectedOption);
              }}
              options={opcoesPlano}
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

export default CadastrarAluno;
