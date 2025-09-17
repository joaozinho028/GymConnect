"use client";
import Button from "@/components/Forms/Button";
import Input from "@/components/Forms/Input";
import { GetForm } from "@/utils";
import { Save } from "lucide-react";
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

const EditarFilial = ({ filialSelecionada }: any) => {
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

  // Busca os dados da filial pelo id e preenche os campos
  useEffect(() => {
    if (filialSelecionada?.id) {
      // Aqui você pode trocar pelo fetch real
      const filial =
        filiaisMock.find((f) => f.id === filialSelecionada.id) ||
        filialSelecionada;
      setNome(filial.nome || "");
      setCnpj(filial.cnpj || "");
      setTelefone(filial.telefone || "");
      setCep(filial.cep || "");
      setRua(filial.rua || "");
      setNumero(filial.numero || "");
      setBairro(filial.bairro || "");
      setCidade(filial.cidade || "");
      setEstado(filial.estado || "");
    }
  }, [filialSelecionada]);

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
      <div className="w-full bg-white p-6 rounded-lg sm:p-10">
        <form onSubmit={handleSubmit(onSubmitFunction)} className="space-y-4">
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

export default EditarFilial;
