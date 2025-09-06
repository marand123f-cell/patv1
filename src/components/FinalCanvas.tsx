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
      
      // Center on page (leaving space for title)
      const availableWidth = canvas.width - 40;
      const availableHeight = canvas.height - 120;
      const offsetX = (availableWidth - patternWidth) / 2 + 20;
      const offsetY = (availableHeight - patternHeight) / 2 + 100;

      // Draw scaled contours
      const scaledContours = patternData.contours.map(contour =>
        contour.map(point => ({
          x: (point.x - minX) * scaleFactor + offsetX,
          y: (point.y - minY) * scaleFactor + offsetY
        }))
      );

      CanvasDrawingUtils.drawContours(ctx, scaledContours, '#dc2626');
      
      // Draw dimensions
      ctx.strokeStyle = '#6b7280';
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.lineWidth = 1;
      
      // Width dimension
      const dimY = offsetY + patternHeight + 20;
      ctx.beginPath();
      ctx.moveTo(offsetX, dimY);
      ctx.lineTo(offsetX + patternWidth, dimY);
      ctx.stroke();
      
      ctx.textAlign = 'center';
      ctx.fillText(`${(patternWidth / PIXELS_PER_MM / 10).toFixed(1)} cm`, offsetX + patternWidth / 2, dimY + 15);
      
      // Height dimension
      const dimX = offsetX - 20;
      ctx.save();
      ctx.translate(dimX, offsetY + patternHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(`${(patternHeight / PIXELS_PER_MM / 10).toFixed(1)} cm`, 0, -5);
      ctx.restore();
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