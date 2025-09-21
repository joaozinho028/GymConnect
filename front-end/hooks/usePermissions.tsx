"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";

interface Permissoes {
  alunos: boolean;
  filiais: boolean;
  fluxo_caixa: boolean;
  importacao: boolean;
  exportacao: boolean;
  configuracoes?: {
    informacoes_bancarias: boolean;
    plano_gym_connect: boolean;
    configuracoes_app: boolean;
    historico_usuario: boolean;
    usuarios: boolean;
    perfis: boolean;
  };
}

interface DecodedToken {
  id_usuario: number;
  id_empresa: number;
  id_filial: number;
  id_perfil: number;
  nome_usuario: string;
  email_usuario: string;
  permissoes: Permissoes;
  iat: number;
  exp: number;
}

export const usePermissions = () => {
  const { token } = useAuth();

  const permissions = useMemo(() => {
    if (!token) {
      return {
        alunos: false,
        filiais: false,
        fluxo_caixa: false,
        importacao: false,
        exportacao: false,
        configuracoes: {
          informacoes_bancarias: false,
          plano_gym_connect: false,
          configuracoes_app: false,
          historico_usuario: false,
          usuarios: false,
          perfis: false,
        },
      };
    }

    try {
      // Decodifica o token JWT (apenas a parte do payload)
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );

      const decoded: DecodedToken = JSON.parse(jsonPayload);
      const basePermissions = decoded.permissoes || {
        alunos: false,
        filiais: false,
        fluxo_caixa: false,
        importacao: false,
        exportacao: false,
      };

      return {
        ...basePermissions,
        configuracoes: basePermissions.configuracoes || {
          informacoes_bancarias: false,
          plano_gym_connect: false,
          configuracoes_app: false,
          historico_usuario: false,
          usuarios: false,
          perfis: false,
        },
      };
    } catch (error) {
      console.error("Erro ao decodificar token:", error);
      return {
        alunos: false,
        filiais: false,
        fluxo_caixa: false,
        importacao: false,
        exportacao: false,
        configuracoes: {
          informacoes_bancarias: false,
          plano_gym_connect: false,
          configuracoes_app: false,
          historico_usuario: false,
          usuarios: false,
          perfis: false,
        },
      };
    }
  }, [token]);

  return permissions;
};
