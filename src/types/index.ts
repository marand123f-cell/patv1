export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CalibrationData {
  point1: Point;
  point2: Point;
  realDistance: number; // in cm
  pixelsPerCm: number;
}

export interface ProcessingStep {
  id: string;
  name: string;
  completed: boolean;
  active: boolean;
}

export interface PatternData {
  originalImage: string;
  processedImage?: string;
  perspectivePoints: Point[];
  roi?: Rectangle;
  calibration?: CalibrationData;
  contours: Point[][];
  customerName?: string;
}

export interface ExportOptions {
  format: 'png' | 'svg' | 'dxf';
  includeGrid: boolean;
  includeLabels: boolean;
}