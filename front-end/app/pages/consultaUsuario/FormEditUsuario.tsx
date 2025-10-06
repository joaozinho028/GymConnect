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

const EditarCadastroUsuario = ({ usuario, onSave, ...rest }: any) => {
  const { token } = useAuth();
  const [opcoesPerfil, setOpcoesPerfil] = useState<any[]>([]);
  const [opcoesFilial, setOpcoesFilial] = useState<any[]>([]);

  const schema = yup.object().shape({
    nome: yup.string().required("Preencha o nome!"),
    email: yup.string().email("Email inválido!").required("Preencha o email!"),
    perfil: yup.string().required("Selecione o perfil!"),
    filial: yup.string().required("Selecione a filial!"),
    status: yup.string().required("Selecione o status!"),
  });

  const { handleSubmit, reset, getValues, ...form } = GetForm(schema);

  useEffect(() => {
    if (usuario) {
      reset({
        nome: usuario.nome || "",
        email: usuario.email || "",
        perfil: usuario.id_perfil ? usuario.id_perfil.toString() : "",
        filial: usuario.id_filial ? usuario.id_filial.toString() : "",
        status: usuario.status_usuario ? "ativo" : "inativo",
      });
    }
  }, [usuario, reset]);

  useEffect(() => {
    async function fetchOpcoes() {
      try {
        const resPerfil = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/empresas/listar-perfis`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (resPerfil.ok) {
          const dataPerfil = await resPerfil.json();
          setOpcoesPerfil(
            (dataPerfil || []).map((p: any) => ({
              value: p.id_perfil ?? p.id,
              label: p.nome_perfil ?? p.nome,
            }))
          );
        }
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
      } catch {}
    }
    fetchOpcoes();
  }, [token]);

  const onSubmitFunction = async (values: any) => {
    try {
      // Lógica corrigida para id_perfil e id_filial
      let id_perfil_final;
      let id_filial_final;

      // Para perfil: se foi selecionado um novo valor, usa ele; senão mantém o original
      if (values.perfil && values.perfil !== "") {
        id_perfil_final = parseInt(values.perfil);
      } else {
        id_perfil_final = usuario.id_perfil;
      }

      // Para filial: se foi selecionado um novo valor, usa ele; senão mantém o original
      if (values.filial && values.filial !== "") {
        id_filial_final = parseInt(values.filial);
      } else {
        id_filial_final = usuario.id_filial;
      }

      const body = {
        id_usuario: usuario.id,
        nome_usuario: values.nome,
        email_usuario: values.email,
        id_perfil: id_perfil_final,
        id_filial: id_filial_final,
      };

      console.log("Dados sendo enviados:", body); // Para debug

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/usuarios/editar-usuario`,
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
          text: data?.message || "Usuário atualizado com sucesso!",
          timer: 2500,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });

        if (onSave) {
          // Obter os nomes do perfil e filial selecionados
          const perfilSelecionado = opcoesPerfil.find(
            (p) =>
              p.value.toString() ===
              (values.perfil || usuario.id_perfil.toString())
          );

          const filialSelecionada = opcoesFilial.find(
            (f) =>
              f.value.toString() ===
              (values.filial || usuario.id_filial.toString())
          );

          onSave({
            ...usuario,
            nome: values.nome,
            email: values.email,
            id_perfil: id_perfil_final,
            id_filial: id_filial_final,
            perfil: perfilSelecionado?.label || usuario.perfil,
            filial: filialSelecionada?.label || usuario.filial,
            updated_at: new Date().toISOString(),
          });
        }
      } else {
        Swal.fire({
          icon: "error",
          text: data?.message || "Erro ao atualizar usuário.",
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
        <form
          onSubmit={handleSubmit(onSubmitFunction)}
          {...rest}
          className="space-y-4 w-full"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nome" name="nome" formulario={form} width="w-full" />
            <Input
              label="Email"
              name="email"
              type="email"
              formulario={form}
              width="w-full"
            />
          </div>

          <hr />
          <div className="font-bold text-sm">
            <p>Alterar Configurações</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputSelectComponent
              label="Perfil"
              name="perfil"
              formulario={form}
              options={opcoesPerfil}
              width="w-full"
            />
            <InputSelectComponent
              label="Filial"
              name="filial"
              formulario={form}
              options={opcoesFilial}
              width="w-full"
            />
          </div>

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

export default EditarCadastroUsuario;
