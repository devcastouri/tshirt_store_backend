import { ConfigService } from '@nestjs/config';
export declare class ProductsService {
    private configService;
    private supabase;
    constructor(configService: ConfigService);
    getProducts(): Promise<{
        products: any;
    }>;
    getProductById(id: string): Promise<{
        product: any;
    }>;
    updateProduct(id: string, updateData: any, file?: any): Promise<{
        product: any;
    }>;
    deleteProductImage(id: string, imageUrl: string): Promise<{
        product: any;
    }>;
}
