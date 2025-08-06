// services/product-image.service.ts
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { FilesService } from 'src/common/services/files.service';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { UpdateImageDto } from '../dto/update-product.dto';
import { UploadImagesDto } from '../dto/upload-product-images.dto';
import { ProductImage } from '../entities/product-image.entity';
import { Product } from '../entities/products.entity';
import { ProductsService } from './products.service';

@Injectable()
export class ProductImageService {
  private readonly logger = new Logger(ProductImageService.name);

  constructor(
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    private readonly filesService: FilesService,
    private readonly dataSource: DataSource,
    private readonly productService: ProductsService,
  ) {}

  async uploadProductImages(
    uploadImagesDto: UploadImagesDto,
    savedProduct: Product,
    queryRunner: QueryRunner,
  ): Promise<ProductImage[]> {
    const { files } = uploadImagesDto;
    const savedImages: ProductImage[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const s3Response = await this.filesService.uploadImage(
          files[i],
          'products',
        );
        const productImage = this.productImageRepository.create({
          url: s3Response.url,
          urlKey: s3Response.key, // Mantengo tu campo urlKey
          isMain: i === 0,
          order: i,
          product: savedProduct,
        });
        const savedImage = await queryRunner.manager.save(productImage);
        savedImages.push(savedImage);
      } catch (error) {
        this.logger.error(
          `Error al subir imagen ${i + 1}: ${error.message}`,
          error.stack,
        );
        throw new RpcException({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Error al subir imagen: ${error.message}`,
        });
      }
    }
    return savedImages;
  }

  async addImageToProduct(productId: number, file: Express.Multer.File) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await this.productService.findOne(productId);
      if (product.images.length >= 5)
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'No se pueden tener más de 5 imágenes por producto',
        });
      const s3Response = await this.filesService.uploadImage(file, 'products');
      const newImage = this.productImageRepository.create({
        url: s3Response.url,
        urlKey: s3Response.key,
        isMain: false,
        order: product.images.length,
        product: { id: productId },
      });

      await queryRunner.manager.save(newImage);
      await queryRunner.commitTransaction();
      const updatedProduct = await this.productService.findOne(productId);
      return {
        success: true,
        message: 'Imagen agregada exitosamente',
        images: updatedProduct.images.map((img) => ({
          id: img.id,
          url: img.url,
          isMain: img.isMain,
        })),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error al agregar imagen: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateProductImage(
    productId: number,
    imageId: number,
    updateImageDto: UpdateImageDto,
    file?: Express.Multer.File,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const product = await this.productService.findOne(productId);
      const image = await this.productImageRepository.findOne({
        where: { id: imageId, product: { id: productId } },
      });
      if (!image)
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `Imagen con ID ${imageId} no encontrada para el producto`,
        });
      if (file) {
        if (image.urlKey) {
          await this.filesService.deleteImage(image.urlKey);
          const s3Response = await this.filesService.uploadImage(
            file,
            'products',
          );
          image.url = s3Response.url;
          image.urlKey = s3Response.key;
        }
        if (updateImageDto.isMain) {
          const otherImages = product.images.filter(
            (img) => img.id !== imageId,
          );
          for (const otherImage of otherImages) {
            otherImage.isMain = false;
            await queryRunner.manager.save(otherImage);
          }
        }
        if (updateImageDto.isMain !== undefined)
          image.isMain = updateImageDto.isMain;
        if (updateImageDto.order !== undefined)
          image.order = updateImageDto.order;
        const updatedImage = await queryRunner.manager.save(image);
        await queryRunner.commitTransaction();
        return {
          id: updatedImage.id,
          url: updatedImage.url,
          isMain: updatedImage.isMain,
          order: updatedImage.order,
        };
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error al actualizar imagen: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteProductImage(productId: number, imageId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await this.productService.findOne(productId);
      if (product.images.length <= 1)
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'No se puede eliminar la única imagen del producto',
        });
      const image = await this.productImageRepository.findOne({
        where: { id: imageId, product: { id: productId } },
      });
      if (!image)
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `Imagen con ID ${imageId} no encontrada para el producto`,
        });

      if (image.urlKey) await this.filesService.deleteImage(image.urlKey);

      if (image.isMain && product.images.length > 1) {
        const nextImage = product.images.find((img) => img.id !== imageId);
        if (nextImage) {
          nextImage.isMain = true;
          await queryRunner.manager.save(nextImage);
        }
      }
      await queryRunner.manager.remove(image);
      await queryRunner.commitTransaction();
      return { message: 'Imagen eliminada exitosamente' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error al eliminar imagen: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
