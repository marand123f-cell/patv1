import React, { useCallback } from 'react';
import { Upload, Camera } from 'lucide-react';

interface ImageUploadProps {
  onImageUpload: (imageData: string) => void;
  isProcessing: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload, isProcessing }) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onImageUpload(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [onImageUpload]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onImageUpload(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [onImageUpload]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className="border-2 border-dashed border-blue-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors duration-200 bg-gradient-to-br from-blue-50 to-indigo-50"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-blue-100 rounded-full">
            <Camera className="w-12 h-12 text-blue-600" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-700">
            Carregar Foto do Molde
          </h3>
          
          <p className="text-gray-500 max-w-md">
            Arraste uma foto do seu molde aqui ou clique para selecionar. 
            Certifique-se de que há uma régua ou grade visível para calibração.
          </p>
          
          <label className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 cursor-pointer">
            <Upload className="w-5 h-5 mr-2" />
            Selecionar Imagem
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              className="hidden"
              disabled={isProcessing}
            />
          </label>
          
          <div className="text-sm text-gray-400">
            Formatos suportados: JPEG, PNG (máx. 10MB)
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;