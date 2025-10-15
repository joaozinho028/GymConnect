"use client";
import Button from "@/components/Forms/Button";
import Input from "@/components/Forms/Input";
import InputSelectComponent from "@/components/Forms/InputSelect";
import { useAuth } from "@/contexts/AuthContext";
import { GetForm } from "@/utils";
import { CreditCard, Save, UserX } from "lucide-react";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import * as yup from "yup";

const EditarCadastroAluno = ({ alunoSelecionado, onSave, rest }: any) => {
  const { token } = useAuth();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [plano, setPlano] = useState("");
  const [filial, setFilial] = useState("");
  const [matricula, setMatricula] = useState("");
  const [opcoesFilial, setOpcoesFilial] = useState<any[]>([]);

  const [yupSchema, setYupSchema] = useState<
    yup.ObjectSchema<{}, yup.AnyObject, {}, "">
  >(yup.object().shape({}));
  const { handleSubmit, reset, setValue, ...form } = GetForm(
    yupSchema,
    setYupSchema
  );
  const formWithSetValue = { ...form, setValue };

  console.log(alunoSelecionado);

  // Buscar filiais
  useEffect(() => {
    async function fetchFiliais() {
      try {
        const resFilial = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/empresas/listar-filiais`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (resFilial.ok) {
          const dataFilial = await resFilial.json();
          setOpcoesFilial(
            (dataFilial || []).map((f: any) => ({
              value: f.id_filial ?? f.id,
              label: f.nome_filial ?? f.nome,
            }))
          );
        } else {
          console.error("Erro ao buscar filiais:", resFilial.status);
        }
      } catch (error) {
        console.error("Erro ao buscar filiais:", error);
      }
    }

    if (token) {
      fetchFiliais();
    }
  }, [token]);

  // Preencher os campos quando alunoSelecionado mudar
  useEffect(() => {
    if (alunoSelecionado) {
      setNome(alunoSelecionado.nome_aluno || "");
      setEmail(alunoSelecionado.email_aluno || "");
      setTelefone(alunoSelecionado.telefone_aluno || "");
      setCpf(alunoSelecionado.cpf_aluno || "");
      setPlano(alunoSelecionado.plano_aluno || "");
      setFilial(
        alunoSelecionado.id_filial ? alunoSelecionado.id_filial.toString() : ""
      );

      // Formatação da data de matrícula se existir
      if (alunoSelecionado.data_cadastro) {
        const data = new Date(alunoSelecionado.data_cadastro);
        const dataFormatada = data.toISOString().split("T")[0];
        setMatricula(dataFormatada);
      } else {
        setMatricula("");
      }

      // Aqui está o segredo: resetar o form do GetForm!
      reset({
        nome: alunoSelecionado.nome_aluno || "",
        email: alunoSelecionado.email_aluno || "",
        telefone: alunoSelecionado.telefone_aluno || "",
        cpf: alunoSelecionado.cpf_aluno || "",
        plano: alunoSelecionado.plano_aluno || "",
        filial: alunoSelecionado.id_filial
          ? alunoSelecionado.id_filial.toString()
          : "",
        matricula: alunoSelecionado.data_cadastro
          ? new Date(alunoSelecionado.data_cadastro).toISOString().split("T")[0]
          : "",
        // Adicione outros campos se necessário
      });
    }
  }, [alunoSelecionado, reset]);

  const onSubmitFunction = async (values: any) => {
    try {
      // Remover máscaras antes de enviar para a API
      const cpfLimpo = values.cpf.replace(/\D/g, "");
      const telefoneLimpo = values.telefone.replace(/\D/g, "");

      // Lógica para plano: se o usuário selecionou, usa o selecionado, senão mantém o atual
      const planoFinal =
        values.plano && values.plano !== ""
          ? values.plano
          : alunoSelecionado.plano_aluno || "";

      // Lógica para filial: se o usuário selecionou, usa o selecionado, senão mantém o atual
      const filialFinal =
        values.filial && values.filial !== ""
          ? parseInt(values.filial)
          : alunoSelecionado.id_filial || null;

      const body = {
        id_aluno: alunoSelecionado.id_aluno,
        nome_aluno: values.nome,
        email_aluno: values.email,
        telefone_aluno: telefoneLimpo,
        cpf_aluno: cpfLimpo,
        plano_aluno: planoFinal,
        id_filial: filialFinal,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/alunos/editar-alunos`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: "success",
          text: data?.message || "Aluno atualizado com sucesso!",
          timer: 2500,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });

        if (onSave) {
          // Encontrar o nome da filial selecionada para exibição
          const filialSelecionada = opcoesFilial.find(
            (f) => f.value.toString() === values.filial
          );

          onSave({
            ...alunoSelecionado,
            nome_aluno: values.nome,
            cpf_aluno: cpfLimpo,
            telefone_aluno: telefoneLimpo,
            email_aluno: values.email,
            plano_aluno: planoFinal,
            id_filial: filialFinal,
            filial: filialSelecionada?.label || alunoSelecionado.filial, // Nome da filial para exibição
            matricula_aluno: values.matricula,
            updated_at: new Date().toISOString(),
          });
        }
      } else {
        Swal.fire({
          icon: "error",
          text: data?.message || "Erro ao atualizar aluno.",
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

  const opcoesPlano = [
    { label: "Mensal", value: "mensal" },
    { label: "Trimestral", value: "trimestral" },
    { label: "Anual", value: "anual" },
  ];

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-8">
      <div className="w-full bg-white p-6 rounded-lg sm:p-10">
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

          <hr />
          <div className="font-bold text-sm">
            <p>Alterar Configurações</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputSelectComponent
              label="Plano"
              name="plano"
              formulario={formWithSetValue}
              value={plano}
              onChange={(e) => setPlano(e.target.value)}
              options={opcoesPlano}
              width="w-full"
            />

            <InputSelectComponent
              label="Filial"
              name="filial"
              formulario={formWithSetValue}
              value={filial}
              onChange={(e) => setFilial(e.target.value)}
              options={opcoesFilial}
              width="w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:flex sm:justify-end sm:space-x-4 gap-2 sm:pt-4">
            <Button
              className="p-2 w-full sm:w-[280px] bg-blue-600 cursor-pointer hover:bg-blue-700 text-white hover:text-white"
              type="button"
              onClick={() => {
                console.log(
                  "Alterar forma de pagamento do aluno:",
                  alunoSelecionado
                );
                // Aqui você pode implementar a lógica para alterar a forma de pagamento
                // Por exemplo, abrir outro modal ou navegar para outra página
              }}
            >
              <CreditCard size={18} className="inline-block mr-2" />
              Alterar forma de pagamento
            </Button>
            <Button
              className="p-2 w-full sm:w-[180px] bg-red-600 cursor-pointer hover:bg-red-700 text-white hover:text-white"
              type="button"
              onClick={() => {
                Swal.fire({
                  title: "Atenção",
                  text:
                    "Para inativar o aluno, entre em contato com o suporte, informando que deseja inativar o aluno " +
                    alunoSelecionado?.nome_aluno +
                    ".",
                  icon: "warning",
                });
              }}
            >
              <UserX size={18} className="inline-block mr-2" />
              Inativar aluno
            </Button>
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

export default EditarCadastroAluno;
