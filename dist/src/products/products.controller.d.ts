import { ProductsService } from './products.service';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    getProducts(): Promise<{
        data: {
            products: any;
        };
    }>;
    getProductById(id: string): Promise<{
        data: {
            product: any;
        };
    }>;
    updateProduct(id: string, updateData: any, file?: Express.Multer.File): Promise<{
        data: {
            product: any;
        };
    }>;
    deleteProductImage(id: string, body: {
        imageUrl: string;
    }): Promise<{
        data: {
            product: any;
        };
    }>;
}
