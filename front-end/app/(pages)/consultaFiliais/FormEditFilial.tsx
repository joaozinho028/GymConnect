"use client";
import Button from "@/components/Forms/Button";
import Input from "@/components/Forms/Input";
import { useAuth } from "@/contexts/AuthContext";
import { GetForm } from "@/utils";
import { InfoIcon, Save } from "lucide-react";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import * as yup from "yup";

type FormSchema = yup.ObjectSchema<{
  nome?: string;
  cnpj?: string;
  telefone?: string;
  // ...outros campos
}>;

const EditarFilial = ({ filial, onSave }: any) => {
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

  const [yupSchema, setYupSchema] = useState<FormSchema>(
    yup.object().shape({
      nome: yup.string().required("Nome é obrigatório"),
      cnpj: yup.string().required("CNPJ é obrigatório"),
      telefone: yup.string().required("Telefone é obrigatório"),
      cep: yup.string().required("CEP é obrigatório"),
      rua: yup.string().required("Rua é obrigatória"),
      numero: yup.string().required("Número é obrigatório"),
      bairro: yup.string().required("Bairro é obrigatório"),
      cidade: yup.string().required("Cidade é obrigatória"),
      estado: yup.string().required("Estado é obrigatório"),
    })
  );

  const { handleSubmit, reset, setValue, ...form } = GetForm(
    yupSchema as any,
    setYupSchema as any
  );

  useEffect(() => {
    console.log(filial);
  }, [filial]);

  // Incluir setValue no objeto form para os componentes Input
  const formWithSetValue = { ...form, setValue };

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
      .replace(/(\d{5})(\d)/, "$1-$2")
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

          // Atualizar também o formulário para validação
          setValue("rua", data.logradouro || "");
          setValue("bairro", data.bairro || "");
          setValue("cidade", data.localidade || "");
          setValue("estado", data.uf || "");
        } else {
          Swal.fire({
            icon: "warning",
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

  useEffect(() => {
    if (filial) {
      const endereco = filial.endereco || {};

      // Preencher os estados com valores já formatados
      setNome(filial.nome_filial || filial.nome || "");
      setCnpj(aplicarMascaraCNPJ(filial.cnpj_filial || filial.cnpj || ""));
      setTelefone(
        aplicarMascaraTelefone(filial.telefone_filial || filial.telefone || "")
      );
      setCep(aplicarMascaraCEP(endereco.cep || ""));
      setRua(endereco.rua || "");
      setNumero(endereco.numero || "");
      setBairro(endereco.bairro || "");
      setCidade(endereco.cidade || "");
      setEstado(endereco.estado || "");

      // Resetar o formulário
      reset({
        nome: filial.nome_filial || filial.nome || "",
        cnpj: aplicarMascaraCNPJ(filial.cnpj_filial || filial.cnpj || ""),
        telefone: aplicarMascaraTelefone(
          filial.telefone_filial || filial.telefone || ""
        ),
        cep: aplicarMascaraCEP(endereco.cep || ""),
        rua: endereco.rua || "",
        numero: endereco.numero || "",
        bairro: endereco.bairro || "",
        cidade: endereco.cidade || "",
        estado: endereco.estado || "",
      });
    }
  }, [filial, reset]);

  console.log(filial);

  // Handler para CEP que aplica máscara e busca o endereço
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorMascarado = aplicarMascaraCEP(e.target.value);
    setCep(valorMascarado);
    setValue("cep", valorMascarado);

    // Buscar endereço quando o CEP tiver 9 caracteres (com hífen)
    if (valorMascarado.length === 9) {
      buscarEnderecoPorCep(valorMascarado);
    }
  };

  const onSubmitFunction = async (values: any) => {
    try {
      // Remover máscaras antes de enviar para a API
      const cnpjLimpo = values.cnpj.replace(/\D/g, "");
      const telefoneLimpo = values.telefone.replace(/\D/g, "");
      const cepLimpo = values.cep.replace(/\D/g, "");

      const body = {
        id_filial: filial.id,
        nome_filial: values.nome,
        cnpj_filial: cnpjLimpo,
        telefone_filial: telefoneLimpo,
        cep_filial: cepLimpo,
        rua_filial: values.rua,
        numero_filial: values.numero,
        bairro_filial: values.bairro,
        cidade_filial: values.cidade,
        estado_filial: values.estado,
      };

      console.log("Enviando dados:", body);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/empresas/editar-filial`,
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
          text: data?.message || "Filial atualizada com sucesso!",
          timer: 2500,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });

        if (onSave) {
          onSave({
            ...filial,
            nome_filial: values.nome,
            cnpj_filial: cnpjLimpo,
            telefone_filial: telefoneLimpo,
            endereco: {
              cep: cepLimpo,
              rua: values.rua,
              numero: values.numero,
              bairro: values.bairro,
              cidade: values.cidade,
              estado: values.estado,
            },
            updated_at: new Date().toISOString(),
          });
        }
      } else {
        Swal.fire({
          icon: "error",
          text: data?.message || "Erro ao atualizar filial.",
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
              formulario={formWithSetValue}
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                setValue("nome", e.target.value);
              }}
            />
            <Input
              label="CNPJ"
              name="cnpj"
              required
              error="Preencha esse campo!"
              formulario={formWithSetValue}
              value={cnpj}
              onChange={(e) => {
                const valorMascarado = aplicarMascaraCNPJ(e.target.value);
                setCnpj(valorMascarado);
                setValue("cnpj", valorMascarado);
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Telefone"
              name="telefone"
              required
              error="Preencha esse campo!"
              formulario={formWithSetValue}
              value={telefone}
              onChange={(e) => {
                const valorMascarado = aplicarMascaraTelefone(e.target.value);
                setTelefone(valorMascarado);
                setValue("telefone", valorMascarado);
              }}
            />
            <Input
              label="CEP"
              name="cep"
              required
              error="Preencha esse campo!"
              formulario={formWithSetValue}
              value={cep}
              onChange={handleCepChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Rua"
              name="rua"
              required
              error="Preencha esse campo!"
              formulario={formWithSetValue}
              value={rua}
              onChange={(e) => {
                setRua(e.target.value);
                setValue("rua", e.target.value);
              }}
            />
            <Input
              label="Número"
              name="numero"
              required
              error="Preencha esse campo!"
              formulario={formWithSetValue}
              value={numero}
              onChange={(e) => {
                setNumero(e.target.value);
                setValue("numero", e.target.value);
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Bairro"
              name="bairro"
              required
              error="Preencha esse campo!"
              formulario={formWithSetValue}
              value={bairro}
              onChange={(e) => {
                setBairro(e.target.value);
                setValue("bairro", e.target.value);
              }}
            />
            <Input
              label="Cidade"
              name="cidade"
              required
              error="Preencha esse campo!"
              formulario={formWithSetValue}
              value={cidade}
              onChange={(e) => {
                setCidade(e.target.value);
                setValue("cidade", e.target.value);
              }}
            />
            <Input
              label="Estado"
              name="estado"
              required
              error="Preencha esse campo!"
              formulario={formWithSetValue}
              value={estado}
              onChange={(e) => {
                setEstado(e.target.value);
                setValue("estado", e.target.value);
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:flex sm:justify-end sm:space-x-4 gap-2 sm:pt-4">
            <Button
              className="p-2 w-full sm:w-[180px] bg-red-600 cursor-pointer hover:bg-red-700 text-white hover:text-white"
              type="button"
              onClick={() => {
                // Confirmar inativação com SweetAlert2 em vez de confirm básico
                Swal.fire({
                  title: "Atenção",
                  text:
                    "Para inativar a filial, entre em contato com o suporte, informando que deseja inativar a filial " +
                    (filial?.nome_filial || filial?.nome || "") +
                    ".",
                  icon: "warning",
                });
              }}
            >
              <InfoIcon size={18} className="inline-block mr-2" />
              Inativar Filial
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

export default EditarFilial;
