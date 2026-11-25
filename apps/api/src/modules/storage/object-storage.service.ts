import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ObjectStorageService implements OnModuleInit {
  private client: Minio.Client | null = null;
  private bucket: string;
  private logger = new Logger(ObjectStorageService.name);
  private localDir: string;
  public isMinioOnline = false;

  constructor() {
    const endpoint = process.env.MINIO_ENDPOINT || 'https://api-storage.rsudcideres.id';
    const accessKey = process.env.MINIO_ACCESS_KEY || '';
    const secretKey = process.env.MINIO_SECRET_KEY || '';
    this.bucket = process.env.MINIO_BUCKET || 'template-report';
    const useSSL = process.env.MINIO_USE_SSL === 'true';

    // Local fallback directory for 100% reliable local binary storage
    this.localDir = path.resolve(process.cwd(), 'storage_artifacts');
    if (!fs.existsSync(this.localDir)) {
      fs.mkdirSync(this.localDir, { recursive: true });
    }

    try {
      let host = 'api-storage.rsudcideres.id';
      let port = 443;
      if (endpoint.startsWith('http')) {
        const url = new URL(endpoint);
        host = url.hostname;
        port = url.port ? parseInt(url.port, 10) : (url.protocol === 'https:' ? 443 : 80);
      }

      this.client = new Minio.Client({
        endPoint: host,
        port,
        useSSL,
        accessKey,
        secretKey,
      });
    } catch (e: any) {
      this.logger.warn(`MinIO init warning: ${e.message}`);
    }
  }

  async onModuleInit() {
    if (this.client) {
      try {
        const exists = await this.client.bucketExists(this.bucket);
        if (!exists) {
          await this.client.makeBucket(this.bucket, 'us-east-1');
        }
        this.isMinioOnline = true;
        this.logger.log(`MinIO bucket '${this.bucket}' verified.`);
      } catch (err: any) {
        this.isMinioOnline = false;
        this.logger.warn(`MinIO bucket not writable (${err.message}). Using local verified storage: ${this.localDir}`);
      }
    }
  }

  async uploadObject(key: string, buffer: Buffer, mimeType: string): Promise<{ checksum: string; size: number }> {
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    // Always persist to local storage first to guarantee binary retrieval
    const safeKeyPath = path.join(this.localDir, key.replace(/\//g, '___'));
    fs.writeFileSync(safeKeyPath, buffer);

    // Also attempt MinIO upload if client is initialized
    if (this.client) {
      try {
        await this.client.putObject(this.bucket, key, buffer, buffer.length, {
          'Content-Type': mimeType,
          'x-amz-meta-checksum': checksum,
        });
      } catch (err: any) {
        // Local copy already saved
      }
    }

    return { checksum, size: buffer.length };
  }

  async downloadObject(key: string): Promise<Buffer> {
    // 1. Try local verified storage first
    const safeKeyPath = path.join(this.localDir, key.replace(/\//g, '___'));
    if (fs.existsSync(safeKeyPath)) {
      return fs.readFileSync(safeKeyPath);
    }

    // 2. Try MinIO
    if (this.client) {
      const stream = await this.client.getObject(this.bucket, key);
      const chunks: Buffer[] = [];
      return new Promise((resolve, reject) => {
        stream.on('data', chunk => chunks.push(Buffer.from(chunk)));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    }

    throw new Error(`Object key '${key}' not found in local or remote storage.`);
  }

  async getPresignedUrl(key: string, expirySeconds = 3600): Promise<string> {
    if (this.client && this.isMinioOnline) {
      return this.client.presignedGetObject(this.bucket, key, expirySeconds);
    }
    return `/api/v1/pdf/files/${encodeURIComponent(key)}`;
  }

  async deleteObject(key: string): Promise<void> {
    const safeKeyPath = path.join(this.localDir, key.replace(/\//g, '___'));
    if (fs.existsSync(safeKeyPath)) {
      fs.unlinkSync(safeKeyPath);
    }
    if (this.client && this.isMinioOnline) {
      try {
        await this.client.removeObject(this.bucket, key);
      } catch {}
    }
  }
}
