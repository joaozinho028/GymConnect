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

    // Validar se todos os campos estão preenchidos
    if (
      !nome ||
      !email ||
      !telefone ||
      !cpf ||
      !planoValue ||
      !formaPagamentoValue
    ) {
      Swal.fire({
        icon: "error",
        title: "Campos obrigatórios",
        text: "Por favor, preencha todos os campos obrigatórios.",
      });
      return;
    }

    // Estrutura de dados que o PaymentController espera
    const dadosCobranca = {
      aluno_nome: nome,
      aluno_cpf: cpf.replace(/\D/g, ""), // Remove formatação do CPF
      aluno_email: email,
      aluno_telefone: telefone.replace(/\D/g, ""), // Remove formatação do telefone
      id_plano: parseInt(planoValue), // Converter para número
      forma_pagamento: formaPagamentoValue,
    };

    console.log("Dados da cobrança:", dadosCobranca);
    console.log("Token de autenticação:", token);

    // Mostrar loading baseado na forma de pagamento
    const loadingMessages = {
      boleto: "Gerando boleto bancário...",
      pix: "Criando PIX...",
      credito: "Processando cartão de crédito...",
      debito: "Processando cartão de débito...",
    };

    const loadingMessage =
      loadingMessages[formaPagamentoValue as keyof typeof loadingMessages] ||
      "Processando pagamento...";

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
        `${process.env.NEXT_PUBLIC_API_URL}/payments/criar-cobranca`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(dadosCobranca),
        }
      );

      console.log("Status da resposta:", response.status);

      const data = await response.json();
      console.log("Dados retornados do backend:", data);

      // Fechar loading
      Swal.close();

      if (response.ok && data.success) {
        // Sucesso - Mostrar dados do pagamento
        const { data: paymentData } = data;

        const result = await Swal.fire({
          icon: "success",
          title: data.message,
          showCancelButton: true,
          confirmButtonText: "Abrir Link de Pagamento",
          cancelButtonText: "Fechar",
          confirmButtonColor: "#10B981",
        });

        // Se clicar em "Abrir Link de Pagamento"
        if (result.isConfirmed && paymentData.payment_url) {
          window.open(paymentData.payment_url, "_blank");
        }

        // Limpar formulário após sucesso
        limparFormulario();
      } else {
        // Erro retornado pela API
        Swal.fire({
          icon: "error",
          title: "Erro ao processar pagamento",
          text: data.message || "Erro desconhecido ao criar cobrança.",
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

  // Opções de plano fixas
  const opcoesPlano = [
    { label: "Plano Mensal - R$ 89,90", value: "1" },
    { label: "Plano Trimestral - R$ 239,90", value: "2" },
    { label: "Plano Semestral - R$ 449,90", value: "3" },
    { label: "Plano Anual - R$ 899,90", value: "4" },
  ];

  const opcoesPagamento = [
    { label: "PIX", value: "pix" },
    { label: "Cartão de Débito", value: "debito" },
    { label: "Cartão de Crédito", value: "credito" },
    { label: "Boleto Bancário", value: "boleto" },
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
              error="Selecione um plano!"
              formulario={formWithSetValue}
              onChange={(selectedOption: any) => {
                console.log("Plano selecionado:", selectedOption);
                const value = selectedOption ? selectedOption.value : "";
                setPlano(value);
                setValue("plano", selectedOption);
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
                console.log("Forma de pagamento selecionada:", selectedOption);
                const value = selectedOption ? selectedOption.value : "";
                setFormaPagamento(value);
                setValue("formaPagamento", selectedOption);
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
              Criar Cobrança
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CadastrarAluno;
