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

const DadosBancarios = ({ ...rest }: any) => {
  const [banco, setBanco] = useState("");
  const [agencia, setAgencia] = useState("");
  const [conta, setConta] = useState("");
  const [tipoConta, setTipoConta] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [titular, setTitular] = useState("");
  const { token } = useAuth();

  // Máscaras
  function maskAgencia(value: string) {
    return value.replace(/\D/g, "").slice(0, 4);
  }
  function maskConta(value: string) {
    return value.replace(/\D/g, "").slice(0, 10);
  }
  function maskCnpj(value: string) {
    value = value.replace(/\D/g, "").slice(0, 14);
    // CNPJ: 00.000.000/0000-00
    return value
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  }

  // Buscar dados bancários ao abrir a tela
  useEffect(() => {
    async function fetchDados() {
      if (!token) return;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/dados-bancarios/buscar-dados-bancarios`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setBanco(data.banco || "");
          setAgencia(data.agencia || "");
          setConta(data.conta || "");
          setTipoConta(data.tipo_conta || "");
          setCpfCnpj(data.cpf_cnpj || "");
          setTitular(data.titular || "");
        }
      }
    }
    fetchDados();
  }, [token]);

  const schema = yup.object().shape({
    banco: yup.string().required("Informe o banco"),
    agencia: yup.string().required("Informe a agência"),
    conta: yup.string().required("Informe a conta"),
    tipoConta: yup.string().required("Selecione o tipo de conta"),
    cpfCnpj: yup
      .string()
      .matches(/^\d{14}$/, "Informe um CNPJ válido (14 dígitos)")
      .required("Informe o CNPJ"),
    titular: yup.string().required("Informe o nome do titular"),
  });

  const { handleSubmit, ...form } = GetForm(schema);

  const onSubmitFunction = async () => {
    const dados = {
      banco,
      agencia,
      conta,
      tipo_conta: tipoConta,
      cpf_cnpj: cpfCnpj.replace(/\D/g, ""),
      titular,
    };
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/dados-bancarios/cadastrar-dados-bancarios`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(dados),
        }
      );
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          icon: "success",
          text: data.message || "Dados bancários salvos!",
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      } else {
        Swal.fire({
          icon: "error",
          text: data.message || "Erro ao salvar dados bancários.",
          timer: 2500,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        text: "Erro ao conectar ao servidor.",
        timer: 2500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    }
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
              onChange={(e) => setAgencia(maskAgencia(e.target.value))}
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
              onChange={(e) => setConta(maskConta(e.target.value))}
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
              label="CNPJ"
              name="cpfCnpj"
              required
              error="Informe o CNPJ"
              formulario={form}
              value={maskCnpj(cpfCnpj)}
              onChange={(e) => setCpfCnpj(maskCnpj(e.target.value))}
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
