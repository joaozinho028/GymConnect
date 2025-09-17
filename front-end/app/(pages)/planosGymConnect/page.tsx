"use client";

import Button from "@/components/Forms/Button";
import { Calendar, CheckCircle, CreditCard, Layers } from "lucide-react";

const PlanoGymConnect = ({ plano, pagamento, ...rest }: any) => {
  // Dados mock (substituir por props ou backend)
  const planoSelecionado = plano || {
    nome: "Plano Premium",
    valor: 199.9,
    duracao: "12 meses",
    recursos: [
      "Acesso ilimitado à plataforma",
      "Relatórios avançados",
      "Suporte prioritário",
    ],
  };

  const dadosPagamento = pagamento || {
    metodo: "Cartão de Crédito",
    dataPagamento: "14/08/2025",
    status: "Pago",
    transacaoId: "TX-123456789",
  };

  const statusClasses =
    dadosPagamento.status === "Pago"
      ? "text-green-600 bg-green-50 px-2 py-1 rounded-full"
      : "text-red-600 bg-red-50 px-2 py-1 rounded-full";

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Resumo do Plano Gym Connect
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card do Plano */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4 border border-gray-100 hover:shadow-lg transition">
          <div className="flex items-center gap-3 text-indigo-600">
            <Layers size={28} />
            <h2 className="text-xl font-semibold text-gray-800">
              {planoSelecionado.nome}
            </h2>
          </div>

          <p className="text-gray-600">
            <span className="font-medium">Valor:</span>{" "}
            <span className="text-gray-800 text-lg font-bold">
              R$ {planoSelecionado.valor.toFixed(2)}
            </span>
          </p>

          <p className="text-gray-600 flex items-center gap-2">
            <Calendar size={16} />
            <span>
              <strong>Duração:</strong> {planoSelecionado.duracao}
            </span>
          </p>

          <div>
            <strong className="text-gray-700">Recursos:</strong>
            <ul className="list-disc pl-5 mt-1 text-gray-600 space-y-1">
              {planoSelecionado.recursos.map((item: any, index: any) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Card do Pagamento */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4 border border-gray-100 hover:shadow-lg transition">
          <div className="flex items-center gap-3 text-green-600">
            <CreditCard size={28} />
            <h2 className="text-xl font-semibold text-gray-800">Pagamento</h2>
          </div>

          <p className="text-gray-600">
            <span className="font-medium">Método:</span> {dadosPagamento.metodo}
          </p>

          <p className="text-gray-600">
            <span className="font-medium">Data:</span>{" "}
            {dadosPagamento.dataPagamento}
          </p>

          <p className="flex items-center gap-2">
            <CheckCircle className="text-green-600" />
            <span className={statusClasses}>{dadosPagamento.status}</span>
          </p>

          <p className="text-gray-600">
            <span className="font-medium">ID da Transação:</span>{" "}
            {dadosPagamento.transacaoId}
          </p>
        </div>
      </div>

      {/* Botão de ação */}
      <div className="flex justify-end">
        <Button
          className="p-3 sm:w-[180px] bg-green-600 hover:bg-green-700 text-white text-lg font-medium shadow-md hover:shadow-lg transition"
          type="button"
          onClick={() => console.log("Salvar alterações")}
        >
          Salvar
        </Button>
      </div>
    </div>
  );
};

export default PlanoGymConnect;
