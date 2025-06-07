require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const isDevelopment = process.env.NODE_ENV === 'development';
app.use(cors({
  origin: isDevelopment 
    ? 'http://localhost:3000'  // Development
    : ['https://*.vercel.app', process.env.FRONTEND_URL].filter(Boolean), // Production - allow Vercel domains
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    message: 'T-Shirt Store Backend is running!',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
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
  console.error('Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
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
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`CORS Origin: ${process.env.CORS_ORIGIN}`);
});