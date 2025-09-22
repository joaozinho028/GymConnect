"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export const useIsAdmin = () => {
  const { token, user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkIfAdmin = async () => {
      if (!token || !user?.id_perfil) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Buscar os perfis da empresa
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
  }, [token, user?.id_perfil]);

  return { isAdmin, loading };
};
