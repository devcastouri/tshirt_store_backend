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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
let ProductsService = class ProductsService {
    constructor(configService) {
        this.configService = configService;
        const supabaseUrl = this.configService.get('SUPABASE_URL');
        const supabaseKey = this.configService.get('SUPABASE_SERVICE_KEY');
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase configuration');
        }
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }
    async getProducts() {
        try {
            const { data: products, error } = await this.supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            return { products };
        }
        catch (error) {
            console.error('Error fetching products:', error);
            throw new Error('Failed to fetch products');
        }
    }
    async getProductById(id) {
        try {
            const { data: product, error } = await this.supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();
            if (error)
                throw error;
            if (!product) {
                throw new Error('Product not found');
            }
            return { product };
        }
        catch (error) {
            console.error('Error fetching product:', error);
            throw new Error('Failed to fetch product');
        }
    }
    async updateProduct(id, updateData, file) {
        try {
            console.log('Updating product with ID:', id);
            console.log('Update data:', updateData);
            console.log('File data:', file ? {
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size
            } : 'No file provided');
            const { image, ...productData } = updateData;
            if (file) {
                try {
                    const fileExt = file.originalname.split('.').pop();
                    const fileName = `${id}-${Date.now()}.${fileExt}`;
                    const filePath = `products/${fileName}`;
                    console.log('Attempting to upload file to Supabase storage:', {
                        bucket: 'product-images',
                        path: filePath,
                        contentType: file.mimetype
                    });
                    const { data: buckets, error: bucketsError } = await this.supabase
                        .storage
                        .listBuckets();
                    if (bucketsError) {
                        console.error('Error listing buckets:', bucketsError);
                        throw new Error('Failed to access storage buckets');
                    }
                    console.log('Available buckets:', buckets);
                    const { data: uploadData, error: uploadError } = await this.supabase.storage
                        .from('product-images')
                        .upload(filePath, file.buffer, {
                        contentType: file.mimetype,
                        upsert: true
                    });
                    if (uploadError) {
                        console.error('Error uploading file:', uploadError);
                        throw new Error(`Failed to upload image: ${uploadError.message}`);
                    }
                    console.log('File uploaded successfully:', uploadData);
                    const { data: { publicUrl } } = this.supabase.storage
                        .from('product-images')
                        .getPublicUrl(filePath);
                    console.log('Generated public URL:', publicUrl);
                    productData.image_url = publicUrl;
                }
                catch (uploadError) {
                    console.error('Error in file upload process:', uploadError);
                    throw new Error(`Failed to process image upload: ${uploadError.message}`);
                }
            }
            console.log('Updating product with data:', productData);
            const { data: product, error } = await this.supabase
                .from('products')
                .update(productData)
                .eq('id', id)
                .select()
                .single();
            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }
            if (!product) {
                console.error('No product found after update');
                throw new Error('Product not found');
            }
            console.log('Successfully updated product:', product);
            return { product };
        }
        catch (error) {
            console.error('Error updating product:', error);
            throw new Error(error.message || 'Failed to update product');
        }
    }
    async deleteProductImage(id, imageUrl) {
        try {
            console.log('Deleting image for product:', id);
            console.log('Image URL:', imageUrl);
            const urlParts = imageUrl.split('/');
            const filePath = urlParts.slice(urlParts.indexOf('product-images')).join('/');
            console.log('File path to delete:', filePath);
            const { error: storageError } = await this.supabase.storage
                .from('product-images')
                .remove([filePath]);
            if (storageError) {
                console.error('Error deleting file from storage:', storageError);
                throw new Error('Failed to delete image from storage');
            }
            const { data: product, error: updateError } = await this.supabase
                .from('products')
                .update({ image_url: null })
                .eq('id', id)
                .select()
                .single();
            if (updateError) {
                console.error('Error updating product:', updateError);
                throw new Error('Failed to update product');
            }
            if (!product) {
                throw new Error('Product not found');
            }
            console.log('Successfully deleted image and updated product:', product);
            return { product };
        }
        catch (error) {
            console.error('Error in deleteProductImage:', error);
            throw new Error(error.message || 'Failed to delete product image');
        }
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ProductsService);
//# sourceMappingURL=products.service.js.map