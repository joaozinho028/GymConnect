"use client";

import Button from "@/components/Forms/Button";
import Input from "@/components/Forms/Input";
import InputSelect from "@/components/Forms/InputSelect";
import { useAuth } from "@/contexts/AuthContext";
import { GetForm } from "@/utils";
import { ChevronRight, Save } from "lucide-react";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import * as yup from "yup";

interface Transacao {
  id: string;
  valor: number;
  data: string;
  categoria: string;
  filial: string;
  tipoPagamento: string;
  tipo: string;
  descricao: string;
}
const tiposPagamento = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao", label: "Cartão" },
  { value: "pix", label: "Pix" },
];

const tiposTransacao = [
  { value: "entrada", label: "Entrada" },
  { value: "saida", label: "Saída" },
];

export default function TransacaoPage() {
  const { token } = useAuth();
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  const [categoria, setCategoria] = useState("");
  const [filial, setFilial] = useState("");
  const [tipoPagamento, setTipoPagamento] = useState("");
  const [tipoTransacao, setTipoTransacao] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categorias, setCategorias] = useState<
    { value: string; label: string }[]
  >([]);
  const [filiais, setFiliais] = useState<{ value: string; label: string }[]>(
    []
  );

  const [yupSchema, setYupSchema] = useState(yup.object().shape({}));
  const { handleSubmit, setValue, ...form } = GetForm(yupSchema, setYupSchema);

  const formWithSetValue = { ...form, setValue };

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/fluxo-caixa/listar-categorias`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        setCategorias(
          Array.isArray(data)
            ? data.map((c: any) => ({ value: String(c.id), label: c.name }))
            : []
        );
      } catch {
        setCategorias([]);
      }
    };
    fetchCategorias();
  }, [token]);

  useEffect(() => {
    const fetchFiliais = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/empresas/listar-filiais`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        setFiliais(
          Array.isArray(data)
            ? data.map((f: any) => ({
                value: String(f.id_filial ?? f.id),
                label: f.nome_filial ?? f.nome,
              }))
            : []
        );
      } catch {
        setFiliais([]);
      }
    };
    fetchFiliais();
  }, [token]);

  const onSubmitFunction = async () => {
    try {
      const body = {
        valor: Number(valor.replace(/\./g, "").replace(/,/, ".")),
        data,
        id_categoria: categoria,
        id_filial: filial,
        tipo_pagamento: tipoPagamento,
        tipo: tipoTransacao,
        descricao,
      };
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/fluxo-caixa/cadastrar-transacao`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );
      const dataRes = await res.json();
      if (res.ok) {
        Swal.fire({
          icon: "success",
          text: "Transação cadastrada com sucesso!",
          timer: 2500,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
        resetForm();
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text: dataRes?.message || "Erro ao cadastrar transação.",
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

  const aplicarMascaraValor = (valor: string) => {
    let v = valor.replace(/\D/g, "");
    v = (Number(v) / 100).toFixed(2).replace(".", ",");
    return v.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
  };

  const resetForm = () => {
    setValor("");
    setData("");
    setCategoria("");
    setFilial("");
    setTipoPagamento("");
    setTipoTransacao("");
    setDescricao("");
  };
  
  return (
    <div className="p-4 max-w-7xl mx-auto space-y-8">
      <div className="w-full bg-white p-6 rounded-lg shadow-md sm:p-10">
        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <span className="text-gray-500 hover:text-gray-700 cursor-pointer">
            Página Inicial
          </span>
          <ChevronRight className="mx-2 h-4 w-4" />
          <span className="font-medium text-primary">
            Cadastro de Transação
          </span>
        </div>
        <form onSubmit={handleSubmit(onSubmitFunction)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Valor"
              name="valor"
              required
              error="Preencha esse campo!"
              formulario={formWithSetValue}
              value={valor}
              onChange={(e) => setValor(aplicarMascaraValor(e.target.value))}
              placeholder="0,00"
            />
            <InputSelect
              label="Categoria"
              name="categoria"
              required
              error="Selecione uma categoria!"
              formulario={formWithSetValue}
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              options={categorias}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputSelect
              label="Filial"
              name="filial"
              required
              error="Selecione uma filial!"
              formulario={formWithSetValue}
              value={filial}
              onChange={(e) => setFilial(e.target.value)}
              options={filiais}
            />
            <InputSelect
              label="Tipo de Transação"
              name="tipoTransacao"
              required
              error="Selecione o tipo!"
              formulario={formWithSetValue}
              value={tipoTransacao}
              onChange={(e) => setTipoTransacao(e.target.value)}
              options={tiposTransacao}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputSelect
              label="Tipo de Pagamento"
              name="tipoPagamento"
              required
              error="Selecione o tipo de pagamento!"
              formulario={formWithSetValue}
              value={tipoPagamento}
              onChange={(e) => setTipoPagamento(e.target.value)}
              options={tiposPagamento}
            />
            <Input
              label="Descrição"
              name="descricao"
              required
              error="Preencha esse campo!"
              formulario={formWithSetValue}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
            <Input
              label="Data"
              name="data"
              type="date"
              required
              error="Preencha esse campo!"
              formulario={formWithSetValue}
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button
              className="p-2 w-full sm:w-[150px] bg-green-600 cursor-pointer hover:bg-green-700 text-white hover:text-white"
              // type="submit"
            >
              <Save size={18} className="inline-block mr-2" />
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
