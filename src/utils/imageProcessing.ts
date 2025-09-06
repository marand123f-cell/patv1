export class ImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  cannyEdgeDetection(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;
    
    // Convert to grayscale
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }

    // Simple edge detection using Sobel operator
    const output = new Uint8ClampedArray(data);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Sobel X
        const gx = (
          -1 * data[((y-1) * width + (x-1)) * 4] +
          1 * data[((y-1) * width + (x+1)) * 4] +
          -2 * data[(y * width + (x-1)) * 4] +
          2 * data[(y * width + (x+1)) * 4] +
          -1 * data[((y+1) * width + (x-1)) * 4] +
          1 * data[((y+1) * width + (x+1)) * 4]
        );

        // Sobel Y
        const gy = (
          -1 * data[((y-1) * width + (x-1)) * 4] +
          -2 * data[((y-1) * width + x) * 4] +
          -1 * data[((y-1) * width + (x+1)) * 4] +
          1 * data[((y+1) * width + (x-1)) * 4] +
          2 * data[((y+1) * width + x) * 4] +
          1 * data[((y+1) * width + (x+1)) * 4]
        );

        const magnitude = Math.sqrt(gx * gx + gy * gy);
        const value = magnitude > 50 ? 255 : 0;
        
        output[idx] = value;
        output[idx + 1] = value;
        output[idx + 2] = value;
        output[idx + 3] = 255;
      }
    }

    return new ImageData(output, width, height);
  }

  perspectiveTransform(img: HTMLImageElement, srcPoints: { x: number; y: number }[]): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = 800;
    canvas.height = 600;
    
    // Simple perspective correction - this is a simplified version
    // In a real implementation, you'd use proper homography matrix
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    
    return canvas;
  }

  findContours(imageData: ImageData): { x: number; y: number }[][] {
    const contours: { x: number; y: number }[][] = [];
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const visited = new Array(width * height).fill(false);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (data[idx] === 255 && !visited[y * width + x]) {
          const contour = this.traceContour(data, width, height, x, y, visited);
          if (contour.length > 20) {
            contours.push(contour);
          }
        }
      }
    }

    return contours;
  }

  private traceContour(data: Uint8ClampedArray, width: number, height: number, startX: number, startY: number, visited: boolean[]): { x: number; y: number }[] {
    const contour: { x: number; y: number }[] = [];
    const stack = [{ x: startX, y: startY }];

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      
      if (x < 0 || x >= width || y < 0 || y >= height || visited[y * width + x]) {
        continue;
      }

      const idx = (y * width + x) * 4;
      if (data[idx] !== 255) {
        continue;
      }

      visited[y * width + x] = true;
      contour.push({ x, y });

      // Add neighbors to stack
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          stack.push({ x: x + dx, y: y + dy });
        }
      }
    }

    return contour;
  }

  douglasPeucker(points: { x: number; y: number }[], epsilon: number = 2): { x: number; y: number }[] {
    if (points.length <= 2) return points;

    let maxDistance = 0;
    let maxIndex = 0;
    
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    
    for (let i = 1; i < points.length - 1; i++) {
      const distance = this.perpendicularDistance(points[i], firstPoint, lastPoint);
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }
    
    if (maxDistance > epsilon) {
      const leftRecursion = this.douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
      const rightRecursion = this.douglasPeucker(points.slice(maxIndex), epsilon);
      
      return [...leftRecursion.slice(0, -1), ...rightRecursion];
    } else {
      return [firstPoint, lastPoint];
    }
  }

  private perpendicularDistance(point: { x: number; y: number }, lineStart: { x: number; y: number }, lineEnd: { x: number; y: number }): number {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    
    if (dx === 0 && dy === 0) {
      return Math.sqrt(Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2));
    }
    
    const normalLength = Math.sqrt(dx * dx + dy * dy);
    return Math.abs((dy * point.x) - (dx * point.y) + (lineEnd.x * lineStart.y) - (lineEnd.y * lineStart.x)) / normalLength;
  }
}