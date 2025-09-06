import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Point, Rectangle, CalibrationData } from '../types';
import { CanvasDrawingUtils } from '../utils/canvasDrawing';

interface ImageCanvasProps {
  imageData: string;
  mode: 'perspective' | 'roi' | 'calibration' | 'preview';
  perspectivePoints: Point[];
  roi?: Rectangle;
  calibration?: CalibrationData;
  contours?: Point[][];
  onPerspectivePointAdd: (point: Point) => void;
  onROIChange: (roi: Rectangle) => void;
  onCalibrationPointAdd: (point: Point) => void;
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({
  imageData,
  mode,
  perspectivePoints,
  roi,
  calibration,
  contours = [],
  onPerspectivePointAdd,
  onROIChange,
  onCalibrationPointAdd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
 const [processedImage, setProcessedImage] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImage(img);
    img.src = imageData;
  }, [imageData]);

 // Aplicar correção de perspectiva quando os 4 pontos estão definidos
 useEffect(() => {
   if (image && perspectivePoints.length === 4 && mode !== 'perspective') {
     const canvas = document.createElement('canvas');
     const ctx = canvas.getContext('2d')!;
     
     // Calcular dimensões baseadas nos pontos de perspectiva
     const minX = Math.min(...perspectivePoints.map(p => p.x));
     const maxX = Math.max(...perspectivePoints.map(p => p.x));
     const minY = Math.min(...perspectivePoints.map(p => p.y));
     const maxY = Math.max(...perspectivePoints.map(p => p.y));
     
     canvas.width = maxX - minX;
     canvas.height = maxY - minY;
     
     // Desenhar área corrigida
     ctx.drawImage(
       image,
       minX, minY, maxX - minX, maxY - minY,
       0, 0, canvas.width, canvas.height
     );
     
     setProcessedImage(canvas);
   }
 }, [image, perspectivePoints, mode]);
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !image) return;

    // Set canvas size to match container
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    const displayWidth = rect.width;
    const displayHeight = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, displayWidth, displayHeight);

   // Usar imagem processada se disponível, senão usar original
   const currentImage = (mode !== 'perspective' && processedImage) ? processedImage : image;
   if (!currentImage) return;
   
   // Calculate image scaling to fit canvas
   const imageAspect = currentImage.width / currentImage.height;
    const canvasAspect = displayWidth / displayHeight;
    let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

    if (imageAspect > canvasAspect) {
      drawWidth = displayWidth;
      drawHeight = displayWidth / imageAspect;
      offsetY = (displayHeight - drawHeight) / 2;
    } else {
      drawHeight = displayHeight;
      drawWidth = displayHeight * imageAspect;
      offsetX = (displayWidth - drawWidth) / 2;
    }

    // Draw image
   ctx.drawImage(currentImage, offsetX, offsetY, drawWidth, drawHeight);

    // Store scaling factors for coordinate conversion
   (canvas as any).scaleX = drawWidth / currentImage.width;
   (canvas as any).scaleY = drawHeight / currentImage.height;
    (canvas as any).offsetX = offsetX;
    (canvas as any).offsetY = offsetY;

    // Draw mode-specific overlays
    if (mode === 'perspective') {
      CanvasDrawingUtils.drawPerspectivePoints(ctx, perspectivePoints.map(p => ({
        x: p.x * (canvas as any).scaleX + offsetX,
        y: p.y * (canvas as any).scaleY + offsetY
      })));
    } else if (mode === 'roi' && roi) {
      CanvasDrawingUtils.drawROI(ctx, {
        x: roi.x * (canvas as any).scaleX + offsetX,
        y: roi.y * (canvas as any).scaleY + offsetY,
        width: roi.width * (canvas as any).scaleX,
        height: roi.height * (canvas as any).scaleY
      });
    } else if (mode === 'calibration' && calibration) {
      CanvasDrawingUtils.drawCalibrationLine(ctx, {
        ...calibration,
        point1: {
          x: calibration.point1.x * (canvas as any).scaleX + offsetX,
          y: calibration.point1.y * (canvas as any).scaleY + offsetY
        },
        point2: {
          x: calibration.point2.x * (canvas as any).scaleX + offsetX,
          y: calibration.point2.y * (canvas as any).scaleY + offsetY
        }
      });
    } else if (mode === 'preview') {
      const scaledContours = contours.map(contour => 
        contour.map(p => ({
          x: p.x * (canvas as any).scaleX + offsetX,
          y: p.y * (canvas as any).scaleY + offsetY
        }))
      );
      CanvasDrawingUtils.drawContours(ctx, scaledContours);
    }
 }, [image, processedImage, mode, perspectivePoints, roi, calibration, contours]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert to image coordinates
    const imageX = (x - (canvas as any).offsetX) / (canvas as any).scaleX;
    const imageY = (y - (canvas as any).offsetY) / (canvas as any).scaleY;

    if (mode === 'perspective' && perspectivePoints.length < 4) {
      onPerspectivePointAdd({ x: imageX, y: imageY });
    } else if (mode === 'roi') {
      setIsDrawing(true);
      setStartPoint({ x: imageX, y: imageY });
    } else if (mode === 'calibration') {
      onCalibrationPointAdd({ x: imageX, y: imageY });
    }
  }, [mode, perspectivePoints.length, onPerspectivePointAdd, onCalibrationPointAdd]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint || mode !== 'roi') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const imageX = (x - (canvas as any).offsetX) / (canvas as any).scaleX;
    const imageY = (y - (canvas as any).offsetY) / (canvas as any).scaleY;

    const newROI: Rectangle = {
      x: Math.min(startPoint.x, imageX),
      y: Math.min(startPoint.y, imageY),
      width: Math.abs(imageX - startPoint.x),
      height: Math.abs(imageY - startPoint.y)
    };

    onROIChange(newROI);
  }, [isDrawing, startPoint, mode, onROIChange]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
    setStartPoint(null);
  }, []);

  return (
    <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      
      {mode === 'perspective' && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-3">
          <p className="text-sm font-medium text-gray-700">
            Clique nos 4 cantos da área retangular ({perspectivePoints.length}/4)
          </p>
        </div>
      )}
      
      {mode === 'roi' && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-3">
          <p className="text-sm font-medium text-gray-700">
            Arraste para selecionar a área do molde
          </p>
        </div>
      )}
      
      {mode === 'calibration' && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-3">
          <p className="text-sm font-medium text-gray-700">
            Clique em dois pontos conhecidos na régua
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageCanvas;