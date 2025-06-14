require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Importar middlewares customizados
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de segurança
// app.use(helmet());

app.use(
 helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://unpkg.com"
      ],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://unpkg.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https://unpkg.com"], // 🚨 esta linha é essencial
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP por janela de tempo
  message: {
    error: 'Muitas tentativas. Tente novamente em 15 minutos.'
  }
});
app.use(limiter);

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares gerais
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Rota específica para o dashboard admin
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Rota específica para o inicio da pagina
app.get('/start', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'start.html'));
});

// Rota para acessar o dashboard diretamente
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});


// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Restaurant Menu API',
    version: process.env.API_VERSION || 'v1',
    documentation: '/api/docs',
    health: '/health',
    dashboard: '/dashboard',
    admin: '/admin',
    start: '/start'
  });
});



// Importar e usar rotas
const restaurantRoutes = require('./routes/restaurants');
const categoryRoutes = require('./routes/categories');
const restaurantCategoryRoutes = require('./routes/restaurantCategories');
const productRoutes = require('./routes/products');
const categoryProductRoutes = require('./routes/categoryProducts');
const restaurantProductRoutes = require('./routes/restaurantProducts');
const menuRoutes = require('./routes/menu');
const { start } = require('repl');

app.use('/api/v1/restaurants', restaurantRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/restaurants/:restaurant_id/categories', restaurantCategoryRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories/:category_id/products', categoryProductRoutes);
app.use('/api/v1/restaurants/:restaurant_id/products', restaurantProductRoutes);
app.use('/api/v1/menu', menuRoutes);

// Middleware para rotas não encontradas
app.use('*', notFoundHandler);

// Middleware global de tratamento de erros
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;