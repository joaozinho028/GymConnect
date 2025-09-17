import { Trash, Upload } from "lucide-react";
import { useRef } from "react";

interface UploadImageProps {
  label?: string;
  value?: string | File;
  onChange: (val: string | File | null) => void;
}

export default function UploadFile({
  label,
  value,
  onChange,
}: UploadImageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file);
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
        className="relative flex flex-col items-center justify-center w-full h-60 z-[9999] border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors bg-gray-50"
        onClick={() => fileInputRef.current?.click()}
      >
        {value ? (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <span className="text-gray-700 font-medium text-sm">
              {typeof value === "string" ? value : (value as File).name}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="mt-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
            >
              <Trash size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            <Upload size={32} />
            <span className="mt-2 text-sm">
              Clique ou arraste para enviar .csv ou .xlsx
            </span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
