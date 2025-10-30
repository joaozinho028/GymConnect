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
  onUpdateTransactions?: () => void | Promise<void>;
}

const FormTransacao: React.FC<FormTransacaoProps> = ({
  showTransactionModal,
  editTransaction,
  setShowTransactionModal,
  setActiveTab,
  ...rest
}) => {
  if (!showTransactionModal) return null;
  return (
    <ModalComponent
      header={editTransaction ? "Editar Lançamento" : "Novo Lançamento"}
      opened={showTransactionModal}
      onClose={() => {
        setShowTransactionModal(false);
        setActiveTab("geral");
      }}
    >
      <TransacaoPage {...rest} onSuccess={() => {
        setShowTransactionModal(false);
        setActiveTab("geral");
      }} />
    </ModalComponent>
  );
};

export default FormTransacao;
