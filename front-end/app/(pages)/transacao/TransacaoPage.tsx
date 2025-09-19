"use client";
import Button from "@/components/Forms/Button";
import Input from "@/components/Forms/Input";
import InputSelectComponent from "@/components/Forms/InputSelect";
import { GetForm } from "@/utils";
import { Save } from "lucide-react";
import { useState } from "react";
import * as yup from "yup";

interface Transacao {
  id: string;
  valor: number;
  data: string;
  categoria: string;
  filial: string;
  tipoPagamento: string;
  descricao: string;
}

const categorias = [
  { value: "mensalidade", label: "Mensalidade" },
  { value: "despesas", label: "Despesas" },
  { value: "investimentos", label: "Investimentos" },
];

const filiais = [
  { value: "matriz", label: "Matriz" },
  { value: "filial1", label: "Filial 1" },
  { value: "filial2", label: "Filial 2" },
];

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
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [editando, setEditando] = useState<Transacao | null>(null);

  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  const [categoria, setCategoria] = useState("");
  const [filial, setFilial] = useState("");
  const [tipoPagamento, setTipoPagamento] = useState("");
  const [tipoTransacao, setTipoTransacao] = useState("");
  const [descricao, setDescricao] = useState("");

  const yupSchema = yup.object().shape({
    valor: yup.string().required("Preencha o valor"),
    data: yup.string().required("Informe a data"),
    categoria: yup.string().required("Selecione a categoria"),
    filial: yup.string().required("Selecione a filial"),
    tipoPagamento: yup.string().required("Selecione o tipo de pagamento"),
    descricao: yup.string().required("Digite a descrição"),
  });

  const { handleSubmit, ...form } = GetForm(yupSchema);

  const resetForm = () => {
    setValor("");
    setData("");
    setCategoria("");
    setFilial("");
    setTipoPagamento("");
    setDescricao("");
    setEditando(null);
  };

  const onSubmitFunction = async () => {
    if (editando) {
      // Edição
      setTransacoes((prev) =>
        prev.map((t) =>
          t.id === editando.id
            ? {
                ...editando,
                valor: Number(valor),
                data,
                categoria,
                filial,
                tipoPagamento,
                descricao,
              }
            : t
        )
      );
    } else {
      // Cadastro novo
      const novaTransacao: Transacao = {
        id: Date.now().toString(),
        valor: Number(valor),
        data,
        categoria,
        filial,
        tipoPagamento,
        descricao,
      };
      setTransacoes((prev) => [...prev, novaTransacao]);
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    setTransacoes((prev) => prev.filter((t) => t.id !== id));
  };

  const handleEdit = (transacao: Transacao) => {
    setEditando(transacao);
    setValor(transacao.valor.toString());
    setData(transacao.data);
    setCategoria(transacao.categoria);
    setFilial(transacao.filial);
    setTipoPagamento(transacao.tipoPagamento);
    setDescricao(transacao.descricao);
  };

  return (
    <div className="p-6 w-full">
      {/* Formulário */}
      <form
        onSubmit={handleSubmit(onSubmitFunction)}
        className="space-y-4 mb-8"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputSelectComponent
            label="Tipo de Transação"
            name="tipoTransacao"
            required
            formulario={form}
            value={tipoTransacao}
            onChange={(e) => setTipoTransacao(e.target.value)}
            options={tiposTransacao}
          />
          <Input
            label="Valor"
            name="valor"
            type="number"
            required
            formulario={form}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Data"
            name="data"
            type="date"
            required
            formulario={form}
            value={data}
            onChange={(e) => setData(e.target.value)}
          />

          <InputSelectComponent
            label="Categoria"
            name="categoria"
            required
            formulario={form}
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            options={categorias}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputSelectComponent
            label="Filial"
            name="filial"
            required
            formulario={form}
            value={filial}
            onChange={(e) => setFilial(e.target.value)}
            options={filiais}
          />
          <InputSelectComponent
            label="Tipo de Pagamento"
            name="tipoPagamento"
            required
            formulario={form}
            value={tipoPagamento}
            onChange={(e) => setTipoPagamento(e.target.value)}
            options={tiposPagamento}
          />
        </div>

        <div className="grid grid-cols-1 sm:flex sm:justify-end sm:space-x-4 gap-2 sm:pt-4 mt-10">
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
  );
}
