import React, { useState } from "react";
import Swal from "sweetalert2";
import { Send } from "lucide-react";

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

  const MAX_SIZE_MB = 5;
  const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska", "video/webm"];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setError(null);
    setSuccess(null);
    if (selectedFile) {
      if (selectedFile.size > MAX_SIZE_MB * 1024 * 1024) {
        setFile(null);
        Swal.fire({
          icon: "error",
          title: "Arquivo muito grande",
          text: `Máximo permitido: ${MAX_SIZE_MB}MB.`,
        });
        return;
      }
      if (VIDEO_TYPES.includes(selectedFile.type)) {
        setFile(null);
        Swal.fire({
          icon: "error",
          title: "Tipo de arquivo não permitido",
          text: "Não é permitido enviar vídeos neste momento.",
        });
        return;
      }
      setFile(selectedFile);
    } else {
      setFile(null);
    }
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
        setError("Erro ao enviar arquivo: " + (result.error || response.statusText));
        Swal.fire({
          icon: "error",
          title: "Erro ao enviar arquivo",
          text: result.error || response.statusText,
        });
      } else {
        setSuccess("Arquivo enviado com sucesso!");
        Swal.fire({
          icon: "success",
          title: "Arquivo enviado com sucesso!",
          showConfirmButton: false,
          timer: 1500,
        });
        if (onUpload) onUpload(result.url);
      }
    } catch (err: any) {
      setUploading(false);
      setError("Erro ao enviar arquivo: " + err.message);
      Swal.fire({
        icon: "error",
        title: "Erro ao enviar arquivo",
        text: err.message,
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          id="upload-arquivo-input"
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
        <label
          htmlFor="upload-arquivo-input"
          className={`cursor-pointer px-4 py-2 rounded border bg-gray-100 text-gray-700 hover:bg-gray-200 transition ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {file ? 'Trocar arquivo' : 'Escolher arquivo'}
        </label>
        {file && (
          <span className="text-sm text-gray-600 truncate max-w-[180px]">{file.name}</span>
        )}
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition ${(!file || uploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Enviar arquivo"
        >
          {uploading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">{success}</div>}
    </div>
  );
};
