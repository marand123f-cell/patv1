import React, { useRef, useEffect } from 'react';
import { PatternData } from '../types';
import { CanvasDrawingUtils } from '../utils/canvasDrawing';

interface FinalCanvasProps {
  patternData: PatternData;
  customerName: string;
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
}

const FinalCanvas: React.FC<FinalCanvasProps> = ({ patternData, customerName, onCanvasReady }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // A4 dimensions at 96 DPI (1:1 scale)
    const A4_WIDTH_MM = 210;
    const A4_HEIGHT_MM = 297;
    const PIXELS_PER_MM = 3.78; // 96 DPI
    
    canvas.width = A4_WIDTH_MM * PIXELS_PER_MM;
    canvas.height = A4_HEIGHT_MM * PIXELS_PER_MM;

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid (1mm squares)
    CanvasDrawingUtils.drawGrid(ctx, canvas.width, canvas.height, PIXELS_PER_MM);

    // Draw A4 frame
    CanvasDrawingUtils.drawA4Frame(ctx);

    // Draw labels and title
    CanvasDrawingUtils.drawLabels(ctx, customerName);

    // Scale and center the contours
    if (patternData.contours.length > 0 && patternData.calibration) {
      const scaleFactor = PIXELS_PER_MM * 10 / patternData.calibration.pixelsPerCm;
      
      // Find pattern bounds
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      patternData.contours.forEach(contour => {
        contour.forEach(point => {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
      });

      const patternWidth = (maxX - minX) * scaleFactor;
      const patternHeight = (maxY - minY) * scaleFactor;
      
     // Otimizar posicionamento para aproveitar melhor o espaço A4
     const margin = 60; // Margem em pixels
     const titleSpace = 100; // Espaço para título
     const availableWidth = canvas.width - (margin * 2);
     const availableHeight = canvas.height - titleSpace - margin;
     
     // Calcular escala para caber na página se necessário
     let finalScaleFactor = scaleFactor;
     if (patternWidth > availableWidth || patternHeight > availableHeight) {
       const scaleX = availableWidth / patternWidth;
       const scaleY = availableHeight / patternHeight;
       finalScaleFactor = scaleFactor * Math.min(scaleX, scaleY);
     }
     
     const finalPatternWidth = (maxX - minX) * finalScaleFactor;
     const finalPatternHeight = (maxY - minY) * finalScaleFactor;
     
     const offsetX = (canvas.width - finalPatternWidth) / 2;
     const offsetY = titleSpace + (availableHeight - finalPatternHeight) / 2;

      // Draw scaled contours
      const scaledContours = patternData.contours.map(contour =>
        contour.map(point => ({
         x: (point.x - minX) * finalScaleFactor + offsetX,
         y: (point.y - minY) * finalScaleFactor + offsetY
        }))
      );

     // Desenhar contornos com diferentes cores para melhor visualização
     scaledContours.forEach((contour, index) => {
       const colors = ['#dc2626', '#2563eb', '#059669', '#ea580c', '#7c3aed'];
       const color = colors[index % colors.length];
       CanvasDrawingUtils.drawContours(ctx, [contour], color);
     });
      
     // Desenhar dimensões principais
     const realWidth = finalPatternWidth / PIXELS_PER_MM / 10;
     const realHeight = finalPatternHeight / PIXELS_PER_MM / 10;
      
     ctx.strokeStyle = '#374151';
     ctx.fillStyle = '#374151';
     ctx.font = '14px sans-serif';
     ctx.lineWidth = 1;
      
     // Dimensão da largura
     if (offsetY + finalPatternHeight + 40 < canvas.height) {
       const dimY = offsetY + finalPatternHeight + 25;
       ctx.beginPath();
       ctx.moveTo(offsetX, dimY);
       ctx.lineTo(offsetX + finalPatternWidth, dimY);
       ctx.stroke();
       
       // Marcadores nas extremidades
       ctx.beginPath();
       ctx.moveTo(offsetX, dimY - 5);
       ctx.lineTo(offsetX, dimY + 5);
       ctx.moveTo(offsetX + finalPatternWidth, dimY - 5);
       ctx.lineTo(offsetX + finalPatternWidth, dimY + 5);
       ctx.stroke();
       
       ctx.textAlign = 'center';
       ctx.fillText(`${realWidth.toFixed(1)} cm`, offsetX + finalPatternWidth / 2, dimY + 20);
     }
      
     // Dimensão da altura
     if (offsetX - 40 > 0) {
       const dimX = offsetX - 25;
       ctx.beginPath();
       ctx.moveTo(dimX, offsetY);
       ctx.lineTo(dimX, offsetY + finalPatternHeight);
       ctx.stroke();
       
       // Marcadores nas extremidades
       ctx.beginPath();
       ctx.moveTo(dimX - 5, offsetY);
       ctx.lineTo(dimX + 5, offsetY);
       ctx.moveTo(dimX - 5, offsetY + finalPatternHeight);
       ctx.lineTo(dimX + 5, offsetY + finalPatternHeight);
       ctx.stroke();
       
       ctx.save();
       ctx.translate(dimX - 15, offsetY + finalPatternHeight / 2);
       ctx.rotate(-Math.PI / 2);
       ctx.textAlign = 'center';
       ctx.fillText(`${realHeight.toFixed(1)} cm`, 0, 0);
       ctx.restore();
     }
     
     // Adicionar informações de escala se foi redimensionado
     if (finalScaleFactor !== scaleFactor) {
       ctx.font = '12px sans-serif';
       ctx.fillStyle = '#dc2626';
       ctx.textAlign = 'right';
       ctx.fillText('* Redimensionado para caber na página', canvas.width - 20, canvas.height - 60);
     }
    }

    onCanvasReady(canvas);
  }, [patternData, customerName, onCanvasReady]);

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-4">
      <canvas
        ref={canvasRef}
        className="w-full border border-gray-200 rounded"
        style={{ maxHeight: '600px' }}
      />
    </div>
  );
};

export default FinalCanvas;