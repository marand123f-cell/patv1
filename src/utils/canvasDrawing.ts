import { Point, CalibrationData } from '../types';

export class CanvasDrawingUtils {
  static drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, gridSize: number = 10) {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    
    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Major grid lines every 50px (5cm in 1:1 scale)
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= width; x += gridSize * 5) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= height; y += gridSize * 5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  static drawA4Frame(ctx: CanvasRenderingContext2D) {
    const A4_WIDTH_MM = 210;
    const A4_HEIGHT_MM = 297;
    const PIXELS_PER_MM = 3.78; // 96 DPI
    
    const width = A4_WIDTH_MM * PIXELS_PER_MM;
    const height = A4_HEIGHT_MM * PIXELS_PER_MM;
    
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);
    
    return { width, height };
  }

  static drawContours(ctx: CanvasRenderingContext2D, contours: Point[][], color: string = '#dc2626') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    contours.forEach(contour => {
      if (contour.length < 2) return;
      
      ctx.beginPath();
      ctx.moveTo(contour[0].x, contour[0].y);
      
      for (let i = 1; i < contour.length; i++) {
        ctx.lineTo(contour[i].x, contour[i].y);
      }
      
      ctx.closePath();
      ctx.stroke();
    });
  }

  static drawCalibrationLine(ctx: CanvasRenderingContext2D, calibration: CalibrationData) {
    const { point1, point2, realDistance, pixelsPerCm } = calibration;
    
    // Draw line
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(point1.x, point1.y);
    ctx.lineTo(point2.x, point2.y);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw points
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.arc(point1.x, point1.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(point2.x, point2.y, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw label
    const midX = (point1.x + point2.x) / 2;
    const midY = (point1.y + point2.y) / 2;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(midX - 30, midY - 15, 60, 20);
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 1;
    ctx.strokeRect(midX - 30, midY - 15, 60, 20);
    
    ctx.fillStyle = '#059669';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${realDistance}cm`, midX, midY + 3);
  }

  static drawPerspectivePoints(ctx: CanvasRenderingContext2D, points: Point[]) {
    ctx.strokeStyle = '#2563eb';
    ctx.fillStyle = '#2563eb';
    ctx.lineWidth = 2;
    
    points.forEach((point, index) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px bold sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText((index + 1).toString(), point.x, point.y + 4);
      ctx.fillStyle = '#2563eb';
    });
    
    if (points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      if (points.length === 4) {
        ctx.closePath();
      }
      ctx.stroke();
    }
  }

  static drawROI(ctx: CanvasRenderingContext2D, roi: { x: number; y: number; width: number; height: number }) {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Clear ROI area
    ctx.clearRect(roi.x, roi.y, roi.width, roi.height);
    
    // Draw ROI border
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(roi.x, roi.y, roi.width, roi.height);
    ctx.setLineDash([]);
  }

  static drawLabels(ctx: CanvasRenderingContext2D, customerName: string) {
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MOLDE VETORIZADO - ESCALA 1:1', ctx.canvas.width / 2, 40);
    
    ctx.font = '18px sans-serif';
    ctx.fillText(`Cliente: ${customerName}`, ctx.canvas.width / 2, 70);
    
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    const date = new Date().toLocaleDateString('pt-BR');
    ctx.fillText(`Data: ${date}`, 20, ctx.canvas.height - 40);
    
    ctx.textAlign = 'right';
    ctx.fillText('Processado com IA - Escala 1:1', ctx.canvas.width - 20, ctx.canvas.height - 40);
  }
}