import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ─────────────────────────────────────────────────────────────
// Audio Catalog Service
//
// Manages athan/doaa audio files stored in Cloudflare R2.
// Provides upload, listing, and signed download URLs.
// Phase 6: Devices can download new audio files to SD card.
// ─────────────────────────────────────────────────────────────

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || '',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY || '',
    secretAccessKey: process.env.R2_SECRET_KEY || '',
  },
});

const BUCKET = process.env.R2_BUCKET || 'myathan';

export interface AudioFile {
  key: string;
  name: string;
  category: 'athan' | 'doaa' | 'takbeer' | 'suhoor' | 'iqama';
  size: number;
  uploadedAt: string;
}

export async function uploadAudio(
  category: string,
  filename: string,
  data: Buffer,
  contentType = 'audio/mpeg',
): Promise<string> {
  const key = `audio/${category}/${filename}`;

  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: data,
    ContentType: contentType,
  }));

  return key;
}

export async function listAudio(category?: string): Promise<AudioFile[]> {
  const prefix = category ? `audio/${category}/` : 'audio/';

  const result = await r2.send(new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: prefix,
  }));

  return (result.Contents || []).map(obj => {
    const parts = (obj.Key || '').split('/');
    return {
      key: obj.Key || '',
      name: parts[parts.length - 1],
      category: parts[1] as AudioFile['category'],
      size: obj.Size || 0,
      uploadedAt: obj.LastModified?.toISOString() || '',
    };
  });
}

export async function getAudioDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(r2, command, { expiresIn });
}

// ─────────────────────────────────────────────────────────────
// Firmware Binary Storage (for OTA)
// ─────────────────────────────────────────────────────────────

export async function uploadFirmware(version: string, data: Buffer): Promise<string> {
  const key = `firmware/${version}/firmware.bin`;

  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: data,
    ContentType: 'application/octet-stream',
  }));

  return key;
}

export async function getFirmwareDownloadUrl(version: string, expiresIn = 3600): Promise<string> {
  const key = `firmware/${version}/firmware.bin`;
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(r2, command, { expiresIn });
}
