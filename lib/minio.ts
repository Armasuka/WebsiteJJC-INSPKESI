import * as Minio from 'minio';

// Initialize MinIO client
export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || '',
  port: parseInt(process.env.MINIO_PORT || '443'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || '',
  secretKey: process.env.MINIO_SECRET_KEY || '',
});

export const MINIO_BUCKET = process.env.MINIO_BUCKET || 'arya-pl';
export const MINIO_ENABLED = process.env.MINIO_ENABLED === 'true';

/**
 * Upload file to MinIO
 * @param file - File buffer
 * @param fileName - Name of the file
 * @param contentType - MIME type of the file
 * @returns URL of the uploaded file
 */
export async function uploadToMinio(
  file: Buffer,
  fileName: string,
  contentType: string = 'application/octet-stream'
): Promise<string> {
  if (!MINIO_ENABLED) {
    throw new Error('MinIO is not enabled');
  }

  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${fileName}`;

    // Ensure bucket exists
    const bucketExists = await minioClient.bucketExists(MINIO_BUCKET);
    if (!bucketExists) {
      await minioClient.makeBucket(MINIO_BUCKET, process.env.MINIO_REGION || '');
    }

    // Upload file
    await minioClient.putObject(MINIO_BUCKET, uniqueFileName, file, file.length, {
      'Content-Type': contentType,
    });

    // Generate public URL
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const port = process.env.MINIO_PORT || '443';
    const portString = (port === '443' && protocol === 'https') || (port === '80' && protocol === 'http') 
      ? '' 
      : `:${port}`;
    
    const url = `${protocol}://${process.env.MINIO_ENDPOINT}${portString}/${MINIO_BUCKET}/${uniqueFileName}`;
    
    return url;
  } catch (error) {
    console.error('Error uploading to MinIO:', error);
    throw error;
  }
}

/**
 * Delete file from MinIO
 * @param fileUrl - URL of the file to delete
 */
export async function deleteFromMinio(fileUrl: string): Promise<void> {
  if (!MINIO_ENABLED) {
    throw new Error('MinIO is not enabled');
  }

  try {
    // Extract filename from URL
    const fileName = fileUrl.split('/').pop();
    if (!fileName) {
      throw new Error('Invalid file URL');
    }

    await minioClient.removeObject(MINIO_BUCKET, fileName);
  } catch (error) {
    console.error('Error deleting from MinIO:', error);
    throw error;
  }
}

/**
 * Convert base64 string to buffer
 * @param base64String - Base64 encoded string (with or without data URI prefix)
 */
export function base64ToBuffer(base64String: string): Buffer {
  // Remove data URI prefix if present (e.g., "data:image/png;base64,")
  const base64Data = base64String.includes(',') 
    ? base64String.split(',')[1] 
    : base64String;
  
  return Buffer.from(base64Data, 'base64');
}

/**
 * Get content type from base64 data URI
 * @param base64String - Base64 encoded string with data URI prefix
 */
export function getContentTypeFromBase64(base64String: string): string {
  if (!base64String.includes(',')) {
    return 'application/octet-stream';
  }
  
  const prefix = base64String.split(',')[0];
  const matches = prefix.match(/data:([^;]+);/);
  
  return matches ? matches[1] : 'application/octet-stream';
}
