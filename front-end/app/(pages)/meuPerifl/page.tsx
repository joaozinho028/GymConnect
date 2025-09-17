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

export default function ProfilePage() {
  const { token } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [empresaData, setEmpresaData] = useState<any>(null);
  const [filialData, setFilialData] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [newAvatar, setNewAvatar] = useState<string | File | undefined>(
    undefined
  );

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
    }
    fetchProfile();
  }, [token]);

  const handleSave = () => {
    setIsDialogOpen(false);
  };

  const handleSavePhoto = () => {
    if (newAvatar && userData) {
      setUserData((prev: any) => ({
        ...prev,
        avatar_url:
          typeof newAvatar === "string"
            ? newAvatar
            : URL.createObjectURL(newAvatar),
      }));
      setIsPhotoDialogOpen(false);
      setNewAvatar(undefined);
    }
  };

  if (!userData || !empresaData || !filialData) {
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
                  userData.avatar_url ||
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
              <p className="font-medium">{userData.id_perfil}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Última Atividade</p>
              <p className="font-medium">{userData.ultima_atividade || "-"}</p>
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

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium" htmlFor="nome">
                Senha Atual
              </label>
              <Input id="senhaAtual" type="password" />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="email">
                Nova Senha
              </label>
              <Input id="senhaNova" type="password" />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              className="cursor-pointer"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="cursor-pointer bg-green-600"
              onClick={handleSave}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
