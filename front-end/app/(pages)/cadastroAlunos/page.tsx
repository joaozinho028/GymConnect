"use client";
import Button from "@/components/Forms/Button";
import Input from "@/components/Forms/Input";
import InputSelectComponent from "@/components/Forms/InputSelect";
import { useAuth } from "@/contexts/AuthContext";
import { GetForm } from "@/utils";
import { ChevronRight, Save } from "lucide-react";
import { useState } from "react";
import Swal from "sweetalert2";
import * as yup from "yup";

const CadastrarAluno = ({ ...rest }: any) => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [plano, setPlano] = useState("");
  const { token } = useAuth();
  const [formaPagamento, setFormaPagamento] = useState("");
  const [yupSchema, setYupSchema] = useState<
    yup.ObjectSchema<{}, yup.AnyObject, {}, "">
  >(yup.object().shape({}));
  const { handleSubmit, setValue, ...form } = GetForm(yupSchema, setYupSchema);

  // Criar objeto que inclui setValue para os componentes
  const formWithSetValue = { ...form, setValue };

  // Função para limpar formulário
  const limparFormulario = () => {
    setNome("");
    setEmail("");
    setTelefone("");
    setCpf("");
    setPlano("");
    setFormaPagamento("");
    setValue("plano", null);
    setValue("formaPagamento", null);
  };

  const onSubmitFunction = async () => {
    // Obter valores do React Hook Form
    const formValues = form.getValues();

    // Log dos estados atuais antes de criar o objeto
    console.log("Estados atuais:");
    console.log("- nome:", nome);
    console.log("- email:", email);
    console.log("- telefone:", telefone);
    console.log("- cpf:", cpf);
    console.log("- plano:", plano);
    console.log("- formaPagamento:", formaPagamento);
    console.log("- formValues:", formValues);

    // Extrair valores dos objetos do React Hook Form se necessário
    const planoValue = (formValues as any).plano?.value || plano;
    const formaPagamentoValue =
      (formValues as any).formaPagamento?.value || formaPagamento;

    const aluno = {
      nome_aluno: nome,
      email_aluno: email,
      telefone_aluno: telefone,
      cpf_aluno: cpf,
      plano_aluno: planoValue,
      forma_pagamento: formaPagamentoValue,
    };

    console.log("Processando cadastro de aluno:", aluno);
    console.log("Token de autenticação:", token);
    console.log(
      "URL da API:",
      `${process.env.NEXT_PUBLIC_API_URL}/alunos/cadastrar-alunos`
    );

    // Mostrar loading diferente baseado na forma de pagamento
    const loadingMessage =
      formaPagamentoValue === "boleto"
        ? "Gerando boleto..."
        : "Processando pagamento...";

    // SweetAlert de loading
    Swal.fire({
      icon: "info",
      title: "Aguarde",
      text: loadingMessage,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/alunos/cadastrar-alunos`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(aluno),
        }
      );

      console.log("Status da resposta:", response.status);
      console.log(
        "Headers da resposta:",
        Object.fromEntries(response.headers.entries())
      );

      const data = await response.json();
      console.log("Dados retornados do backend:", data);

      // Fechar loading
      Swal.close();

      if (response.ok) {
        // Lógica baseada no tipo de resposta do backend
        if (data.tipo === "boleto") {
          // BOLETO: Aluno cadastrado, aguardando pagamento
          await Swal.fire({
            icon: "success",
            title: "Cadastro Realizado!",
            text: 'Aluno cadastrado com status "Aguardando Pagamento". Boleto gerado com sucesso!',
            confirmButtonText: "Ok",
          });

          // Abrir boleto em nova aba
          // if (data.linkBoleto) {
          //   window.open(data.linkBoleto, "_blank");
          // }

          // Limpar formulário
          limparFormulario();
        } else if (data.tipo === "pagamento_aprovado") {
          // PIX/CARTÃO: Pagamento aprovado, aluno cadastrado
          await Swal.fire({
            icon: "success",
            title: "Pagamento Aprovado!",
            text: "Pagamento processado com sucesso! Aluno cadastrado e ativo.",
            timer: 3000,
          });

          // Limpar formulário
          limparFormulario();
        } else if (data.tipo === "pagamento_rejeitado") {
          // PIX/CARTÃO: Pagamento rejeitado
          await Swal.fire({
            icon: "error",
            title: "Pagamento Rejeitado",
            text:
              data.message ||
              "Não foi possível processar o pagamento. Tente novamente, ou contate a central de atendimento.",
          });
          // Não limpar formulário para permitir nova tentativa
        }
      } else {
        // Erro na requisição
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: data.error || "Erro ao processar cadastro do aluno.",
        });
      }
    } catch (error) {
      console.error("Erro ao conectar com o servidor:", error);

      // Fechar loading e mostrar erro
      Swal.fire({
        icon: "error",
        title: "Erro de Conexão",
        text: "Erro ao conectar com o servidor. Verifique sua conexão e tente novamente.",
      });
    }
  };

  const opcoesPlano = [
    { label: "Mensal", value: "mensal" },
    { label: "Trimestral", value: "trimestral" },
    { label: "Anual", value: "anual" },
  ];

  const opcoesPagamento = [
    { label: "PIX", value: "pix" },
    { label: "Débito", value: "debito" },
    { label: "Crédito", value: "credito" },
    { label: "Boleto", value: "boleto" },
  ];

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputSelectComponent
              label="Plano"
              name="plano"
              required
              error="Preencha esse campo!"
              formulario={formWithSetValue}
              onChange={(selectedOption: any) => {
                console.log(
                  "Plano selecionado (objeto completo):",
                  selectedOption
                );
                const value = selectedOption ? selectedOption.value : "";
                console.log("Valor extraído do plano:", value);
                setPlano(value);
                setValue("plano", selectedOption); // Passa o objeto completo para o React Hook Form
              }}
              options={opcoesPlano}
              width="w-full"
            />

            <InputSelectComponent
              label="Forma de Pagamento"
              name="formaPagamento"
              required
              error="Selecione uma forma de pagamento!"
              formulario={formWithSetValue}
              onChange={(selectedOption: any) => {
                console.log(
                  "Forma de pagamento selecionada (objeto completo):",
                  selectedOption
                );
                const value = selectedOption ? selectedOption.value : "";
                console.log("Valor extraído da forma de pagamento:", value);
                setFormaPagamento(value);
                setValue("formaPagamento", selectedOption); // Passa o objeto completo para o React Hook Form
              }}
              options={opcoesPagamento}
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
