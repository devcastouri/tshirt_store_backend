import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class ProductsService {
  private supabase;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
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

      if (error) throw error;

      return { products };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }
  }

  async getProductById(id: string) {
    try {
      const { data: product, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!product) {
        throw new Error('Product not found');
      }

      return { product };
    } catch (error) {
      console.error('Error fetching product:', error);
      throw new Error('Failed to fetch product');
    }
  }

  async updateProduct(id: string, updateData: any, file?: any) {
    try {
      console.log('Updating product with ID:', id);
      console.log('Update data:', updateData);
      console.log('File data:', file ? {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      } : 'No file provided');

      // Remove any image field from updateData as we only use image_url
      const { image, ...productData } = updateData;

      // Handle file upload if a new file is provided
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

          // First, check if the bucket exists
          const { data: buckets, error: bucketsError } = await this.supabase
            .storage
            .listBuckets();

          if (bucketsError) {
            console.error('Error listing buckets:', bucketsError);
            throw new Error('Failed to access storage buckets');
          }

          console.log('Available buckets:', buckets);

          // Upload the file
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

          // Get the public URL for the uploaded file
          const { data: { publicUrl } } = this.supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

          console.log('Generated public URL:', publicUrl);

          // Add the image_url to the update data
          productData.image_url = publicUrl;
        } catch (uploadError) {
          console.error('Error in file upload process:', uploadError);
          throw new Error(`Failed to process image upload: ${uploadError.message}`);
        }
      }

      console.log('Updating product with data:', productData);

      // Update the product with the new data
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
    } catch (error) {
      console.error('Error updating product:', error);
      throw new Error(error.message || 'Failed to update product');
    }
  }

  async deleteProductImage(id: string, imageUrl: string) {
    try {
      console.log('Deleting image for product:', id);
      console.log('Image URL:', imageUrl);

      // Extract the file path from the URL
      const urlParts = imageUrl.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('product-images')).join('/');
      
      console.log('File path to delete:', filePath);

      // Delete the file from storage
      const { error: storageError } = await this.supabase.storage
        .from('product-images')
        .remove([filePath]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        throw new Error('Failed to delete image from storage');
      }

      // Update the product to remove the image_url
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
    } catch (error) {
      console.error('Error in deleteProductImage:', error);
      throw new Error(error.message || 'Failed to delete product image');
    }
  }
} 