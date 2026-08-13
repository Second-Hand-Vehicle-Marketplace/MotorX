import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';

export const storageClient = new S3Client({
	endpoint: env.S3_ENDPOINT,
	region: env.S3_REGION,
	forcePathStyle: true,
	credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
});

export async function downloadObject(key: string): Promise<Buffer> {
	const result = await storageClient.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
	const body = result.Body;
	if (!body) throw new Error(`Storage object is empty: ${key}`);
	const chunks: Buffer[] = [];
	for await (const chunk of body as AsyncIterable<Buffer | Uint8Array>) chunks.push(Buffer.from(chunk));
	return Buffer.concat(chunks);
}

export async function uploadObject(key: string, body: Buffer, contentType: string): Promise<void> {
	await storageClient.send(new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: key, Body: body, ContentType: contentType }));
}
