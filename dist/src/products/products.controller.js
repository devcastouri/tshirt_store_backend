"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const products_service_1 = require("./products.service");
const multer_1 = require("multer");
let ProductsController = class ProductsController {
    constructor(productsService) {
        this.productsService = productsService;
    }
    async getProducts() {
        try {
            const result = await this.productsService.getProducts();
            return {
                data: {
                    products: result.products
                }
            };
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to fetch products', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getProductById(id) {
        try {
            const result = await this.productsService.getProductById(id);
            return {
                data: {
                    product: result.product
                }
            };
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Failed to fetch product', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateProduct(id, updateData, file) {
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
            }
            else {
                console.log('No file received in request');
            }
            const parsedData = { ...updateData };
            if (typeof parsedData.sizes === 'string') {
                try {
                    parsedData.sizes = JSON.parse(parsedData.sizes);
                }
                catch (e) {
                    console.error('Error parsing sizes:', e);
                    parsedData.sizes = [];
                }
            }
            if (typeof parsedData.colors === 'string') {
                try {
                    parsedData.colors = JSON.parse(parsedData.colors);
                }
                catch (e) {
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
        }
        catch (error) {
            console.error('Controller error updating product:', error);
            throw new common_1.HttpException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                error: error.message || 'Failed to update product',
                details: error.details || null
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async deleteProductImage(id, body) {
        try {
            console.log('Deleting image for product:', id);
            console.log('Image URL:', body.imageUrl);
            const result = await this.productsService.deleteProductImage(id, body.imageUrl);
            return {
                data: {
                    product: result.product
                }
            };
        }
        catch (error) {
            console.error('Controller error deleting image:', error);
            throw new common_1.HttpException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                error: error.message || 'Failed to delete image',
                details: error.details || null
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.ProductsController = ProductsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "getProducts", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "getProductById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', {
        storage: (0, multer_1.memoryStorage)(),
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "updateProduct", null);
__decorate([
    (0, common_1.Delete)(':id/images'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "deleteProductImage", null);
exports.ProductsController = ProductsController = __decorate([
    (0, common_1.Controller)('products'),
    __metadata("design:paramtypes", [products_service_1.ProductsService])
], ProductsController);
//# sourceMappingURL=products.controller.js.map