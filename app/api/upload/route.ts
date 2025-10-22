import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadToMinio, base64ToBuffer, getContentTypeFromBase64, MINIO_ENABLED } from '@/lib/minio';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if MinIO is enabled
    if (!MINIO_ENABLED) {
      return NextResponse.json({ error: 'MinIO is not enabled' }, { status: 503 });
    }

    const body = await request.json();
    const { file, fileName } = body;

    if (!file || !fileName) {
      return NextResponse.json(
        { error: 'File and fileName are required' },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const buffer = base64ToBuffer(file);
    const contentType = getContentTypeFromBase64(file);

    // Upload to MinIO
    const url = await uploadToMinio(buffer, fileName, contentType);

    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
