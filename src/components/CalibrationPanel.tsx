import React, { useState } from 'react';
import { CalibrationData } from '../types';
import { Ruler, Calculator } from 'lucide-react';

interface CalibrationPanelProps {
  calibration: CalibrationData | null;
  onCalibrationUpdate: (calibration: CalibrationData) => void;
}

const CalibrationPanel: React.FC<CalibrationPanelProps> = ({ calibration, onCalibrationUpdate }) => {
  const [realDistance, setRealDistance] = useState(10);

  const handleDistanceChange = (distance: number) => {
    if (calibration && calibration.point1 && calibration.point2) {
      const pixelDistance = Math.sqrt(
        Math.pow(calibration.point2.x - calibration.point1.x, 2) +
        Math.pow(calibration.point2.y - calibration.point1.y, 2)
      );
      
      const pixelsPerCm = pixelDistance / distance;
      
      onCalibrationUpdate({
        ...calibration,
        realDistance: distance,
        pixelsPerCm
      });
    }
    setRealDistance(distance);
  };

  if (!calibration || !calibration.point1 || !calibration.point2) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Ruler className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800">Calibração de Escala</h3>
        </div>
        
        <p className="text-gray-600">
          Selecione dois pontos conhecidos na régua para calibrar a escala.
        </p>
      </div>
    );
  }

  const pixelDistance = Math.sqrt(
    Math.pow(calibration.point2.x - calibration.point1.x, 2) +
    Math.pow(calibration.point2.y - calibration.point1.y, 2)
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Calculator className="w-6 h-6 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-800">Calibração de Escala</h3>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <label className="text-sm font-medium text-gray-600">Distância em Pixels</label>
            <p className="text-lg font-semibold text-gray-900">
              {pixelDistance.toFixed(1)} px
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <label className="text-sm font-medium text-gray-600">Escala Calculada</label>
            <p className="text-lg font-semibold text-gray-900">
              {calibration.pixelsPerCm.toFixed(2)} px/cm
            </p>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Distância Real (cm)
          </label>
          <input
            type="number"
            value={realDistance}
            onChange={(e) => handleDistanceChange(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            min="0.1"
            step="0.1"
          />
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-700">
            <strong>Resolução final:</strong> 1 cm = {calibration.pixelsPerCm.toFixed(1)} pixels
          </p>
        </div>
      </div>
    </div>
  );
};

export default CalibrationPanel;