import { Controller, Post, Get, Body, Param, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { PdfGenerationService, GeneratePdfDto } from './pdf-generation.service';

@Controller('api/v1/pdf')
export class PdfGenerationController {
  constructor(private pdfService: PdfGenerationService) {}

  @Post('generate')
  async generate(@Body() dto: GeneratePdfDto, @Res() res: Response) {
    const result = await this.pdfService.generate(dto);

    if (dto.output?.mode === 'binary' && !dto.printer) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${dto.output.fileName || 'report.pdf'}"`);
      return res.status(HttpStatus.OK).send(result.buffer);
    }

    return res.status(HttpStatus.OK).json(result.responsePayload);
  }

  @Get('files/:artifactId')
  async getFile(@Param('artifactId') artifactId: string, @Res() res: Response) {
    const artifact = await this.pdfService.getArtifact(artifactId);
    res.setHeader('Content-Type', artifact.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${artifact.filename}"`);
    return res.status(HttpStatus.OK).send(artifact.buffer);
  }

  @Get('files/:artifactId/download')
  async downloadFile(@Param('artifactId') artifactId: string, @Res() res: Response) {
    const artifact = await this.pdfService.getArtifact(artifactId);
    res.setHeader('Content-Type', artifact.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${artifact.filename}"`);
    return res.status(HttpStatus.OK).send(artifact.buffer);
  }
}
