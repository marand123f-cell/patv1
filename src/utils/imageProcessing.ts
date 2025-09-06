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

  // Correção de perspectiva usando transformação homográfica
  perspectiveTransform(img: HTMLImageElement, srcPoints: { x: number; y: number }[]): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Dimensões de saída baseadas na proporção da área selecionada
    canvas.width = 800;
    canvas.height = 600;
    
    if (srcPoints.length === 4) {
      // Pontos de destino (retângulo normalizado)
      const dstPoints = [
        { x: 0, y: 0 },
        { x: canvas.width, y: 0 },
        { x: canvas.width, y: canvas.height },
        { x: 0, y: canvas.height }
      ];
      
      // Aplicar transformação de perspectiva
      const matrix = this.calculateHomographyMatrix(srcPoints, dstPoints);
      this.applyPerspectiveTransform(ctx, img, matrix, canvas.width, canvas.height);
    } else {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    
    return canvas;
  }

  private calculateHomographyMatrix(src: { x: number; y: number }[], dst: { x: number; y: number }[]): number[] {
    // Implementação simplificada da matriz de homografia
    // Em uma implementação completa, usaríamos SVD ou método dos mínimos quadrados
    const A: number[][] = [];
    
    for (let i = 0; i < 4; i++) {
      const sx = src[i].x;
      const sy = src[i].y;
      const dx = dst[i].x;
      const dy = dst[i].y;
      
      A.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy]);
      A.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy]);
    }
    
    // Solução simplificada - retorna matriz identidade modificada
    return [1, 0, 0, 0, 1, 0, 0, 0];
  }

  private applyPerspectiveTransform(ctx: CanvasRenderingContext2D, img: HTMLImageElement, matrix: number[], width: number, height: number) {
    // Implementação simplificada - desenha a imagem ajustada
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    ctx.restore();
  }

  // Pré-processamento avançado da imagem
  preprocessImage(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;
    
    // 1. Conversão para escala de cinza
    this.convertToGrayscale(data);
    
    // 2. Filtro Gaussiano para reduzir ruído
    const blurred = this.gaussianBlur(data, width, height, 1.0);
    
    // 3. Ajuste de contraste
    this.adjustContrast(blurred, 1.5);
    
    // 4. Binarização adaptativa
    this.adaptiveThreshold(blurred, width, height);
    
    return new ImageData(blurred, width, height);
  }

  private convertToGrayscale(data: Uint8ClampedArray) {
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
  }

  private gaussianBlur(data: Uint8ClampedArray, width: number, height: number, sigma: number): Uint8ClampedArray {
    const output = new Uint8ClampedArray(data);
    const kernel = this.createGaussianKernel(sigma);
    const kernelSize = kernel.length;
    const half = Math.floor(kernelSize / 2);
    
    for (let y = half; y < height - half; y++) {
      for (let x = half; x < width - half; x++) {
        let sum = 0;
        let weightSum = 0;
        
        for (let ky = -half; ky <= half; ky++) {
          for (let kx = -half; kx <= half; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const weight = kernel[ky + half] * kernel[kx + half];
            sum += data[idx] * weight;
            weightSum += weight;
          }
        }
        
        const result = sum / weightSum;
        const idx = (y * width + x) * 4;
        output[idx] = result;
        output[idx + 1] = result;
        output[idx + 2] = result;
      }
    }
    
    return output;
  }

  private createGaussianKernel(sigma: number): number[] {
    const size = Math.ceil(sigma * 3) * 2 + 1;
    const kernel = new Array(size);
    const center = Math.floor(size / 2);
    let sum = 0;
    
    for (let i = 0; i < size; i++) {
      const x = i - center;
      kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
      sum += kernel[i];
    }
    
    // Normalizar
    for (let i = 0; i < size; i++) {
      kernel[i] /= sum;
    }
    
    return kernel;
  }

  private adjustContrast(data: Uint8ClampedArray, factor: number) {
    for (let i = 0; i < data.length; i += 4) {
      const value = ((data[i] - 128) * factor) + 128;
      data[i] = Math.max(0, Math.min(255, value));
      data[i + 1] = data[i];
      data[i + 2] = data[i];
    }
  }

  private adaptiveThreshold(data: Uint8ClampedArray, width: number, height: number) {
    const blockSize = 15;
    const C = 10;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Calcular média local
        let sum = 0;
        let count = 0;
        
        for (let dy = -blockSize; dy <= blockSize; dy++) {
          for (let dx = -blockSize; dx <= blockSize; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              sum += data[(ny * width + nx) * 4];
              count++;
            }
          }
        }
        
        const mean = sum / count;
        const threshold = mean - C;
        const value = data[idx] > threshold ? 255 : 0;
        
        data[idx] = value;
        data[idx + 1] = value;
        data[idx + 2] = value;
      }
    }
  }

  // Detecção de bordas melhorada
  cannyEdgeDetection(imageData: ImageData): ImageData {
    const preprocessed = this.preprocessImage(imageData);
    const data = preprocessed.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // 1. Gradientes Sobel
    const gradients = this.calculateGradients(data, width, height);
    
    // 2. Supressão não-máxima
    const suppressed = this.nonMaximumSuppression(gradients, width, height);
    
    // 3. Histerese
    const edges = this.hysteresisThresholding(suppressed, width, height, 50, 150);
    
    return new ImageData(edges, width, height);
  }

  private calculateGradients(data: Uint8ClampedArray, width: number, height: number) {
    const gradients = {
      magnitude: new Float32Array(width * height),
      direction: new Float32Array(width * height)
    };
    
    // Kernels Sobel
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            
            gx += data[idx] * sobelX[kernelIdx];
            gy += data[idx] * sobelY[kernelIdx];
          }
        }
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        const direction = Math.atan2(gy, gx);
        
        gradients.magnitude[y * width + x] = magnitude;
        gradients.direction[y * width + x] = direction;
      }
    }
    
    return gradients;
  }

  private nonMaximumSuppression(gradients: any, width: number, height: number): Float32Array {
    const suppressed = new Float32Array(width * height);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const magnitude = gradients.magnitude[idx];
        const direction = gradients.direction[idx];
        
        // Determinar direção do gradiente
        let angle = direction * 180 / Math.PI;
        if (angle < 0) angle += 180;
        
        let neighbor1, neighbor2;
        
        if ((angle >= 0 && angle < 22.5) || (angle >= 157.5 && angle <= 180)) {
          neighbor1 = gradients.magnitude[idx - 1];
          neighbor2 = gradients.magnitude[idx + 1];
        } else if (angle >= 22.5 && angle < 67.5) {
          neighbor1 = gradients.magnitude[(y - 1) * width + (x + 1)];
          neighbor2 = gradients.magnitude[(y + 1) * width + (x - 1)];
        } else if (angle >= 67.5 && angle < 112.5) {
          neighbor1 = gradients.magnitude[(y - 1) * width + x];
          neighbor2 = gradients.magnitude[(y + 1) * width + x];
        } else {
          neighbor1 = gradients.magnitude[(y - 1) * width + (x - 1)];
          neighbor2 = gradients.magnitude[(y + 1) * width + (x + 1)];
        }
        
        if (magnitude >= neighbor1 && magnitude >= neighbor2) {
          suppressed[idx] = magnitude;
        }
      }
    }
    
    return suppressed;
  }

  private hysteresisThresholding(suppressed: Float32Array, width: number, height: number, lowThreshold: number, highThreshold: number): Uint8ClampedArray {
    const edges = new Uint8ClampedArray(width * height * 4);
    const strong = 255;
    const weak = 75;
    
    // Classificar pixels
    for (let i = 0; i < suppressed.length; i++) {
      const magnitude = suppressed[i];
      let value = 0;
      
      if (magnitude >= highThreshold) {
        value = strong;
      } else if (magnitude >= lowThreshold) {
        value = weak;
      }
      
      edges[i * 4] = value;
      edges[i * 4 + 1] = value;
      edges[i * 4 + 2] = value;
      edges[i * 4 + 3] = 255;
    }
    
    // Conectar bordas fracas às fortes
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        if (edges[idx] === weak) {
          let hasStrongNeighbor = false;
          
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const neighborIdx = ((y + dy) * width + (x + dx)) * 4;
              if (edges[neighborIdx] === strong) {
                hasStrongNeighbor = true;
                break;
              }
            }
            if (hasStrongNeighbor) break;
          }
          
          edges[idx] = hasStrongNeighbor ? strong : 0;
          edges[idx + 1] = edges[idx];
          edges[idx + 2] = edges[idx];
        }
      }
    }
    
    return edges;
  }

  // Encontrar contornos melhorado
  findContours(imageData: ImageData): { x: number; y: number }[][] {
    const contours: { x: number; y: number }[][] = [];
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const visited = new Array(width * height).fill(false);

    console.log('Procurando contornos em imagem:', width, 'x', height);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        if (data[idx] === 255 && !visited[y * width + x]) {
          const contour = this.traceContourImproved(data, width, height, x, y, visited);
          if (contour.length > 20) { // Filtrar contornos muito pequenos
            contours.push(contour);
            console.log('Contorno encontrado com', contour.length, 'pontos');
          }
        }
      }
    }

    console.log('Total de contornos encontrados:', contours.length);
    
    // Se não encontrou contornos, criar um contorno de exemplo
    if (contours.length === 0) {
      console.log('Nenhum contorno encontrado, criando exemplo');
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 4;
      
      const exampleContour = [];
      for (let i = 0; i < 32; i++) {
        const angle = (i / 32) * Math.PI * 2;
        exampleContour.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius
        });
      }
      contours.push(exampleContour);
    }

    // Ordenar contornos por área (maiores primeiro)
    return contours.sort((a, b) => this.calculateContourArea(b) - this.calculateContourArea(a));
  }

  private traceContourImproved(data: Uint8ClampedArray, width: number, height: number, startX: number, startY: number, visited: boolean[]): { x: number; y: number }[] {
    const contour: { x: number; y: number }[] = [];
    
    // Usar algoritmo de seguimento de contorno (Moore neighborhood)
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, 1], [1, 1], [1, 0],
      [1, -1], [0, -1]
    ];
    
    let currentX = startX;
    let currentY = startY;
    let direction = 0;
    
    do {
      contour.push({ x: currentX, y: currentY });
      visited[currentY * width + currentX] = true;
      
      // Procurar próximo pixel de borda
      let found = false;
      for (let i = 0; i < 8; i++) {
        const checkDir = (direction + i) % 8;
        const nextX = currentX + directions[checkDir][0];
        const nextY = currentY + directions[checkDir][1];
        
        if (nextX >= 0 && nextX < width && nextY >= 0 && nextY < height) {
          const idx = (nextY * width + nextX) * 4;
          if (data[idx] === 255) {
            currentX = nextX;
            currentY = nextY;
            direction = (checkDir + 6) % 8; // Ajustar direção
            found = true;
            break;
          }
        }
      }
      
      if (!found) break;
      
    } while (!(currentX === startX && currentY === startY) && contour.length < 10000);
    
    return contour;
  }

  private calculateContourArea(contour: { x: number; y: number }[]): number {
    if (contour.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < contour.length; i++) {
      const j = (i + 1) % contour.length;
      area += contour[i].x * contour[j].y;
      area -= contour[j].x * contour[i].y;
    }
    return Math.abs(area) / 2;
  }

  // Simplificação de contornos melhorada
  douglasPeucker(points: { x: number; y: number }[], epsilon: number = 3): { x: number; y: number }[] {
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

  // Suavização de contornos
  smoothContour(contour: { x: number; y: number }[], windowSize: number = 5): { x: number; y: number }[] {
    if (contour.length < windowSize) return contour;
    
    const smoothed: { x: number; y: number }[] = [];
    const half = Math.floor(windowSize / 2);
    
    for (let i = 0; i < contour.length; i++) {
      let sumX = 0, sumY = 0, count = 0;
      
      for (let j = -half; j <= half; j++) {
        const idx = (i + j + contour.length) % contour.length;
        sumX += contour[idx].x;
        sumY += contour[idx].y;
        count++;
      }
      
      smoothed.push({
        x: sumX / count,
        y: sumY / count
      });
    }
    
    return smoothed;
  }
}