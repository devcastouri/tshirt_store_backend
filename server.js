const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// CORS configuration
const corsOrigins = configService.get<string>('CORS_ORIGIN')?.split(',') || ['http://localhost:3000'];

app.enableCors({
  origin: corsOrigins,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Make Supabase client available to routes
app.locals.supabase = supabase;

// Routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Products routes
const products = [
  {
    id: 1,
    name: 'Classic Cotton T-Shirt',
    price: 19.99,
    description: 'Comfortable cotton t-shirt',
    image: '/images/tshirt1.jpg',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['White', 'Black', 'Navy']
  },
  {
    id: 2,
    name: 'Premium Graphic Tee',
    price: 24.99,
    description: 'High-quality graphic t-shirt',
    image: '/images/tshirt2.jpg',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['White', 'Black', 'Red']
  }
];

// Get all products
app.get('/api/products', (req, res) => {
  console.log('Products requested');
  const responseData = { products };
  console.log('Sending products data:', JSON.stringify(responseData, null, 2));
  res.json(responseData);
});

// Get single product by ID
app.get('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  
  res.json({ product });
});

// Orders routes
app.post('/api/orders', (req, res) => {
  try {
    const { items, customerInfo } = req.body;
    
    if (!items || !customerInfo) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['items', 'customerInfo']
      });
    }
    
    // Process order logic here
    res.json({
      success: true,
      orderId: Date.now(),
      message: 'Order placed successfully',
      items,
      customerInfo
    });
  } catch (error) {
    console.error('Order processing error:', error);
    res.status(500).json({ 
      message: 'Error processing order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler - must be after all other routes
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});