/**
 * Process file for database storage
 * @param file - File object or base64 string
 * @param fileName - Optional custom filename (not used, kept for compatibility)
 * @returns Base64 string to be stored in database
 */
export async function uploadFileToMinio(
  file: File | string,
  fileName?: string
): Promise<string> {
  // If already a string (base64), return it directly
  if (typeof file === 'string') {
    return file;
  }

  // If it's a File object, convert to base64
  if (file instanceof File) {
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      return base64;
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
 * Process signature for database storage
 * @param signatureBase64 - Base64 encoded signature data (from canvas.toDataURL())
 * @param signatureType - Type of signature (kept for compatibility, not used)
 * @returns Base64 string to be stored in database
 */
export async function uploadSignatureToMinio(
  signatureBase64: string,
  signatureType: string
): Promise<string> {
  // Simply return the base64 string directly
  return signatureBase64;
}
