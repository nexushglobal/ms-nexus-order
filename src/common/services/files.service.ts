import { Injectable, Logger } from '@nestjs/common';
import { MessagingService } from 'src/messaging/messaging.service';
import { UploadImagesResponseDto } from 'src/products/dto/upload-product-images.dto';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(private readonly client: MessagingService) {}

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'products',
  ): Promise<UploadImagesResponseDto> {
    const payload = {
      file: {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
      folder,
    };
    return await this.client.send(
      { cmd: 'integration.files.uploadImage' },
      payload,
    );
  }

  async deleteImage(key: string) {
    return await this.client.send({ cmd: 'integration.files.delete' }, { key });
  }
}
