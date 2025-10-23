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

        const mensagem = `Olá ${nome}, seu link de pagamento do plano ${plano} está pronto! Clique para pagar: ${data.paymentLinkUrl}`;
        const telefoneWhatsApp = telefone.replace(/\D/g, "");
        const urlWhatsApp = `https://wa.me/55${telefoneWhatsApp}?text=${encodeURIComponent(
          mensagem
        )}`;

        // Exibe modal com preloader e bloqueio de fechamento
        let swalClosed = false;
        const swalInstance = await Swal.fire({
          icon: "info",
          title: "Aguardando pagamento...",
          html: `
            <div style="text-align:left;">
              <p><strong>Link de pagamento:</strong></p>
              <a href="${data.paymentLinkUrl}" target="_blank" style="word-break:break-all; color:#2563eb; text-decoration:underline;">
                ${data.paymentLinkUrl}
              </a>
              <br/><br/>
              <a href="${urlWhatsApp}" target="_blank"
                style="
                  display:inline-flex;
                  align-items:center;
                  gap:8px;
                  background:#25D366;
                  color:#fff;
                  font-weight:600;
                  border-radius:6px;
                  padding:10px 18px;
                  font-size:16px;
                  text-decoration:none;
                  box-shadow:0 2px 8px rgba(37,211,102,0.15);
                  transition:background 0.2s;
                "
                onmouseover="this.style.background='#1DA851'"
                onmouseout="this.style.background='#25D366'"
              >
                Enviar pelo WhatsApp
              </a>
              <br/><br/>
              <div id="swal-preloader" style="display:flex;align-items:center;gap:10px;">
                <span class="swal2-loader" style="display:inline-block;width:24px;height:24px;border:3px solid #2563eb;border-radius:50%;border-top-color:transparent;animation:swal-spin 1s linear infinite;"></span>
                <span>Aguardando confirmação do pagamento...</span>
              </div>
              <style>
                @keyframes swal-spin { 100% { transform: rotate(360deg); } }
              </style>
            </div>
          `,
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
            // Inicia polling para verificar pagamento
            const interval = setInterval(async () => {
              if (swalClosed) {
                clearInterval(interval);
                return;
              }
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
                      paymentLinkId: data.paymentLinkId,
                      dadosAluno: aluno,
                    }),
                  }
                );
                const result = await response.json();
                if (result.success) {
                  swalClosed = true;
                  Swal.close();
                  Swal.fire({
                    icon: "success",
                    title: "Cadastro realizado!",
                    text: "Pagamento confirmado e aluno cadastrado.",
                  });
                  limparFormulario();
                  clearInterval(interval);
                }
              } catch {}
            }, 5000); // verifica a cada 5 segundos

            // Fecha o swal automaticamente após 5 minutos (300000 ms)
            setTimeout(() => {
              if (!swalClosed) {
                swalClosed = true;
                Swal.close();
                Swal.fire({
                  icon: "warning",
                  title: "Tempo esgotado",
                  text: "O pagamento não foi identificado em até 5 minutos. Tente novamente.",
                });
              }
            }, 300000);
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
