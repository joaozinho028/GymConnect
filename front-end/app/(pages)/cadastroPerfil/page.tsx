"use client";

import Button from "@/components/Forms/Button";
import Input from "@/components/Forms/Input";
import InputSelectComponent from "@/components/Forms/InputSelect";
import { GetForm } from "@/utils";
import { ChevronRight, Save } from "lucide-react";
import { useState } from "react";
import * as yup from "yup";

const CadastrarPerfis = ({ ...rest }: any) => {
  const [nome, setNome] = useState("");
  const [filial, setFilial] = useState("");
  const [permissoes, setPermissoes] = useState<string[]>([]);

  const [yupSchema, setYupSchema] = useState<
    yup.ObjectSchema<{}, yup.AnyObject, {}, "">
  >(yup.object().shape({}));

  const { handleSubmit, ...form } = GetForm(yupSchema, setYupSchema);

  const onSubmitFunction = async () => {
    console.log("Perfil cadastrado:", { nome, filial, permissoes });
  };

  const opcaoFilial = [
    { value: "1", label: "Filial 1" },
    { value: "2", label: "Filial 2" },
  ];

  const listaPermissoes = [
    "Modulo de Alunos",
    "Modulo de Filiais",
    "Modulo Fluxo de Caixa",
    "Modulo de Configurações",
    "Modulo de Importação",
    "Modulo de Exportação",
  ];

  const subPermissoesConfiguracoes = [
    "Informações bancárias",
    "Plano Gym Connect",
    "Configurações Aplicativo",
    "Histórico de usuário",
    "Usuários (cadastro e consulta)",
    "Perfis (cadastro e consulta)",
  ];

  const togglePermissao = (permissao: string) => {
    setPermissoes((prev) =>
      prev.includes(permissao)
        ? prev.filter((p) => p !== permissao)
        : [...prev, permissao]
    );
  };

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-md sm:p-10 border border-gray-100">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-muted-foreground mb-6">
          <span className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
            Configurações
          </span>
          <ChevronRight className="mx-2 h-4 w-4" />
          <span className="font-medium text-primary">Cadastro de Perfil</span>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmitFunction)}
          {...rest}
          className="space-y-6"
        >
          {/* Nome e Filial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Nome do Perfil"
              name="nome"
              required
              formulario={form}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              width="w-full"
              placeholder="Ex.: Supervisor"
            />
            <InputSelectComponent
              label="Filial"
              name="filial"
              required
              formulario={form}
              value={filial}
              onChange={(e) => setFilial(e.target.value)}
              options={opcaoFilial}
              width="w-full"
            />
          </div>

          {/* Permissões */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Permissões
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {listaPermissoes.map((perm) => (
                <div key={perm} className="w-full">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={permissoes.includes(perm)}
                      onChange={() => togglePermissao(perm)}
                      className="mr-3 h-4 w-4 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">{perm}</span>
                  </label>

                  {/* Sub-permissões do módulo de Configurações */}
                  {perm === "Modulo de Configurações" &&
                    permissoes.includes("Modulo de Configurações") && (
                      <div className="ml-6 mt-2 space-y-2 border-l pl-4 border-gray-300">
                        {subPermissoesConfiguracoes.map((sub) => (
                          <label
                            key={sub}
                            className="flex items-center text-sm text-gray-600 hover:text-gray-800 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={permissoes.includes(sub)}
                              onChange={() => togglePermissao(sub)}
                              className="mr-2 h-4 w-4 text-primary"
                            />
                            {sub}
                          </label>
                        ))}
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>

          {/* Botão */}
          <div className="flex justify-end pt-4">
            <Button
              className="p-3 w-full sm:w-[160px] bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-colors"
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

export default CadastrarPerfis;
