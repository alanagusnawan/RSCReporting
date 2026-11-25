import { Controller, Get, Post, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ObjectStorageService } from '../storage/object-storage.service';
import { PrismaService } from '../../common/prisma.service';
import * as crypto from 'crypto';

@Controller('api/v1/files')
export class FilesController {
  constructor(
    private storage: ObjectStorageService,
    private prisma: PrismaService,
  ) {}

  @Get()
  async list() {
    try {
      return await this.prisma.fileRecord.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    } catch {
      return [];
    }
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    const fileId = crypto.randomUUID();
    const objectKey = `assets/${fileId}/${file.originalname}`;
    const uploadRes = await this.storage.uploadObject(objectKey, file.buffer, file.mimetype);

    const record = await this.prisma.fileRecord.create({
      data: {
        id: fileId,
        originalFilename: file.originalname,
        sanitizedFilename: file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'),
        mimeType: file.mimetype,
        sizeBytes: uploadRes.size,
        sha256: uploadRes.checksum,
        bucket: process.env.MINIO_BUCKET || 'template-report',
        objectKey,
      },
    });

    return record;
  }
}
