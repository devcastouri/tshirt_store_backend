import { Controller, Get, Param, HttpException, HttpStatus, Put, Body, UseInterceptors, UploadedFile, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { memoryStorage } from 'multer';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getProducts() {
    try {
      const result = await this.productsService.getProducts();
      return {
        data: {
          products: result.products
        }
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch products',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async getProductById(@Param('id') id: string) {
    try {
      const result = await this.productsService.getProductById(id);
      return {
        data: {
          product: result.product
        }
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch product',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image', {
    storage: memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  }))
  async updateProduct(
    @Param('id') id: string,
    @Body() updateData: any,
    @UploadedFile() file?: Express.Multer.File
  ) {
    try {
      console.log('Received update request for product:', id);
      console.log('Update data:', updateData);
      
      if (file) {
        console.log('Received file details:', {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          buffer: file.buffer ? 'Buffer present' : 'No buffer'
        });
      } else {
        console.log('No file received in request');
      }

      // Parse JSON strings back to objects if they exist
      const parsedData = { ...updateData };
      if (typeof parsedData.sizes === 'string') {
        try {
          parsedData.sizes = JSON.parse(parsedData.sizes);
        } catch (e) {
          console.error('Error parsing sizes:', e);
          parsedData.sizes = [];
        }
      }
      if (typeof parsedData.colors === 'string') {
        try {
          parsedData.colors = JSON.parse(parsedData.colors);
        } catch (e) {
          console.error('Error parsing colors:', e);
          parsedData.colors = [];
        }
      }

      const result = await this.productsService.updateProduct(id, parsedData, file);
      return {
        data: {
          product: result.product
        }
      };
    } catch (error) {
      console.error('Controller error updating product:', error);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message || 'Failed to update product',
          details: error.details || null
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id/images')
  async deleteProductImage(
    @Param('id') id: string,
    @Body() body: { imageUrl: string }
  ) {
    try {
      console.log('Deleting image for product:', id);
      console.log('Image URL:', body.imageUrl);

      const result = await this.productsService.deleteProductImage(id, body.imageUrl);
      return {
        data: {
          product: result.product
        }
      };
    } catch (error) {
      console.error('Controller error deleting image:', error);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message || 'Failed to delete image',
          details: error.details || null
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 