"use client";
import Button from "@/components/Forms/Button";
import Input from "@/components/Forms/Input";
import { useAuth } from "@/contexts/AuthContext";
import { GetForm } from "@/utils";
import { ChevronRight, Save } from "lucide-react";
import { useState } from "react";
import Swal from "sweetalert2";
import * as yup from "yup";

const CadastrarFilial = ({ ...rest }: any) => {
  const { token } = useAuth();
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

  // Funções de máscara personalizadas
  const aplicarMascaraCNPJ = (valor: string) => {
    return valor
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const aplicarMascaraTelefone = (valor: string) => {
    return valor
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(\d{4})-(\d)(\d{4})/, "$1$2-$3")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const aplicarMascaraCEP = (valor: string) => {
    return valor
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{3})\d+?$/, "$1");
  };

  // Função para buscar endereço por CEP
  const buscarEnderecoPorCep = async (cepValue: string) => {
    const cepLimpo = cepValue.replace(/\D/g, "");

    if (cepLimpo.length === 8) {
      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${cepLimpo}/json/`
        );
        const data = await response.json();

        if (!data.erro) {
          setRua(data.logradouro || "");
          setBairro(data.bairro || "");
          setCidade(data.localidade || "");
          setEstado(data.uf || "");
        } else {
          Swal.fire({
            icon: "warning",
            title: "CEP não encontrado",
            text: "O CEP informado não foi encontrado.",
            timer: 2500,
            showConfirmButton: false,
            toast: true,
            position: "top-end",
          });
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  const onSubmitFunction = async () => {
    console.log("Dados da filial:", {
      nome_filial: nome,
      cnpj_filial: cnpj,
      telefone_filial: telefone,
      cep_filial: cep,
      rua_filial: rua,
      numero_filial: numero,
      bairro_filial: bairro,
      cidade_filial: cidade,
      estado_filial: estado,
    });

    try {
      const body = {
        nome_filial: nome,
        cnpj_filial: cnpj,
        telefone_filial: telefone,
        cep_filial: cep,
        rua_filial: rua,
        numero_filial: numero,
        bairro_filial: bairro,
        cidade_filial: cidade,
        estado_filial: estado,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/empresas/cadastrar-filial`,
        {
          method: "POST",
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
          title: "Sucesso!",
          text: "Filial cadastrada com sucesso!",
          timer: 2500,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });

        // Limpar formulário após sucesso
        setNome("");
        setCnpj("");
        setTelefone("");
        setCep("");
        setRua("");
        setNumero("");
        setBairro("");
        setCidade("");
        setEstado("");
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text: data?.message || "Erro ao cadastrar filial.",
          timer: 2500,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Erro!",
        text: err?.message || "Erro ao conectar ao servidor.",
        timer: 2500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    }
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
              formulario={form}
              value={cnpj}
              onChange={(e) => {
                const valorComMascara = aplicarMascaraCNPJ(e.target.value);
                setCnpj(valorComMascara);
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Telefone"
              name="telefone"
              required
              error="Preencha esse campo!"
              formulario={form}
              value={telefone}
              onChange={(e) => {
                const valorComMascara = aplicarMascaraTelefone(e.target.value);
                setTelefone(valorComMascara);
              }}
            />
            <Input
              label="CEP"
              name="cep"
              required
              error="Preencha esse campo!"
              formulario={form}
              value={cep}
              onChange={(e) => {
                const valorComMascara = aplicarMascaraCEP(e.target.value);
                setCep(valorComMascara);
                buscarEnderecoPorCep(valorComMascara);
              }}
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
              onChange={(e) => {
                // Permitir apenas números
                const valorLimpo = e.target.value.replace(/\D/g, "");
                setNumero(valorLimpo);
              }}
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
