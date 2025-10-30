"use client";

import Button from "@/components/Forms/Button";
import Input from "@/components/Forms/Input";
import InputSelectComponent from "@/components/Forms/InputSelect";
import { useAuth } from "@/contexts/AuthContext";
import { GetForm } from "@/utils";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import * as yup from "yup";

type FilialData = {
  value: number;
  label: string;
};

type categoriaData = {
  value: number;
  label: string;
};

const tiposPagamento = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao", label: "Cartão" },
  { value: "pix", label: "Pix" },
];

const tiposTransacao = [
  { value: "entrada", label: "Entrada" },
  { value: "saida", label: "Saída" },
];

const TransacaoPage = ({ ...rest }: any) => {
  const { onSuccess, onUpdateTransactions } = rest;
  const { token } = useAuth();
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [filial, setFilial] = useState("");
  const [tipoPagamento, setTipoPagamento] = useState("");
  const [tipoTransacao, setTipoTransacao] = useState("");

  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [recorrente, setRecorrente] = useState(false);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [filiais, setFiliais] = useState<FilialData[]>([]);
  const [todasFiliais, setTodasFiliais] = useState(false);

  const [categorias, setCategorias] = useState<categoriaData[]>([]);
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
            ? data.map((c: any) => ({
                value: c.id,
                label: c.nome || c.name,
              }))
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
                value: f.id_filial ?? f.id,
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

  const resetForm = () => {
    setValor("");
    setData("");
    setCategoria("");
    setFilial("");
    setTipoPagamento("");
    setTipoTransacao("");
    setDescricao("");
  };

  const onSubmitFunction = async () => {
    try {
      const formValues = form.getValues() as {
        id_categoria?: { value: number | string };
        id_filial?: { value: number | string };
        tipo_pagamento?: { value: string };
        tipo?: { value: string };
      };
      const categoriaValue = formValues.id_categoria?.value || "";
      const filialValue = formValues.id_filial?.value || "";
      const tipoPagamentoValue = formValues.tipo_pagamento?.value || "";
      const tipoTransacaoValue = formValues.tipo?.value || "";

      // Always send recurrence fields explicitly
      const body = {
        valor: Number(valor.replace(/\./g, "").replace(/,/, ".")),
        id_categoria: categoriaValue,
        id_filial: todasFiliais ? null : filialValue,
        tipo_pagamento: tipoPagamentoValue,
        tipo: tipoTransacaoValue,
        descricao,
        recorrente: recorrente || false,
        dataInicio: recorrente ? dataInicio : "",
        dataFim: recorrente ? dataFim : "",
        data: !recorrente ? data : "",
        todasFiliais: todasFiliais
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
          text: "Lançamento cadastrada com sucesso!",
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
          customClass: {
            container: 'swal-zindex'
          }
        });
        // Adiciona estilo global para z-index
        const style = document.createElement('style');
        style.innerHTML = `.swal-zindex { z-index: 9999 !important; }`;
        document.head.appendChild(style);
        resetForm();
        if (typeof onUpdateTransactions === "function") {
          await onUpdateTransactions();
        }
        if (typeof onSuccess === "function") {
          onSuccess();
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text: dataRes?.message || "Erro ao cadastrar Lançamento.",
          timer: 2500,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
          customClass: {
            container: 'swal-zindex'
          }
        });
        const style = document.createElement('style');
        style.innerHTML = `.swal-zindex { z-index: 9999 !important; }`;
        document.head.appendChild(style);
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

  return (
    <form {...rest} className="space-y-4">
      {/* Valor and Categoria on top, single row */}
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
        <InputSelectComponent
          label="Categoria"
          name="id_categoria"
          required
          error="Selecione uma categoria!"
          formulario={formWithSetValue}
          value={categoria}
          onChange={(selectedOption: any) => {
            setCategoria(selectedOption ? selectedOption.value : "");
            setValue("id_categoria", selectedOption);
          }}
          options={categorias}
        />
      </div>
      {/* Filial, Tipo de Lançamento, Tipo de Pagamento - new order, single row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col">
          <InputSelectComponent
            label="Filial"
            name="id_filial"
            required={!todasFiliais}
            error="Selecione uma filial!"
            formulario={formWithSetValue}
            value={filial}
            onChange={(selectedOption: any) => {
              setFilial(selectedOption ? selectedOption.value : "");
              setValue("id_filial", selectedOption);
            }}
            options={filiais}
            disabled={todasFiliais}
          />
          <div className="flex items-center mt-2">
            <input
              type="checkbox"
              id="todasFiliais"
              checked={todasFiliais}
              onChange={e => setTodasFiliais(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="todasFiliais" className="text-xs text-gray-600">Para todas as academias?</label>
          </div>
        </div>
        <InputSelectComponent
          label="Tipo de Lançamento"
          name="tipo"
          required
          error="Selecione o tipo!"
          formulario={formWithSetValue}
          value={tipoTransacao}
          onChange={(selectedOption: any) => {
            setTipoTransacao(selectedOption ? selectedOption.value : "");
            setValue("tipo", selectedOption);
          }}
          options={tiposTransacao}
        />
        <InputSelectComponent
          label="Forma de Pagamento"
          name="tipo_pagamento"
          required
          error="Selecione o tipo de pagamento!"
          formulario={formWithSetValue}
          value={tipoPagamento}
          onChange={(selectedOption: any) => {
            setTipoPagamento(selectedOption ? selectedOption.value : "");
            setValue("tipo_pagamento", selectedOption);
          }}
          options={tiposPagamento}
        />
      </div>
      {/* Divider and Períodos label */}
      <hr className="my-2" />
      <div className="flex items-center mb-2">
        <span className="text-sm text-gray-600">Períodos</span>
      </div>
      {/* Recorrente checkbox and date fields, styled for clarity */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="recorrente"
            checked={recorrente}
            onChange={(e) => setRecorrente(e.target.checked)}
          />
        <label htmlFor="recorrente" className="text-sm">É um lançamento recorrente?</label>
        </div>
        {recorrente ? (
          <Input
            label="Data inicial"
            name="dataInicio"
            type="date"
            required
            error="Preencha a data inicial!"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        ) : (
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
        )}
        {recorrente && (
          <Input
            label="Data final"
            name="dataFim"
            type="date"
            required
            error="Preencha a data final!"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        )}
      </div>
      {/* Descrição as textarea, full width */}
      <div className="w-full">
        <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
        <textarea
          id="descricao"
          name="descricao"
          required
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          rows={3}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descreva a Lançamento..."
        />
      </div>
      <div className="flex justify-end pt-4">
        <Button
          className="p-2 w-full sm:w-[150px] bg-green-600 cursor-pointer hover:bg-green-700 text-white hover:text-white"
          type="button"
          onClick={onSubmitFunction}
        >
          Salvar
        </Button>
      </div>
    </form>
  );
};

export default TransacaoPage;
