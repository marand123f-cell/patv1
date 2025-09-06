import React, { useState, useCallback, useEffect } from 'react';
import { Scissors, RotateCcw, User } from 'lucide-react';
import ImageUpload from './components/ImageUpload';
import ProcessingSteps from './components/ProcessingSteps';
import ImageCanvas from './components/ImageCanvas';
import CalibrationPanel from './components/CalibrationPanel';
import FinalCanvas from './components/FinalCanvas';
import ExportPanel from './components/ExportPanel';
import { PatternData, ProcessingStep, Point, Rectangle, CalibrationData } from './types';
import { ImageProcessor } from './utils/imageProcessing';

function App() {
  const [patternData, setPatternData] = useState<PatternData>({
    originalImage: '',
    perspectivePoints: [],
    contours: [],
    customerName: ''
  });
  
  const [currentStep, setCurrentStep] = useState<string>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalCanvas, setFinalCanvas] = useState<HTMLCanvasElement | null>(null);
  const [imageProcessor] = useState(() => new ImageProcessor());

  const steps: ProcessingStep[] = [
    { id: 'upload', name: 'Upload', completed: false, active: false },
    { id: 'perspective', name: 'Perspectiva', completed: false, active: false },
    { id: 'roi', name: 'Área do Molde', completed: false, active: false },
    { id: 'calibration', name: 'Calibração', completed: false, active: false },
    { id: 'vectorize', name: 'Vetorização', completed: false, active: false },
    { id: 'export', name: 'Exportar', completed: false, active: false }
  ];

  const updateStepStatus = (stepId: string, completed: boolean = false, active: boolean = false) => {
    setCurrentStep(stepId);
  };

  const handleImageUpload = useCallback(async (imageData: string) => {
    setPatternData(prev => ({
      ...prev,
      originalImage: imageData,
      perspectivePoints: []
    }));
    updateStepStatus('perspective', false, true);
  }, []);

  const handlePerspectivePointAdd = useCallback((point: Point) => {
    setPatternData(prev => {
      const newPoints = [...prev.perspectivePoints, point];
      if (newPoints.length === 4) {
        setTimeout(() => updateStepStatus('roi', false, true), 500);
      }
      return {
        ...prev,
        perspectivePoints: newPoints
      };
    });
  }, []);

  const handleROIChange = useCallback((roi: Rectangle) => {
    setPatternData(prev => ({
      ...prev,
      roi
    }));
  }, []);

  const handleROIConfirm = useCallback(() => {
    if (patternData.roi) {
      updateStepStatus('calibration', false, true);
    }
  }, [patternData.roi]);

  const handleCalibrationPointAdd = useCallback((point: Point) => {
    setPatternData(prev => {
      const currentCalibration = prev.calibration || {
        point1: { x: 0, y: 0 },
        point2: { x: 0, y: 0 },
        realDistance: 10,
        pixelsPerCm: 1
      };

      if (!prev.calibration?.point1.x && !prev.calibration?.point1.y) {
        return {
          ...prev,
          calibration: { ...currentCalibration, point1: point }
        };
      } else {
        const pixelDistance = Math.sqrt(
          Math.pow(point.x - currentCalibration.point1.x, 2) +
          Math.pow(point.y - currentCalibration.point1.y, 2)
        );
        
        const pixelsPerCm = pixelDistance / currentCalibration.realDistance;
        
        return {
          ...prev,
          calibration: {
            ...currentCalibration,
            point2: point,
            pixelsPerCm
          }
        };
      }
    });
  }, []);

  const handleCalibrationUpdate = useCallback((calibration: CalibrationData) => {
    setPatternData(prev => ({
      ...prev,
      calibration
    }));
  }, []);

  const handleVectorize = useCallback(async () => {
    if (!patternData.originalImage) return;

    setIsProcessing(true);
    updateStepStatus('vectorize', false, true);

    try {
      // Load and process image
      const img = await imageProcessor.loadImage(patternData.originalImage);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Apply edge detection
      const edges = imageProcessor.cannyEdgeDetection(imageData);
      
      // Find contours
      const contours = imageProcessor.findContours(edges);
      
      // Simplify contours
      const simplifiedContours = contours.map(contour => 
        imageProcessor.douglasPeucker(contour, 3)
      );

      setPatternData(prev => ({
        ...prev,
        contours: simplifiedContours.filter(contour => contour.length > 10)
      }));

      setTimeout(() => {
        updateStepStatus('export', false, true);
        setIsProcessing(false);
      }, 2000);
    } catch (error) {
      console.error('Erro na vetorização:', error);
      setIsProcessing(false);
    }
  }, [patternData.originalImage, imageProcessor]);

  const handleReset = useCallback(() => {
    setPatternData({
      originalImage: '',
      perspectivePoints: [],
      contours: [],
      customerName: ''
    });
    setCurrentStep('upload');
    setFinalCanvas(null);
  }, []);

  const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep);

  const currentStepIndex = getCurrentStepIndex();
  const updatedSteps = steps.map((step, index) => ({
    ...step,
    completed: index < currentStepIndex,
    active: index === currentStepIndex
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Scissors className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">Vetorizador de Moldes 1:1</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transforme fotos de moldes em desenhos técnicos vetoriais precisos em escala real
          </p>
        </div>

        {/* Steps Progress */}
        <ProcessingSteps steps={updatedSteps} currentStep={currentStep} />

        {/* Customer Name Input */}
        {currentStep !== 'upload' && (
          <div className="max-w-md mx-auto mb-6">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-5 h-5 text-gray-600" />
                <label className="font-medium text-gray-700">Nome do Cliente</label>
              </div>
              <input
                type="text"
                value={patternData.customerName}
                onChange={(e) => setPatternData(prev => ({ ...prev, customerName: e.target.value }))}
                placeholder="Digite o nome do cliente"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {currentStep === 'upload' && (
            <ImageUpload onImageUpload={handleImageUpload} isProcessing={isProcessing} />
          )}

          {currentStep === 'perspective' && patternData.originalImage && (
            <div className="space-y-6">
              <ImageCanvas
                imageData={patternData.originalImage}
                mode="perspective"
                perspectivePoints={patternData.perspectivePoints}
                onPerspectivePointAdd={handlePerspectivePointAdd}
                onROIChange={handleROIChange}
                onCalibrationPointAdd={handleCalibrationPointAdd}
              />
              
              {patternData.perspectivePoints.length === 4 && (
                <div className="text-center">
                  <button
                    onClick={() => updateStepStatus('roi', false, true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Continuar para Seleção de Área
                  </button>
                </div>
              )}
            </div>
          )}

          {currentStep === 'roi' && patternData.originalImage && (
            <div className="space-y-6">
              <ImageCanvas
                imageData={patternData.originalImage}
                mode="roi"
                perspectivePoints={patternData.perspectivePoints}
                roi={patternData.roi}
                onPerspectivePointAdd={handlePerspectivePointAdd}
                onROIChange={handleROIChange}
                onCalibrationPointAdd={handleCalibrationPointAdd}
              />
              
              {patternData.roi && (
                <div className="text-center">
                  <button
                    onClick={handleROIConfirm}
                    className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200"
                  >
                    Confirmar Área do Molde
                  </button>
                </div>
              )}
            </div>
          )}

          {currentStep === 'calibration' && patternData.originalImage && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ImageCanvas
                imageData={patternData.originalImage}
                mode="calibration"
                perspectivePoints={patternData.perspectivePoints}
                roi={patternData.roi}
                calibration={patternData.calibration}
                onPerspectivePointAdd={handlePerspectivePointAdd}
                onROIChange={handleROIChange}
                onCalibrationPointAdd={handleCalibrationPointAdd}
              />
              
              <div className="space-y-6">
                <CalibrationPanel
                  calibration={patternData.calibration}
                  onCalibrationUpdate={handleCalibrationUpdate}
                />
                
                {patternData.calibration?.pixelsPerCm && (
                  <div className="text-center">
                    <button
                      onClick={handleVectorize}
                      disabled={isProcessing}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isProcessing ? 'Vetorizando...' : 'Iniciar Vetorização'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 'vectorize' && (
            <div className="text-center space-y-6">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="animate-spin w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Processando Molde...</h3>
                <p className="text-gray-600">
                  Aplicando algoritmos de detecção de bordas e vetorização
                </p>
              </div>
            </div>
          )}

          {currentStep === 'export' && patternData.contours.length > 0 && (
            <div className="space-y-6">
              <FinalCanvas
                patternData={patternData}
                customerName={patternData.customerName || 'Sem Nome'}
                onCanvasReady={setFinalCanvas}
              />
              
              <ExportPanel
                patternData={patternData}
                customerName={patternData.customerName || 'Sem Nome'}
                finalCanvas={finalCanvas}
              />
            </div>
          )}
        </div>

        {/* Reset Button */}
        {currentStep !== 'upload' && (
          <div className="text-center mt-8">
            <button
              onClick={handleReset}
              className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Novo Molde
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;