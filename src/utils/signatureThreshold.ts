/**
 * Utilidades de Procesamiento de Firma en Canvas (Cliente)
 * Algoritmo de Umbralización de Luminancia (Luminance Thresholding)
 * Sin dependencias externas, 0% CPU en servidor, ejecución < 10 ms.
 */

export interface ThresholdOptions {
  /**
   * Sensibilidad de limpieza de fondo (0 a 100, por defecto 75)
   * Mayor sensibilidad = elimina sombras más oscuras
   */
  sensitivity?: number;
  /**
   * Ancho máximo del canvas para evitar procesar fotos masivas (por defecto 800)
   */
  maxWidth?: number;
  /**
   * Alto máximo del canvas (por defecto 400)
   */
  maxHeight?: number;
  /**
   * Color de tinta reforzado (opcional). Si es null, conserva los colores del trazo original.
   */
  targetInkColor?: string | null;
}

/**
 * Procesa una imagen de firma tomada en papel blanco y elimina el fondo mediante umbralización
 */
export async function processSignatureImage(
  fileOrDataUrl: File | string,
  options: ThresholdOptions = {},
): Promise<string> {
  const {
    sensitivity = 75,
    maxWidth = 800,
    maxHeight = 400,
    targetInkColor = null,
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // 1. Escalar preservando aspecto
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          return reject(new Error('No se pudo obtener el contexto 2D del canvas'));
        }

        ctx.drawImage(img, 0, 0, width, height);

        // 2. Extraer buffer de píxeles
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Umbral normalizado (255 * (1 - sensibilidad / 120))
        // Un valor de 75 mapea a aprox umbral de luminancia 180-200
        const threshold = Math.round(255 * (1 - (sensitivity * 0.45) / 100));

        let inkR = 15;
        let inkG = 23;
        let inkB = 42; // Negro profundo por defecto

        if (targetInkColor === 'blue') {
          inkR = 30;
          inkG = 58;
          inkB = 138; // Azul notarial (#1E3A8A)
        }

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Fórmula de luminancia perceptual estándar
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

          if (luminance > threshold) {
            // Fondo de papel blanco/grisáceo -> 100% transparente
            data[i + 3] = 0;
          } else {
            // Trazo de tinta -> Máxima opacidad
            data[i + 3] = 255;

            // Si se especificó reemplazo de tinta a color uniforme
            if (targetInkColor) {
              data[i] = inkR;
              data[i + 1] = inkG;
              data[i + 2] = inkB;
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);

        // 3. Recortar bordes transparentes sobrantes (trim)
        const trimmedCanvas = trimTransparentCanvas(canvas);
        resolve(trimmedCanvas.toDataURL('image/png'));
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => reject(err);

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

/**
 * Recorta los bordes transparentes sobrantes de un canvas para centrar la firma
 */
export function trimTransparentCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  let top = height;
  let bottom = 0;
  let left = width;
  let right = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 0) {
        found = true;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }

  if (!found) return canvas;

  // Añadir un pequeño margen de 10px
  const padding = 10;
  const cropX = Math.max(0, left - padding);
  const cropY = Math.max(0, top - padding);
  const cropWidth = Math.min(width - cropX, right - left + padding * 2);
  const cropHeight = Math.min(height - cropY, bottom - top + padding * 2);

  const trimmed = document.createElement('canvas');
  trimmed.width = cropWidth;
  trimmed.height = cropHeight;

  const trimmedCtx = trimmed.getContext('2d');
  if (!trimmedCtx) return canvas;

  trimmedCtx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
  return trimmed;
}

/**
 * Renderiza un texto en una tipografía caligráfica hacia un DataURL PNG transparente
 * Si el navegador dispone de document.fonts, aguarda a que la fuente esté renderizable.
 */
export async function renderTextSignatureToDataUrl(
  text: string,
  fontFamily: string,
  color: string = '#1E3A8A',
): Promise<string> {
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.load(`64px "${fontFamily}"`);
      await document.fonts.ready;
    } catch {
      // Fallback si la carga asíncrona no es soportada
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = 700;
  canvas.height = 220;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  ctx.font = `64px "${fontFamily}", cursive, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const trimmed = trimTransparentCanvas(canvas);
  return trimmed.toDataURL('image/png');
}
