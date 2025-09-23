"use client";
import Button from "@/components/Forms/Button";
import Input from "@/components/Forms/Input";
import InputSelectComponent from "@/components/Forms/InputSelect";
import { GetForm } from "@/utils";
import { CreditCard, Save, UserX } from "lucide-react";
import { useEffect, useState } from "react";
import * as yup from "yup";

// Simulação de busca de dados (substitua por chamada real à API se necessário)
const filiaisMock = [
  {
    id: 1,
    nome: "Academia Centro",
    cnpj: "12.345.678/0001-90",
    telefone: "(11) 99999-9999",
    cep: "01001-000",
    rua: "Rua das Flores",
    numero: "100",
    bairro: "Centro",
    cidade: "São Paulo",
    estado: "SP",
  },
  {
    id: 2,
    nome: "Academia Zona Sul",
    cnpj: "98.765.432/0001-10",
    telefone: "(11) 98888-8888",
    cep: "04567-000",
    rua: "Av. Paulista",
    numero: "2000",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    estado: "SP",
  },
  // ...outras filiais...
];

const EditarCadastroAluno = ({ alunoSelecionado, rest }: any) => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [plano, setPlano] = useState("");
  const [matricula, setMatricula] = useState("");
  const [yupSchema, setYupSchema] = useState<
    yup.ObjectSchema<{}, yup.AnyObject, {}, "">
  >(yup.object().shape({}));
  const { handleSubmit, ...form } = GetForm(yupSchema, setYupSchema);

  // Preencher os campos quando alunoSelecionado mudar
  useEffect(() => {
    if (alunoSelecionado) {
      setNome(alunoSelecionado.nome_aluno || "");
      setEmail(alunoSelecionado.email_aluno || "");
      setTelefone(alunoSelecionado.telefone_aluno || "");
      setCpf(alunoSelecionado.cpf_aluno || "");
      setPlano(alunoSelecionado.plano_aluno || "");

      // Formatação da data de matrícula se existir
      if (alunoSelecionado.data_cadastro) {
        const data = new Date(alunoSelecionado.data_cadastro);
        const dataFormatada = data.toISOString().split("T")[0];
        setMatricula(dataFormatada);
      } else {
        setMatricula("");
      }
    }
  }, [alunoSelecionado]);

  const onSubmitFunction = async () => {
    const aluno = {
      nome,
      email,
      telefone,
      cpf,
      plano,
      matricula,
    };
    console.log("Aluno cadastrado:", aluno);
  };

  console.log(alunoSelecionado);
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Telefone"
              name="telefone"
              required
              error="Preencha esse campo!"
              mascara="telefone"
              formulario={form}
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
              formulario={form}
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
              required
              error="Preencha esse campo!"
              formulario={form}
              value={plano}
              onChange={(e) => setPlano(e.target.value)}
              options={opcoesPlano}
              width="w-full"
            />

            <InputSelectComponent
              label="filial"
              name="filial"
              required
              error="Preencha esse campo!"
              formulario={form}
              value={plano}
              onChange={(e) => setPlano(e.target.value)}
              options={opcoesPlano}
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
                console.log("Inativar usuário:", alunoSelecionado);
                // Aqui você pode implementar a confirmação e lógica para inativar o usuário
                // Por exemplo, mostrar um modal de confirmação antes de inativar
                if (
                  window.confirm(
                    "Tem certeza que deseja inativar este usuário?"
                  )
                ) {
                  console.log("Usuário inativado:", alunoSelecionado?.id_aluno);
                  // Implementar chamada para API de inativação
                }
              }}
            >
              <UserX size={18} className="inline-block mr-2" />
              Inativar usuário
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
