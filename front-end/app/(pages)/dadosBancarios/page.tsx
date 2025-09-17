"use client";

import Button from "@/components/Forms/Button";
import Input from "@/components/Forms/Input";
import InputSelectComponent from "@/components/Forms/InputSelect";
import { GetForm } from "@/utils";
import { ChevronRight, Save } from "lucide-react";
import { useState } from "react";
import * as yup from "yup";

const DadosBancarios = ({ ...rest }: any) => {
  const [banco, setBanco] = useState("");
  const [agencia, setAgencia] = useState("");
  const [conta, setConta] = useState("");
  const [tipoConta, setTipoConta] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [titular, setTitular] = useState("");

  const schema = yup.object().shape({
    banco: yup.string().required("Informe o banco"),
    agencia: yup.string().required("Informe a agência"),
    conta: yup.string().required("Informe a conta"),
    tipoConta: yup.string().required("Selecione o tipo de conta"),
    cpfCnpj: yup
      .string()
      .matches(
        /^\d{11}$|^\d{14}$/,
        "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos)"
      )
      .required("Informe o CPF ou CNPJ"),
    titular: yup.string().required("Informe o nome do titular"),
  });

  const { handleSubmit, ...form } = GetForm(schema);

  const onSubmitFunction = async () => {
    const dados = { banco, agencia, conta, tipoConta, cpfCnpj, titular };
    console.log("Dados bancários salvos:", dados);
    // Aqui você pode enviar para o backend via API
  };

  const opcoesBanco = [
    { value: "001", label: "Banco do Brasil" },
    { value: "237", label: "Bradesco" },
    { value: "104", label: "Caixa Econômica Federal" },
    { value: "341", label: "Itaú" },
    { value: "033", label: "Santander" },
  ];

  const opcoesTipoConta = [
    { value: "corrente", label: "Conta Corrente" },
    { value: "poupanca", label: "Conta Poupança" },
  ];

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-8">
      <div className="w-full max-w-none bg-white p-6 rounded-lg shadow-md sm:p-10">
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <span className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
            Configurações
          </span>
          <ChevronRight className="mx-2 h-4 w-4" />
          <span className="font-medium text-primary">Dados Bancários</span>
        </div>

        <form
          onSubmit={handleSubmit(onSubmitFunction)}
          {...rest}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputSelectComponent
              label="Banco"
              name="banco"
              required
              error="Informe o banco"
              formulario={form}
              value={banco}
              onChange={(e) => setBanco(e.target.value)}
              options={opcoesBanco}
              width="w-full"
            />
            <Input
              label="Agência"
              name="agencia"
              required
              error="Informe a agência"
              formulario={form}
              value={agencia}
              onChange={(e) => setAgencia(e.target.value)}
              width="w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Conta"
              name="conta"
              required
              error="Informe a conta"
              formulario={form}
              value={conta}
              onChange={(e) => setConta(e.target.value)}
              width="w-full"
            />
            <InputSelectComponent
              label="Tipo de Conta"
              name="tipoConta"
              required
              error="Selecione o tipo de conta"
              formulario={form}
              value={tipoConta}
              onChange={(e) => setTipoConta(e.target.value)}
              options={opcoesTipoConta}
              width="w-full"
            />
            <Input
              label="CPF/CNPJ"
              name="cpfCnpj"
              required
              error="Informe o CPF ou CNPJ"
              formulario={form}
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(e.target.value)}
              width="w-full"
            />
          </div>

          <Input
            label="Nome do Titular"
            name="titular"
            required
            error="Informe o nome do titular"
            formulario={form}
            value={titular}
            onChange={(e) => setTitular(e.target.value)}
            width="w-full"
          />

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

export default DadosBancarios;
