// Server-only: subida de fotos a Cloudflare R2 vía URL prefirmada (el cliente
// sube directo a R2, sin pasar los bytes por nuestro server).
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const accountId = process.env.R2_ACCOUNT_ID;
const bucket = process.env.R2_BUCKET;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

export const r2Configurado = !!(accountId && bucket && accessKeyId && secretAccessKey);

let client: S3Client | null = null;
function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKeyId as string, secretAccessKey: secretAccessKey as string },
    });
  }
  return client;
}

export async function presignPut(key: string, contentType: string): Promise<string> {
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  return getSignedUrl(getClient(), cmd, { expiresIn: 300 });
}

export async function uploadObject(key: string, body: Uint8Array, contentType: string): Promise<void> {
  await getClient().send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
  );
}

export async function getObject(key: string): Promise<{ body: Uint8Array; contentType?: string }> {
  const res = await getClient().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const body = await res.Body!.transformToByteArray();
  return { body, contentType: res.ContentType };
}
