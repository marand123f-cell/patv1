import React from 'react';
import { Download, FileText, Image, Layers } from 'lucide-react';
import { PatternData } from '../types';
import { ExportUtils } from '../utils/exportUtils';

interface ExportPanelProps {
  patternData: PatternData;
  customerName: string;
  finalCanvas: HTMLCanvasElement | null;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ patternData, customerName, finalCanvas }) => {
  const handleExport = async (format: 'png' | 'svg' | 'dxf') => {
    if (!customerName.trim()) {
      alert('Por favor, informe o nome do cliente antes de exportar.');
      return;
    }

    const filename = `molde-${customerName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

    try {
      switch (format) {
        case 'png':
          if (finalCanvas) {
            await ExportUtils.exportToPNG(finalCanvas, `${filename}.png`);
          }
          break;
        case 'svg':
          await ExportUtils.exportToSVG(patternData, customerName, `${filename}.svg`);
          break;
        case 'dxf':
          await ExportUtils.exportToDXF(patternData, `${filename}.dxf`);
          break;
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar o arquivo. Tente novamente.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Download className="w-6 h-6 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-800">Exportar Molde</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => handleExport('png')}
          className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors duration-200"
        >
          <Image className="w-8 h-8 text-orange-600 mb-3" />
          <span className="font-medium text-gray-800">PNG</span>
          <span className="text-sm text-gray-500 text-center mt-1">
            Imagem final com grade e medidas
          </span>
        </button>

        <button
          onClick={() => handleExport('svg')}
          className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors duration-200"
        >
          <Layers className="w-8 h-8 text-orange-600 mb-3" />
          <span className="font-medium text-gray-800">SVG</span>
          <span className="text-sm text-gray-500 text-center mt-1">
            Arquivo vetorial editável
          </span>
        </button>

        <button
          onClick={() => handleExport('dxf')}
          className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors duration-200"
        >
          <FileText className="w-8 h-8 text-orange-600 mb-3" />
          <span className="font-medium text-gray-800">DXF</span>
          <span className="text-sm text-gray-500 text-center mt-1">
            Para máquinas de corte
          </span>
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">Informações do Arquivo:</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• <strong>Escala:</strong> 1:1 (tamanho real)</p>
          <p>• <strong>Formato:</strong> A4 (210×297mm)</p>
          <p>• <strong>Grade:</strong> 1mm por quadrado</p>
          <p>• <strong>Precisão:</strong> ±0.1mm</p>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;