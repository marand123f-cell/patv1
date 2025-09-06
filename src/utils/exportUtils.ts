import { PatternData } from '../types';

export class ExportUtils {
  static async exportToPNG(canvas: HTMLCanvasElement, filename: string): Promise<void> {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static async exportToSVG(patternData: PatternData, customerName: string, filename: string): Promise<void> {
    const A4_WIDTH = 210; // mm
    const A4_HEIGHT = 297; // mm
    
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${A4_WIDTH}mm" height="${A4_HEIGHT}mm" viewBox="0 0 ${A4_WIDTH * 3.78} ${A4_HEIGHT * 3.78}">`;

    // Add grid
    svg += `<defs>
      <pattern id="grid" width="37.8" height="37.8" patternUnits="userSpaceOnUse">
        <path d="M 37.8 0 L 0 0 0 37.8" fill="none" stroke="#e5e7eb" stroke-width="0.5"/>
      </pattern>
      <pattern id="majorgrid" width="189" height="189" patternUnits="userSpaceOnUse">
        <path d="M 189 0 L 0 0 0 189" fill="none" stroke="#9ca3af" stroke-width="1"/>
      </pattern>
    </defs>`;
    
    svg += `<rect width="100%" height="100%" fill="url(#grid)" />`;
    svg += `<rect width="100%" height="100%" fill="url(#majorgrid)" />`;
    
    // Add border
    svg += `<rect x="0" y="0" width="${A4_WIDTH * 3.78}" height="${A4_HEIGHT * 3.78}" fill="none" stroke="#374151" stroke-width="2"/>`;
    
    // Add title
    svg += `<text x="${(A4_WIDTH * 3.78) / 2}" y="40" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="bold" fill="#1f2937">MOLDE VETORIZADO - ESCALA 1:1</text>`;
    svg += `<text x="${(A4_WIDTH * 3.78) / 2}" y="70" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#1f2937">Cliente: ${customerName}</text>`;
    
    // Add contours
    patternData.contours.forEach((contour, index) => {
      if (contour.length < 2) return;
      
      let path = `M ${contour[0].x} ${contour[0].y}`;
      for (let i = 1; i < contour.length; i++) {
        path += ` L ${contour[i].x} ${contour[i].y}`;
      }
      path += ' Z';
      
      svg += `<path d="${path}" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    });
    
    // Add date
    const date = new Date().toLocaleDateString('pt-BR');
    svg += `<text x="20" y="${A4_HEIGHT * 3.78 - 40}" font-family="sans-serif" font-size="14" fill="#1f2937">Data: ${date}</text>`;
    svg += `<text x="${A4_WIDTH * 3.78 - 20}" y="${A4_HEIGHT * 3.78 - 40}" text-anchor="end" font-family="sans-serif" font-size="14" fill="#1f2937">Processado com IA - Escala 1:1</text>`;
    
    svg += '</svg>';
    
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static async exportToDXF(patternData: PatternData, filename: string): Promise<void> {
    let dxf = `0
SECTION
2
ENTITIES
`;

    patternData.contours.forEach((contour, index) => {
      for (let i = 0; i < contour.length; i++) {
        const current = contour[i];
        const next = contour[(i + 1) % contour.length];
        
        dxf += `0
LINE
8
MOLDE
10
${current.x / 3.78} 
20
${current.y / 3.78}
11
${next.x / 3.78}
21
${next.y / 3.78}
`;
      }
    });

    dxf += `0
ENDSEC
0
EOF`;

    const blob = new Blob([dxf], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}