"use client";

import Button from "@/components/Forms/Button";
import Input from "@/components/Forms/Input";
import InputSelectComponent from "@/components/Forms/InputSelect";
import { useAuth } from "@/contexts/AuthContext";
import { GetForm } from "@/utils";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import * as yup from "yup";

const EditarCadastroPerfil = ({ perfil, onSave, ...rest }: any) => {
  const { token } = useAuth();
  const [opcoesFilial, setOpcoesFilial] = useState<any[]>([]);
  const schema = yup.object().shape({
    nome: yup.string().required("Preencha o nome!"),
    filial: yup.string().required("Selecione a filial!"),
  });

  const { handleSubmit, reset, getValues, ...form } = GetForm(schema);

  const [modulos, setModulos] = useState({
    alunos: false,
    filiais: false,
    fluxo_caixa: false,
    importacao: false,
    exportacao: false,
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

  const modulosList = [
    { key: "alunos", label: "Módulo de Alunos" },
    { key: "filiais", label: "Módulo de Filiais" },
    { key: "fluxo_caixa", label: "Módulo Fluxo de Caixa" },
    { key: "configuracoes", label: "Módulo de Configurações" },
    { key: "importacao", label: "Módulo de Importação" },
    { key: "exportacao", label: "Módulo de Exportação" },
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

  useEffect(() => {
    if (perfil) {
      reset({
        nome: perfil.nome || "",
        filial: perfil.id_filial ? perfil.id_filial.toString() : "",
      });

      // Carregar permissões do perfil selecionado
      if (perfil.id && token) {
        carregarPermissoesPerfil(perfil.id);
      }
    }
  }, [perfil, reset, token]);

  const carregarPermissoesPerfil = async (idPerfil: number) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/perfis/listar-permissoes-perfil?id_perfil=${idPerfil}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        const permissoes = data.permissoes || {};

        // Atualizar estado dos módulos principais
        setModulos({
          alunos: permissoes.alunos || false,
          filiais: permissoes.filiais || false,
          fluxo_caixa: permissoes.fluxo_caixa || false,
          importacao: permissoes.importacao || false,
          exportacao: permissoes.exportacao || false,
          configuracoes: permissoes.configuracoes ? true : false,
          precificacao: permissoes.precificacao ? true : false,
          ajuste_fluxo_caixa: permissoes.ajuste_fluxo_caixa ? true : false,
        });

        // Atualizar estado das sub-configurações
        if (
          permissoes.configuracoes &&
          typeof permissoes.configuracoes === "object"
        ) {
          setSubConfig({
            informacoes_bancarias:
              permissoes.configuracoes.informacoes_bancarias || false,
            plano_gym_connect:
              permissoes.configuracoes.plano_gym_connect || false,
            configuracoes_app:
              permissoes.configuracoes.configuracoes_app || false,
            historico_usuario:
              permissoes.configuracoes.historico_usuario || false,
            usuarios: permissoes.configuracoes.usuarios || false,
            perfis: permissoes.configuracoes.perfis || false,
          });
        } else {
          // Reset sub-configurações se não existir configuracoes
          setSubConfig({
            informacoes_bancarias: false,
            plano_gym_connect: false,
            configuracoes_app: false,
            historico_usuario: false,
            usuarios: false,
            perfis: false,
          });
        }

        // Atualizar estado das sub-precificações
        if (
          permissoes.precificacao &&
          typeof permissoes.precificacao === "object"
        ) {
          setSubPrecificacao({
            planos: permissoes.precificacao.planos || false,
          });
        } else {
          setSubPrecificacao({
            planos: false,
          });
        }

        // Atualizar estado das sub-ajustes de fluxo
        if (
          permissoes.ajuste_fluxo_caixa &&
          typeof permissoes.ajuste_fluxo_caixa === "object"
        ) {
          setSubAjusteFluxo({
            categorias: permissoes.ajuste_fluxo_caixa.categorias || false,
          });
        } else {
          setSubAjusteFluxo({
            categorias: false,
          });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
    }
  };

  useEffect(() => {
    async function fetchOpcoes() {
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
        }
      } catch (error) {
        console.error("Erro ao carregar filiais:", error);
      }
    }
    fetchOpcoes();
  }, [token]);

  const onSubmitFunction = async (values: any) => {
    try {
      // Criar objeto de permissões
      const permissoes_perfil = {
        alunos: modulos.alunos,
        filiais: modulos.filiais,
        fluxo_caixa: modulos.fluxo_caixa,
        importacao: modulos.importacao,
        exportacao: modulos.exportacao,
        configuracoes: modulos.configuracoes
          ? {
              informacoes_bancarias: subConfig.informacoes_bancarias,
              plano_gym_connect: subConfig.plano_gym_connect,
              configuracoes_app: subConfig.configuracoes_app,
              historico_usuario: subConfig.historico_usuario,
              usuarios: subConfig.usuarios,
              perfis: subConfig.perfis,
            }
          : false,
        precificacao: modulos.precificacao
          ? {
              planos: subPrecificacao.planos,
            }
          : false,
        ajuste_fluxo_caixa: modulos.ajuste_fluxo_caixa
          ? {
              categorias: subAjusteFluxo.categorias,
            }
          : false,
      };

      const body = {
        id_perfil: perfil.id,
        nome_perfil: values.nome,
        permissoes_perfil,
        id_filial:
          values.filial && values.filial !== ""
            ? parseInt(values.filial)
            : perfil.id_filial || null,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/perfis/editar-perfil`,
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
          text: data?.message || "Perfil atualizado com sucesso!",
          timer: 2500,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });

        if (onSave) {
          // Formatar permissões para exibição na tabela
          const permissoesFormatadas = [];

          if (modulos.alunos) permissoesFormatadas.push("Módulo Alunos");
          if (modulos.filiais) permissoesFormatadas.push("Módulo Filiais");
          if (modulos.fluxo_caixa)
            permissoesFormatadas.push("Módulo Fluxo De Caixa");
          if (modulos.importacao)
            permissoesFormatadas.push("Módulo Importação");
          if (modulos.exportacao)
            permissoesFormatadas.push("Módulo Exportação");

          if (modulos.configuracoes) {
            const subPermissoes = [];
            if (subConfig.informacoes_bancarias)
              subPermissoes.push("Informações Bancárias");
            if (subConfig.plano_gym_connect)
              subPermissoes.push("Plano Gym Connect");
            if (subConfig.configuracoes_app)
              subPermissoes.push("Configurações Aplicativo");
            if (subConfig.historico_usuario)
              subPermissoes.push("Histórico De Usuário");
            if (subConfig.usuarios) subPermissoes.push("Usuários");
            if (subConfig.perfis) subPermissoes.push("Perfis");

            if (subPermissoes.length > 0) {
              permissoesFormatadas.push(
                `Módulo Configurações (${subPermissoes.join(", ")})`
              );
            }
          }

          // Adicionar permissões de precificação formatadas
          if (modulos.precificacao) {
            const subPrecificacoes = [];
            if (subPrecificacao.planos) subPrecificacoes.push("Planos");

            if (subPrecificacoes.length > 0) {
              permissoesFormatadas.push(
                `Módulo Precificação (${subPrecificacoes.join(", ")})`
              );
            }
          }

          // Adicionar permissões de ajuste fluxo de caixa formatadas
          if (modulos.ajuste_fluxo_caixa) {
            const subAjustes = [];
            if (subAjusteFluxo.categorias) subAjustes.push("Categorias");

            if (subAjustes.length > 0) {
              permissoesFormatadas.push(
                `Ajustes Fluxo de Caixa (${subAjustes.join(", ")})`
              );
            }
          }

          // Buscar nome da filial selecionada
          const filialSelecionada = opcoesFilial.find(
            (f) => f.value.toString() === values.filial
          );

          onSave({
            ...perfil,
            id: perfil.id,
            nome: values.nome,
            permissoes: permissoesFormatadas,
            filial: filialSelecionada?.label || perfil.filial || "",
            updated_at: new Date().toISOString(),
          });
        }
      } else {
        Swal.fire({
          icon: "error",
          text: data?.message || "Erro ao atualizar perfil.",
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
    <div className="p-4 w-full space-y-8">
      <div className="w-full bg-white p-6 rounded-lg sm:p-10">
        <form {...rest} className="space-y-4 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nome" name="nome" formulario={form} width="w-full" />

            <InputSelectComponent
              label="Filial"
              name="filial"
              formulario={form}
              options={opcoesFilial}
              width="w-full"
            />
          </div>

          <hr />
          <div className="font-bold text-sm">
            <p>Alterar Configurações de Permissão</p>
          </div>

          <div className="space-y-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"></div>

          <div className="grid grid-cols-1 sm:flex sm:justify-end sm:space-x-4 gap-2 sm:pt-4">
            <Button
              className="p-2 w-full sm:w-[150px] bg-green-600 cursor-pointer hover:bg-green-700 text-white hover:text-white"
              type="button"
              onClick={handleSubmit(onSubmitFunction)}
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

export default EditarCadastroPerfil;
