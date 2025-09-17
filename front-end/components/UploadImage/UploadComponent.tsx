import { Trash, Upload } from "lucide-react";
import { useRef } from "react";

interface UploadImageProps {
  label?: string;
  value?: string | File;
  onChange: (val: string | File | null) => void;
}

export default function UploadImage({
  label,
  value,
  onChange,
}: UploadImageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Primeiro retorna o arquivo
      onChange(file);

      // Em seguida, retorna base64 para preview
      const reader = new FileReader();
      reader.onload = () => {
        onChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2 w-full">
      {label && (
        <label className="block font-medium text-gray-700">{label}</label>
      )}

      <div
        className="relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors bg-gray-50"
        onClick={() => fileInputRef.current?.click()}
      >
        {value ? (
          <>
            <img
              src={
                typeof value === "string" ? value : URL.createObjectURL(value)
              }
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
            >
              <Trash size={16} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            <Upload size={32} />
            <span className="mt-2 text-sm">Clique ou arraste para enviar</span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
