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

const CadastrarPerfis = ({ ...rest }: any) => {
  const [nome, setNome] = useState("");
  // Remover o estado separado de filial, pois o controle será pelo form
  const [filiais, setFiliais] = useState<{ value: string; label: string }[]>(
    []
  );
  const { token } = useAuth();
  // Permissões dos módulos principais
  const [modulos, setModulos] = useState({
    alunos: false,
    filiais: false,
    fluxo_caixa: false,
    // importacao: false,
    // exportacao: false,
    configuracoes: false,
    precificacao: false,
    ajuste_fluxo_caixa: false,
  });
  // Permissões dos submenus de configurações
  const [subConfig, setSubConfig] = useState({
    informacoes_bancarias: false,
    plano_gym_connect: false,
    configuracoes_app: false,
    historico_usuario: false,
    usuarios: false,
    perfis: false,
  });

  // Permissões dos submenus de precificação
  const [subPrecificacao, setSubPrecificacao] = useState({
    planos: false,
  });

  // Permissões dos submenus de ajuste fluxo de caixa
  const [subAjusteFluxo, setSubAjusteFluxo] = useState({
    categorias: false,
  });

  const schema = yup.object().shape({
    nome: yup.string().required("Preencha o nome do perfil!"),
    filial: yup.string().required("Selecione a filial!"),
  });
  const { handleSubmit, ...form } = GetForm(schema);

  const onSubmitFunction = async (values: any) => {
    const permissoes_perfil: any = {
      alunos: modulos.alunos,
      filiais: modulos.filiais,
      fluxo_caixa: modulos.fluxo_caixa,
      // importacao: modulos.importacao,
      // exportacao: modulos.exportacao,
    };

    if (modulos.configuracoes) {
      permissoes_perfil.configuracoes = { ...subConfig };
    }

    if (modulos.precificacao) {
      permissoes_perfil.precificacao = { ...subPrecificacao };
    }

    if (modulos.ajuste_fluxo_caixa) {
      permissoes_perfil.ajuste_fluxo_caixa = { ...subAjusteFluxo };
    }

    const payload = {
      nome_perfil: values.nome,
      id_filial: values.filial,
      permissoes_perfil,
    };
    console.log("Enviando para o backend:", payload);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/perfis/cadastrar-perfil`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          Swal.fire({
            icon: "warning",
            text:
              data?.message ||
              "Já existe um perfil com esse nome para esta empresa.",
            timer: 2500,
            showConfirmButton: false,
            toast: true,
            position: "top-end",
          });
          return;
        }
        Swal.fire({
          icon: "error",
          text: data?.message || "Erro ao cadastrar perfil.",
          timer: 2500,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
        return;
      }
      Swal.fire({
        icon: "success",
        text: data?.message || "Perfil cadastrado com sucesso!",
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
      // Limpar formulário se desejar
      setNome("");
      setModulos({
        alunos: false,
        filiais: false,
        fluxo_caixa: false,
        // importacao: false,
        // exportacao: false,
        configuracoes: false,
        precificacao: false,
        ajuste_fluxo_caixa: false,
      });
      setSubConfig({
        informacoes_bancarias: false,
        plano_gym_connect: false,
        configuracoes_app: false,
        historico_usuario: false,
        usuarios: false,
        perfis: false,
      });
      setSubPrecificacao({
        planos: false,
      });
      setSubAjusteFluxo({
        categorias: false,
      });
      if (form.reset) form.reset();
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

  useEffect(() => {
    async function fetchFiliais() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/empresas/listar-filiais`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setFiliais(
            (data || []).map((f: any) => ({
              value: f.id_filial ?? f.id,
              label: f.nome_filial ?? f.nome,
            }))
          );
        } else {
          setFiliais([]);
        }
      } catch {
        setFiliais([]);
      }
    }
    fetchFiliais();
  }, [token]);

  // Utilitários para labels e chaves
  const modulosList = [
    { key: "alunos", label: "Módulo de Alunos" },
    { key: "filiais", label: "Módulo de Filiais" },
    { key: "fluxo_caixa", label: "Módulo Fluxo de Caixa" },
    { key: "configuracoes", label: "Módulo de Configurações" },
    // { key: "importacao", label: "Módulo de Importação" },
    // { key: "exportacao", label: "Módulo de Exportação" },
    { key: "precificacao", label: "Módulo de Precificação" },
    { key: "ajuste_fluxo_caixa", label: "Ajustes Fluxo de Caixa" },
  ];

  const subConfigList = [
    { key: "informacoes_bancarias", label: "Informações bancárias" },
    { key: "plano_gym_connect", label: "Plano Gym Connect" },
    { key: "configuracoes_app", label: "Configurações Aplicativo" },
    { key: "historico_usuario", label: "Histórico de usuário" },
    { key: "usuarios", label: "Usuários (cadastro e consulta)" },
    { key: "perfis", label: "Perfis (cadastro e consulta)" },
  ];

  const subPrecificacaoList = [{ key: "planos", label: "Planos" }];

  const subAjusteFluxoList = [{ key: "categorias", label: "Categorias" }];

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
              width="w-full"
              placeholder="Ex.: Supervisor"
              error="Preencha esse campo!"
            />
            <InputSelectComponent
              label="Filial"
              name="filial"
              required
              formulario={form}
              options={filiais}
              error="Preencha esse campo!"
              width="w-full"
            />
          </div>

          {/* Permissões */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Permissões
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {modulosList.map((mod) => (
                <div key={mod.key} className="w-full">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={modulos[mod.key as keyof typeof modulos]}
                      onChange={() =>
                        setModulos((prev) => ({
                          ...prev,
                          [mod.key]: !prev[mod.key as keyof typeof modulos],
                        }))
                      }
                      className="mr-3 h-4 w-4 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">{mod.label}</span>
                  </label>

                  {/* Sub-permissões do módulo de Configurações */}
                  {mod.key === "configuracoes" && modulos.configuracoes && (
                    <div className="ml-6 mt-2 space-y-2 border-l pl-4 border-gray-300">
                      {subConfigList.map((sub) => (
                        <label
                          key={sub.key}
                          className="flex items-center text-sm text-gray-600 hover:text-gray-800 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={
                              subConfig[sub.key as keyof typeof subConfig]
                            }
                            onChange={() =>
                              setSubConfig((prev) => ({
                                ...prev,
                                [sub.key]:
                                  !prev[sub.key as keyof typeof subConfig],
                              }))
                            }
                            className="mr-2 h-4 w-4 text-primary"
                          />
                          {sub.label}
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Sub-permissões do módulo de Precificação */}
                  {mod.key === "precificacao" && modulos.precificacao && (
                    <div className="ml-6 mt-2 space-y-2 border-l pl-4 border-gray-300">
                      {subPrecificacaoList.map((sub) => (
                        <label
                          key={sub.key}
                          className="flex items-center text-sm text-gray-600 hover:text-gray-800 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={
                              subPrecificacao[
                                sub.key as keyof typeof subPrecificacao
                              ]
                            }
                            onChange={() =>
                              setSubPrecificacao((prev) => ({
                                ...prev,
                                [sub.key]:
                                  !prev[
                                    sub.key as keyof typeof subPrecificacao
                                  ],
                              }))
                            }
                            className="mr-2 h-4 w-4 text-primary"
                          />
                          {sub.label}
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Sub-permissões do módulo de Ajuste Fluxo de Caixa */}
                  {mod.key === "ajuste_fluxo_caixa" &&
                    modulos.ajuste_fluxo_caixa && (
                      <div className="ml-6 mt-2 space-y-2 border-l pl-4 border-gray-300">
                        {subAjusteFluxoList.map((sub) => (
                          <label
                            key={sub.key}
                            className="flex items-center text-sm text-gray-600 hover:text-gray-800 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={
                                subAjusteFluxo[
                                  sub.key as keyof typeof subAjusteFluxo
                                ]
                              }
                              onChange={() =>
                                setSubAjusteFluxo((prev) => ({
                                  ...prev,
                                  [sub.key]:
                                    !prev[
                                      sub.key as keyof typeof subAjusteFluxo
                                    ],
                                }))
                              }
                              className="mr-2 h-4 w-4 text-primary"
                            />
                            {sub.label}
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
