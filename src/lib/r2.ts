import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2's S3-compatible API, replacing @vercel/blob. Every other
// file keeps the same pathname-as-metadata design that made Blob work
// without a database — only the storage backend underneath changes.

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

let cachedClient: S3Client | null = null;
function client(): S3Client {
  if (cachedClient) return cachedClient;
  cachedClient = new S3Client({
    region: "auto",
    endpoint: env("R2_ENDPOINT"),
    credentials: {
      accessKeyId: env("R2_ACCESS_KEY_ID"),
      secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
    },
  });
  return cachedClient;
}

function bucket(): string {
  return env("R2_BUCKET");
}

// The bucket's public R2.dev (or later, custom-domain) base URL — same
// role as the permanent URLs Vercel Blob used to hand back, so nothing
// downstream needs to change how it stores or renders a brochure's url.
//
// Keys here often already contain percent-encoded characters (titles are
// run through encodeURIComponent before becoming part of the key, e.g.
// "Accent%20Furniture" as literal characters) — encoding each path
// segment again turns that literal "%" into "%25" so the browser's own
// URL-decoding lands back on the real key instead of silently 404ing on
// a decoded-once mismatch.
export function publicUrlFor(key: string): string {
  const base = env("R2_PUBLIC_BASE_URL").replace(/\/$/, "");
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `${base}/${encodedKey}`;
}

export type R2Object = {
  pathname: string;
  url: string;
  uploadedAt: Date;
};

export async function r2Put(
  key: string,
  body: string | Uint8Array,
  contentType: string,
): Promise<{ url: string; pathname: string }> {
  await client().send(
    new PutObjectCommand({ Bucket: bucket(), Key: key, Body: body, ContentType: contentType }),
  );
  return { url: publicUrlFor(key), pathname: key };
}

export async function r2List(prefix: string): Promise<R2Object[]> {
  const objects: R2Object[] = [];
  let continuationToken: string | undefined;
  do {
    const result = await client().send(
      new ListObjectsV2Command({ Bucket: bucket(), Prefix: prefix, ContinuationToken: continuationToken }),
    );
    for (const item of result.Contents ?? []) {
      if (!item.Key) continue;
      objects.push({ pathname: item.Key, url: publicUrlFor(item.Key), uploadedAt: item.LastModified ?? new Date(0) });
    }
    continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
  } while (continuationToken);
  return objects;
}

export async function r2Del(key: string): Promise<void> {
  await client().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}

export async function r2GetText(key: string): Promise<string | null> {
  try {
    const result = await client().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
    if (!result.Body) return null;
    return await result.Body.transformToString();
  } catch (err) {
    if ((err as { name?: string })?.name === "NoSuchKey") return null;
    throw err;
  }
}

// Lets the browser PUT a file straight to R2, bypassing Vercel's fixed
// 4.5MB request-body limit for Functions the same way @vercel/blob/client's
// direct-upload flow did.
export async function r2PresignPut(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType });
  return getSignedUrl(client(), command, { expiresIn: 300 });
}
