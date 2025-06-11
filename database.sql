-- Create products table
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    sizes JSONB NOT NULL DEFAULT '[]',
    colors JSONB NOT NULL DEFAULT '[]',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create users table for role management
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- If you need to modify the existing table, use these ALTER statements:
-- First, drop the existing primary key constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;

-- Then, modify the id column
ALTER TABLE users 
    ALTER COLUMN id DROP DEFAULT,
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Finally, add back the primary key constraint
ALTER TABLE users ADD PRIMARY KEY (id);

-- Create an index on the name field for faster searches
CREATE INDEX idx_products_name ON products(name);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update users.updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- Add RLS (Row Level Security) policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access"
    ON products FOR SELECT
    USING (true);

-- Create policy to allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert"
    ON products FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create policy to allow authenticated users to update
CREATE POLICY "Allow authenticated users to update"
    ON products FOR UPDATE
    TO authenticated
    USING (true);

-- Create policy to allow authenticated users to delete
CREATE POLICY "Allow authenticated users to delete"
    ON products FOR DELETE
    TO authenticated
    USING (true);

-- Create policy to allow users to read their own data
CREATE POLICY "Users can read own data"
    ON users FOR SELECT
    USING (auth.jwt() ->> 'email' = email);

-- Create policy to allow admins to read all user data
CREATE POLICY "Admins can read all user data"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE email = auth.jwt() ->> 'email'
            AND role = 'admin'
        )
    );

-- Create policy to allow admins to update user roles
CREATE POLICY "Admins can update user roles"
    ON users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE email = auth.jwt() ->> 'email'
            AND role = 'admin'
        )
    );

-- Create policy to allow trigger function to insert new users
CREATE POLICY "Allow trigger to insert users"
    ON users FOR INSERT
    WITH CHECK (true);

-- Create a function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (email, role)
    VALUES (NEW.email, 
        CASE 
            WHEN NEW.email IN ('admin@gmail.com', 'admin@tshirtstore.com', 'superadmin@tshirtstore.com') THEN 'admin'
            WHEN NEW.email = 'manager@tshirtstore.com' THEN 'manager'
            ELSE 'user'
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically create user records
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Insert admin users (these will be created in auth.users first)
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
    ('admin@gmail.com', crypt('admin123', gen_salt('bf')), NOW(), NOW(), NOW()),
    ('admin@tshirtstore.com', crypt('admin123', gen_salt('bf')), NOW(), NOW(), NOW()),
    ('superadmin@tshirtstore.com', crypt('superadmin123', gen_salt('bf')), NOW(), NOW(), NOW());

-- Insert regular users
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
    ('user1@tshirtstore.com', crypt('user123', gen_salt('bf')), NOW(), NOW(), NOW()),
    ('user2@tshirtstore.com', crypt('user123', gen_salt('bf')), NOW(), NOW(), NOW()),
    ('manager@tshirtstore.com', crypt('manager123', gen_salt('bf')), NOW(), NOW(), NOW());

-- Verify and update admin role if needed
DO $$
BEGIN
    -- Check if admin@gmail.com exists in users table
    IF EXISTS (SELECT 1 FROM users WHERE email = 'admin@gmail.com') THEN
        -- Update role to admin if it's not already
        UPDATE users 
        SET role = 'admin' 
        WHERE email = 'admin@gmail.com' 
        AND role != 'admin';
    ELSE
        -- Insert admin user if it doesn't exist
        INSERT INTO users (email, role)
        VALUES ('admin@gmail.com', 'admin');
    END IF;
END $$;

-- Insert sample products
INSERT INTO products (name, description, price, sizes, colors, image_url)
VALUES 
    ('Classic White T-Shirt', 'A comfortable, classic white t-shirt made from 100% cotton', 19.99, 
    '["S", "M", "L", "XL"]', '["White"]', 'https://example.com/white-tshirt.jpg'),
    
    ('Black Graphic Tee', 'Stylish black t-shirt with modern graphic design', 24.99,
    '["S", "M", "L", "XL", "XXL"]', '["Black"]', 'https://example.com/black-graphic.jpg'),
    
    ('Vintage Blue T-Shirt', 'Vintage-style blue t-shirt with distressed look', 29.99,
    '["M", "L", "XL"]', '["Navy", "Light Blue"]', 'https://example.com/vintage-blue.jpg');

-- Create storage bucket for product images if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'product-images'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('product-images', 'product-images', true);
    END IF;
END $$;

-- Set up storage policies (only if they don't exist)
DO $$
BEGIN
    -- Public read access policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Allow public read access to product images'
    ) THEN
        CREATE POLICY "Allow public read access to product images"
            ON storage.objects FOR SELECT
            USING (bucket_id = 'product-images');
    END IF;

    -- Authenticated users upload policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Allow authenticated users to upload product images'
    ) THEN
        CREATE POLICY "Allow authenticated users to upload product images"
            ON storage.objects FOR INSERT
            TO authenticated
            WITH CHECK (bucket_id = 'product-images');
    END IF;

    -- Authenticated users update policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Allow authenticated users to update product images'
    ) THEN
        CREATE POLICY "Allow authenticated users to update product images"
            ON storage.objects FOR UPDATE
            TO authenticated
            USING (bucket_id = 'product-images');
    END IF;

    -- Authenticated users delete policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Allow authenticated users to delete product images'
    ) THEN
        CREATE POLICY "Allow authenticated users to delete product images"
            ON storage.objects FOR DELETE
            TO authenticated
            USING (bucket_id = 'product-images');
    END IF;
END $$; 