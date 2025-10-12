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
  const { token, user } = useAuth();
  const [paymentLinkId, setPaymentLinkId] = useState<string | null>(null);
  const [dadosAluno, setDadosAluno] = useState<any>(null);
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
    setPaymentLinkId(null);
    setDadosAluno(null);
    setValue("plano", null);
  };

  const opcoesPlano = [
    { label: "Mensal", value: "mensal" },
    { label: "Trimestral", value: "trimestral" },
    { label: "Anual", value: "anual" },
  ];

  // 1. Envia dados, recebe link de pagamento
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
    };

    Swal.fire({
      icon: "info",
      title: "Aguarde",
      text: "Gerando link de pagamento...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/alunos/iniciar-cadastro-aluno`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(aluno),
        }
      );
      const data = await response.json();
      Swal.close();

      if (data.success && data.paymentLinkUrl) {
        setPaymentLinkId(data.paymentLinkId);
        setDadosAluno(aluno);

        let cancelado = false;

        await Swal.fire({
          icon: "info",
          title: "Aguardando pagamento...",
          html: `
            <p>Para concluir o cadastro, clique no botão abaixo e realize o pagamento:</p>
            <a href="${data.paymentLinkUrl}" target="_blank" class="swal2-confirm swal2-styled" style="margin-top:16px;">Pagar Agora</a>
            <br/><br/>
            <button id="cancelar-requisicao-btn" class="swal2-cancel swal2-styled" style="background:#ef4444;">Cancelar requisição</button>
            <br/><br/>
            <div id="swal-loader" style="margin-top:16px;">
              <span class="swal2-loader"></span>
              <span>Aguardando confirmação do pagamento...</span>
            </div>
          `,
          showConfirmButton: false,
          showCloseButton: false,
          allowOutsideClick: false,
          didRender: () => {
            const btn = document.getElementById("cancelar-requisicao-btn");
            if (btn) {
              btn.onclick = () => {
                cancelado = true;
                Swal.close();
              };
            }
          },
          willOpen: async () => {
            // Polling: verifica pagamento a cada 10 segundos, até 1 hora ou cancelado
            const maxTentativas = 360; // 1 hora (3600s / 10s)
            let tentativas = 0;
            while (!cancelado && tentativas < maxTentativas) {
              await new Promise((resolve) => setTimeout(resolve, 10000)); // 10s
              if (cancelado) break;
              const resp = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/alunos/confirmar-pagamento-link`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    paymentLinkId: data.paymentLinkId,
                    dadosAluno: aluno,
                  }),
                }
              );
              const result = await resp.json();
              if (result.success) {
                Swal.close();
                Swal.fire({
                  icon: "success",
                  title: "Cadastro realizado!",
                  text: "Pagamento confirmado e aluno cadastrado.",
                });
                limparFormulario();
                return;
              }
              tentativas++;
            }
            if (!cancelado) {
              Swal.close();
              Swal.fire({
                icon: "warning",
                title: "Pagamento não realizado",
                text: "Tempo limite de 1 hora atingido. Tente novamente.",
              });
            }
          },
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: data.error || "Erro ao gerar link de pagamento.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Erro de Conexão",
        text: "Erro ao conectar com o servidor. Verifique sua conexão e tente novamente.",
      });
    }
  };

  // 2. Confirma pagamento e cadastra aluno
  const confirmarPagamento = async () => {
    if (!paymentLinkId || !dadosAluno) return;

    Swal.fire({
      icon: "info",
      title: "Verificando pagamento...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/alunos/confirmar-pagamento-link`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            paymentLinkId,
            dadosAluno,
          }),
        }
      );
      const result = await response.json();
      Swal.close();

      if (result.success) {
        Swal.fire({
          icon: "success",
          title: "Cadastro realizado!",
          text: "Pagamento confirmado e aluno cadastrado.",
        });
        limparFormulario();
      } else {
        Swal.fire({
          icon: "warning",
          title: "Aguardando pagamento",
          text: "O pagamento ainda não foi identificado. Tente novamente em alguns minutos.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao confirmar pagamento. Tente novamente.",
      });
    }
  };

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
