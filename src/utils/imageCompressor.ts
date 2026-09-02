/**
 * Client-side high-performance image optimizer
 * Compresses raw high-res camera photos (5MB - 20MB) down to clean, sharp JPEG (~150KB - 250KB)
 * Prevents HTTP 413 Payload Too Large and ensures lightning-fast network transmission.
 */
export async function compressImageFile(
  file: File,
  maxDimension = 1280,
  quality = 0.82
): Promise<{ data: string; mimeType: string; name: string }> {
  // If not an image (e.g. text/pdf), read as standard base64 data URL
  if (!file.type.startsWith('image/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          data: e.target?.result as string,
          mimeType: file.type || 'application/octet-stream',
          name: file.name,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();

      img.onload = () => {
        try {
          let { width, height } = img;

          // Downscale if dimensions exceed maxDimension
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            // Fallback to original
            resolve({ data: src, mimeType: file.type, name: file.name });
            return;
          }

          // Smooth rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Export as optimized JPEG
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve({
            data: compressedDataUrl,
            mimeType: 'image/jpeg',
            name: file.name.replace(/\.[^/.]+$/, '') + '.jpg',
          });
        } catch (err) {
          console.warn('Image canvas compression failed, using original data:', err);
          resolve({ data: src, mimeType: file.type, name: file.name });
        }
      };

      img.onerror = () => {
        resolve({ data: src, mimeType: file.type, name: file.name });
      };

      img.src = src;
    };

    reader.onerror = () => {
      resolve({ data: '', mimeType: file.type, name: file.name });
    };

    reader.readAsDataURL(file);
  });
}
