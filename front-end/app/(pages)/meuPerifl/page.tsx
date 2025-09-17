"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import UploadImage from "@/components/UploadImage/UploadComponent";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function ProfilePage() {
  const { token } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [empresaData, setEmpresaData] = useState<any>(null);
  const [filialData, setFilialData] = useState<any>(null);
  const [perfilData, setPerfilData] = useState<any>(null);
  const [ultimaAtividade, setUltimaAtividade] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [senhaNovaErro, setSenhaNovaErro] = useState("");
  // Função para validar força da senha
  function validarSenhaForte(senha: string) {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{6,}$/;
    return regex.test(senha);
  }

  const handleChangeSenha = async () => {
    setSenhaNovaErro("");
    if (!senhaAtual || !senhaNova) {
      Swal.fire({ icon: "warning", text: "Preencha todos os campos." });
      return;
    }
    if (!validarSenhaForte(senhaNova)) {
      setSenhaNovaErro(
        "A senha deve ter no mínimo 6 caracteres, incluindo letra, número e caractere especial."
      );
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/auth/alterar-senha", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ senhaAtual, senhaNova }),
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          icon: "success",
          text: data.message || "Senha alterada com sucesso!",
        });
        setIsDialogOpen(false);
        setSenhaAtual("");
        setSenhaNova("");
      } else {
        Swal.fire({
          icon: "error",
          text: data.message || "Erro ao alterar senha.",
        });
      }
    } catch (err) {
      Swal.fire({ icon: "error", text: "Erro ao conectar ao servidor." });
    }
  };
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [newAvatar, setNewAvatar] = useState<string | File | undefined>(
    undefined
  );
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  useEffect(() => {
    async function fetchProfile() {
      if (!token) return;
      const res = await fetch("http://localhost:5000/auth/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setUserData(data.usuario);
      setEmpresaData(data.empresa);
      setFilialData(data.filial);
      setPerfilData(data.perfil);
      // Usar avatar_url do backend
      setAvatarUrl(data.usuario?.avatar_url || "");
      // Salvar data/hora da última atividade no localStorage
      const now = new Date().toLocaleString();
      localStorage.setItem("ultima_atividade", now);
      setUltimaAtividade(now);
    }
    // Buscar última atividade do localStorage ao montar
    const last = localStorage.getItem("ultima_atividade") || "-";
    setUltimaAtividade(last);
    fetchProfile();
  }, [token]);

  console.log("token aqui", token);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleChangeSenha();
  };

  const handleSavePhoto = async () => {
    if (!newAvatar || !userData) return;
    // Só aceita File, não string/base64
    if (typeof newAvatar === "string") {
      Swal.fire({ icon: "error", text: "Selecione uma imagem válida." });
      return;
    }
    if (newAvatar.size > 2 * 1024 * 1024) {
      Swal.fire({ icon: "error", text: "Imagem muito grande. Máximo 2MB." });
      return;
    }
    const formData = new FormData();
    formData.append("avatar", newAvatar);
    try {
      const res = await fetch("http://localhost:5000/auth/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({ icon: "success", text: data.message || "Foto alterada!" });
        setAvatarUrl(data.url || "");
        setIsPhotoDialogOpen(false);
        setNewAvatar(undefined);
      } else {
        Swal.fire({
          icon: "error",
          text: data.message || "Erro ao enviar imagem.",
        });
      }
    } catch (err) {
      Swal.fire({ icon: "error", text: "Erro ao conectar ao servidor." });
    }
  };

  console.log(userData);

  if (!userData || !empresaData || !filialData || !perfilData) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Informações do Usuário */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Informações do Usuário</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="cursor-pointer"
              variant="outline"
              onClick={() => setIsPhotoDialogOpen(true)}
            >
              Alterar foto
            </Button>
            <Button
              size="sm"
              className="cursor-pointer"
              variant="outline"
              onClick={() => setIsDialogOpen(true)}
            >
              Alterar senha
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage
                src={
                  avatarUrl ||
                  "https://ui-avatars.com/api/?name=" + userData.nome_usuario
                }
              />
              <AvatarFallback>{userData.nome_usuario?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{userData.nome_usuario}</p>
              <p className="text-sm text-muted-foreground">
                {userData.email_usuario}
              </p>
            </div>
          </div>
          {/* Dialog para alterar foto de perfil */}
          <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Alterar foto de perfil</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <UploadImage
                  label="Nova foto de perfil"
                  value={newAvatar}
                  onChange={(val) => setNewAvatar(val ?? undefined)}
                />
              </div>
              <DialogFooter className="mt-4">
                <Button
                  className="cursor-pointer"
                  variant="outline"
                  onClick={() => setIsPhotoDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="cursor-pointer bg-green-600"
                  onClick={handleSavePhoto}
                  disabled={!newAvatar}
                >
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Perfil</p>
              <p className="font-medium">{perfilData.nome_perfil}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Última Atividade</p>
              <p className="font-medium">{ultimaAtividade}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações da Empresa */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nome da Empresa</p>
              <p className="font-medium">{empresaData.nome_empresa}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Filial</p>
              <p className="font-medium">{filialData.nome_filial}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Endereço</p>
              <p className="font-medium">
                {filialData.endereco?.rua}, {filialData.endereco?.numero} -{" "}
                {filialData.endereco?.bairro}, {filialData.endereco?.cidade} -{" "}
                {filialData.endereco?.estado}, {filialData.endereco?.cep}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para editar informações */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-sm font-medium" htmlFor="senhaAtual">
                Senha Atual
              </label>
              <Input
                id="senhaAtual"
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="senhaNova">
                Nova Senha
              </label>
              <Input
                id="senhaNova"
                type="password"
                value={senhaNova}
                onChange={(e) => setSenhaNova(e.target.value)}
                autoComplete="new-password"
              />
              {senhaNovaErro && (
                <p className="text-xs text-red-600 mt-1">{senhaNovaErro}</p>
              )}
            </div>
            <DialogFooter className="mt-4">
              <Button
                className="cursor-pointer"
                variant="outline"
                type="button"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button className="cursor-pointer bg-green-600" type="submit">
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
