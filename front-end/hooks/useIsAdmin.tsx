"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export const useIsAdmin = () => {
  const { token, user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Função para limpar o cache de permissões (pode ser útil para forçar uma nova verificação)
  const clearAdminCache = () => {
    if (user?.id_perfil && user?.id_empresa) {
      const storageKey = `isAdmin_${user.id_perfil}_${user.id_empresa}`;
      localStorage.removeItem(storageKey);
    }
  };

  useEffect(() => {
    const checkIfAdmin = async () => {
      if (!token || !user?.id_perfil) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Chave única para o localStorage baseada no usuário
        const storageKey = `isAdmin_${user.id_perfil}_${user.id_empresa}`;

        // Verificar se já temos a informação no localStorage
        const cachedIsAdmin = localStorage.getItem(storageKey);

        if (cachedIsAdmin !== null) {
          // Se temos no cache, usar diretamente
          setIsAdmin(cachedIsAdmin === "true");
          setLoading(false);
          return;
        }

        setLoading(true);

        // Buscar os perfis da empresa apenas se não estiver no cache
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/empresas/listar-perfis`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const perfis = await response.json();

          // Encontrar o perfil do usuário atual
          const perfilUsuario = perfis.find(
            (perfil: any) => perfil.id_perfil === user.id_perfil
          );

          // Verificar se o nome do perfil é "administrador" (case insensitive)
          const isAdministrador =
            perfilUsuario?.nome_perfil?.toLowerCase() === "administrador";

          // Salvar no localStorage para futuras consultas
          localStorage.setItem(storageKey, isAdministrador.toString());

          setIsAdmin(isAdministrador);
        } else {
          console.error("Erro ao buscar perfis");
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Erro ao verificar se é administrador:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkIfAdmin();
  }, [token, user?.id_perfil, user?.id_empresa]);

  return { isAdmin, loading, clearAdminCache };
};
