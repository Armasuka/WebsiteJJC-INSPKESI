/**
 * Upload file to MinIO server
 * @param file - File object or base64 string
 * @param fileName - Optional custom filename
 * @returns URL of the uploaded file or base64 string if upload fails
 */
export async function uploadFileToMinio(
  file: File | string,
  fileName?: string
): Promise<string> {
  // If already a string (base64 from localStorage), upload it
  if (typeof file === 'string') {
    // If it's already a URL (starts with http), return as is
    if (file.startsWith('http://') || file.startsWith('https://')) {
      return file;
    }
    
    // If it's base64, try to upload to MinIO
    try {
      const generatedFileName = fileName || `image-${Date.now()}.jpg`;
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: file,
          fileName: generatedFileName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      } else {
        console.error('Failed to upload to MinIO, using base64 fallback');
        return file; // Return base64 as fallback
      }
    } catch (error) {
      console.error('Error uploading to MinIO:', error);
      return file; // Return base64 as fallback
    }
  }

  // If it's a File object, convert to base64 first then upload
  if (file instanceof File) {
    try {
      // Convert File to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload to MinIO
      const uploadFileName = fileName || file.name;
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: base64,
          fileName: uploadFileName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      } else {
        console.error('Failed to upload to MinIO, using base64 fallback');
        return base64; // Return base64 as fallback
      }
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    }
  }

  // Invalid type
  throw new Error('Invalid file type');
}

/**
 * Convert File object to base64 (for local preview before upload)
 * @param file - File object
 * @returns Promise that resolves to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload signature (base64 PNG) to MinIO
 * @param signatureBase64 - Base64 encoded signature data (from canvas.toDataURL())
 * @param signatureType - Type of signature (e.g., 'ttd-petugas1', 'ttd-manager-traffic')
 * @returns URL of the uploaded signature or base64 string if upload fails
 */
export async function uploadSignatureToMinio(
  signatureBase64: string,
  signatureType: string
): Promise<string> {
  // If already a URL (starts with http), return as is
  if (signatureBase64.startsWith('http://') || signatureBase64.startsWith('https://')) {
    return signatureBase64;
  }

  // Try to upload to MinIO
  try {
    const fileName = `${signatureType}-${Date.now()}.png`;
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: signatureBase64,
        fileName: fileName,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Signature uploaded to MinIO: ${data.url}`);
      return data.url;
    } else {
      console.error('Failed to upload signature to MinIO, using base64 fallback');
      return signatureBase64; // Return base64 as fallback
    }
  } catch (error) {
    console.error('Error uploading signature to MinIO:', error);
    return signatureBase64; // Return base64 as fallback
  }
}
