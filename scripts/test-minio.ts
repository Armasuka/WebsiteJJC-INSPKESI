/**
 * Test script untuk koneksi MinIO
 * Run dengan: npx ts-node scripts/test-minio.ts
 */

import * as Minio from 'minio';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || '',
  port: parseInt(process.env.MINIO_PORT || '443'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || '',
  secretKey: process.env.MINIO_SECRET_KEY || '',
});

const BUCKET = process.env.MINIO_BUCKET || 'arya-pl';

async function testMinioConnection() {
  console.log('🔍 Testing MinIO Connection...\n');
  
  console.log('Configuration:');
  console.log(`  Endpoint: ${process.env.MINIO_ENDPOINT}`);
  console.log(`  Port: ${process.env.MINIO_PORT}`);
  console.log(`  SSL: ${process.env.MINIO_USE_SSL}`);
  console.log(`  Bucket: ${BUCKET}`);
  console.log(`  Enabled: ${process.env.MINIO_ENABLED}\n`);

  try {
    // Test 1: List buckets
    console.log('📋 Test 1: Listing buckets...');
    const buckets = await minioClient.listBuckets();
    console.log(`✅ Success! Found ${buckets.length} bucket(s):`);
    buckets.forEach((bucket) => {
      console.log(`   - ${bucket.name} (created: ${bucket.creationDate})`);
    });
    console.log();

    // Test 2: Check if our bucket exists
    console.log(`📦 Test 2: Checking if bucket "${BUCKET}" exists...`);
    const bucketExists = await minioClient.bucketExists(BUCKET);
    if (bucketExists) {
      console.log(`✅ Bucket "${BUCKET}" exists!`);
    } else {
      console.log(`⚠️  Bucket "${BUCKET}" does not exist. Creating...`);
      await minioClient.makeBucket(BUCKET, process.env.MINIO_REGION || '');
      console.log(`✅ Bucket "${BUCKET}" created successfully!`);
    }
    console.log();

    // Test 3: Upload a test file
    console.log('📤 Test 3: Uploading test file...');
    const testContent = Buffer.from('Hello from MinIO test script!');
    const testFileName = `test-${Date.now()}.txt`;
    
    await minioClient.putObject(
      BUCKET,
      testFileName,
      testContent,
      testContent.length,
      { 'Content-Type': 'text/plain' }
    );
    console.log(`✅ Test file uploaded: ${testFileName}`);
    console.log();

    // Test 4: Get file URL
    console.log('🔗 Test 4: Generating file URL...');
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const port = process.env.MINIO_PORT || '443';
    const portString = (port === '443' && protocol === 'https') || (port === '80' && protocol === 'http') 
      ? '' 
      : `:${port}`;
    const url = `${protocol}://${process.env.MINIO_ENDPOINT}${portString}/${BUCKET}/${testFileName}`;
    console.log(`✅ File URL: ${url}`);
    console.log();

    // Test 5: List objects in bucket
    console.log('📑 Test 5: Listing objects in bucket...');
    const objectsStream = minioClient.listObjectsV2(BUCKET, '', true);
    const objects: any[] = [];
    
    await new Promise((resolve, reject) => {
      objectsStream.on('data', (obj) => objects.push(obj));
      objectsStream.on('end', resolve);
      objectsStream.on('error', reject);
    });
    
    console.log(`✅ Found ${objects.length} object(s) in bucket:`);
    objects.slice(0, 10).forEach((obj) => {
      console.log(`   - ${obj.name} (${obj.size} bytes, ${obj.lastModified})`);
    });
    if (objects.length > 10) {
      console.log(`   ... and ${objects.length - 10} more`);
    }
    console.log();

    // Test 6: Delete test file
    console.log('🗑️  Test 6: Deleting test file...');
    await minioClient.removeObject(BUCKET, testFileName);
    console.log(`✅ Test file deleted: ${testFileName}`);
    console.log();

    console.log('🎉 All tests passed! MinIO is working correctly.\n');
    
  } catch (error) {
    console.error('❌ Error during testing:');
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    } else {
      console.error(error);
    }
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Check if MinIO credentials are correct in .env');
    console.log('   2. Verify MinIO endpoint is accessible');
    console.log('   3. Check network/firewall settings');
    console.log('   4. Ensure MINIO_ENABLED=true in .env\n');
    process.exit(1);
  }
}

// Run the test
testMinioConnection();
