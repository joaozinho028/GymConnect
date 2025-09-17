"use client";
import Button from "@/components/Forms/Button";
import Input from "@/components/Forms/Input";
import { GetForm } from "@/utils";
import { ChevronRight, Save } from "lucide-react";
import { useState } from "react";
import * as yup from "yup";

const CadastrarFilial = ({ ...rest }: any) => {
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  const [yupSchema, setYupSchema] = useState(yup.object().shape({}));
  const { handleSubmit, ...form } = GetForm(yupSchema, setYupSchema);

  const onSubmitFunction = async () => {
    const filial = {
      nome,
      cnpj,
      telefone,
      cep,
      rua,
      numero,
      bairro,
      cidade,
      estado,
    };
    console.log("Filial cadastrada:", filial);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-8">
      <div className="w-full bg-white p-6 rounded-lg shadow-md sm:p-10">
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <span className="text-gray-500 hover:text-gray-700 cursor-pointer">
            Página Inicial
          </span>
          <ChevronRight className="mx-2 h-4 w-4" />
          <span className="font-medium text-primary">Cadastro de Filial</span>
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
            />
            <Input
              label="CNPJ"
              name="cnpj"
              required
              error="Preencha esse campo!"
              mascara="cnpj"
              formulario={form}
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
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
            />
            <Input
              label="CEP"
              name="cep"
              required
              error="Preencha esse campo!"
              mascara="cep"
              formulario={form}
              value={cep}
              onChange={(e) => setCep(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Rua"
              name="rua"
              required
              error="Preencha esse campo!"
              formulario={form}
              value={rua}
              onChange={(e) => setRua(e.target.value)}
            />
            <Input
              label="Número"
              name="numero"
              required
              error="Preencha esse campo!"
              formulario={form}
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Bairro"
              name="bairro"
              required
              error="Preencha esse campo!"
              formulario={form}
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
            />
            <Input
              label="Cidade"
              name="cidade"
              required
              error="Preencha esse campo!"
              formulario={form}
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
            />
            <Input
              label="Estado"
              name="estado"
              required
              error="Preencha esse campo!"
              formulario={form}
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-4">
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

export default CadastrarFilial;
