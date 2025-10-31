import React, { useState } from "react";

interface UploadArquivosProps {
  idEmpresa: string;
  idFilial: string;
  idAluno: string;
  onUpload?: (fileUrl: string) => void;
}

export const UploadArquivos: React.FC<UploadArquivosProps> = ({
  idEmpresa,
  idFilial,
  idAluno,
  onUpload,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setError(null);
    setSuccess(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("id_empresa", idEmpresa);
      formData.append("id_filial", idFilial);
      formData.append("id_aluno", idAluno);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/upload-arquivo`,
        {
          method: "POST",
          body: formData,
        }
      );
      const result = await response.json();
      setUploading(false);
      if (!response.ok || result.error) {
        setError(
          "Erro ao enviar arquivo: " + (result.error || response.statusText)
        );
      } else {
        setSuccess("Arquivo enviado com sucesso!");
        if (onUpload) onUpload(result.url);
      }
    } catch (err: any) {
      setUploading(false);
      setError("Erro ao enviar arquivo: " + err.message);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        type="file"
        onChange={handleFileChange}
        disabled={uploading}
        className="border rounded px-2 py-1"
      />
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {uploading ? "Enviando..." : "Enviar arquivo"}
      </button>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">{success}</div>}
    </div>
  );
};
