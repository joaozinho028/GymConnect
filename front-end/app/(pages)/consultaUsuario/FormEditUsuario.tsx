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
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.id_perfil || "",
        filial: usuario.id_filial || "",
        status: usuario.status_usuario ? "ativo" : "inativo",
      });
    }
  }, [usuario, reset]);

  useEffect(() => {
    async function fetchOpcoes() {
      try {
        const resPerfil = await fetch(
          "http://localhost:5000/empresas/listar-perfis",
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
          "http://localhost:5000/empresas/listar-filiais",
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
      const body = {
        id_usuario: usuario.id,
        nome_usuario: values.nome,
        email_usuario: values.email,
        id_perfil: values.perfil,
        id_filial: values.filial,
        status_usuario: values.status === "ativo",
      };
      const res = await fetch(
        `http://localhost:5000/usuarios/atualizar-usuario`,
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
        if (onSave) onSave({ ...usuario, ...body });
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
    <div className="p-4 max-w-2xl mx-auto space-y-8">
      <div className="w-full bg-white p-6 rounded-lg sm:p-10">
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
              width="w-full"
            />
            <Input
              label="Email"
              name="email"
              type="email"
              error="Preencha esse campo!"
              required
              formulario={form}
              width="w-full"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputSelectComponent
              label="Perfil"
              name="perfil"
              required
              error="Selecione o perfil!"
              formulario={form}
              options={opcoesPerfil}
              width="w-full"
            />
            <InputSelectComponent
              label="Filial"
              name="filial"
              required
              error="Selecione a filial!"
              formulario={form}
              options={opcoesFilial}
              width="w-full"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputSelectComponent
              label="Status"
              name="status"
              required
              error="Selecione o status!"
              formulario={form}
              options={[
                { value: "ativo", label: "Ativo" },
                { value: "inativo", label: "Inativo" },
              ]}
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
