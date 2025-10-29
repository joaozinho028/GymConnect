import ModalComponent from "@/components/Modal/ModalComponent";
import React from "react";
import TransacaoPage from "../transacao/TransacaoPage";
import { Transaction } from "./fluxoGeral";

interface FormTransacaoProps {
  showTransactionModal: boolean;
  editTransaction: Transaction | null;
  transactionForm: Transaction | null;
  setShowTransactionModal: (v: boolean) => void;
  setActiveTab: (tab: "geral" | "filiais" | "nova") => void;
}

const FormTransacao: React.FC<FormTransacaoProps> = ({
  showTransactionModal,
  editTransaction,
  setShowTransactionModal,
  setActiveTab,
}) => {
  if (!showTransactionModal) return null;
  return (
    <ModalComponent
      header={editTransaction ? "Editar Transação" : "Nova Transação"}
      opened={showTransactionModal}
      onClose={() => {
        setShowTransactionModal(false);
        setActiveTab("geral");
      }}
    >
      <TransacaoPage />
    </ModalComponent>
  );
};

export default FormTransacao;
