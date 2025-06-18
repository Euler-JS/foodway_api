require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Importar middlewares customizados
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { authenticate, optionalAuthenticate, setSupabaseContext } = require('./middleware/authMiddleware');

const cookieParser = require('cookie-parser'); // npm install cookie-parser
const { protectRoute, requireAdminAccess } = require('./middleware/routeProtection');

const qrCodeRoutes = require('./routes/qrCode');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de segurança
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
      connectSrc: ["'self'", "https://unpkg.com"],
    },
  })
);

// Rate limiting - mais restritivo para autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 25, // máximo 5 tentativas de login por IP
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  skip: (req) => {
    // Aplicar apenas para rotas de autenticação
    return !req.path.startsWith('/api/v1/auth/login') && 
           !req.path.startsWith('/api/v1/auth/forgot-password');
  }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // máximo 100 requests por IP por janela de tempo
  message: {
    error: 'Muitas tentativas. Tente novamente em 15 minutos.'
  }
});

app.use(authLimiter);
app.use(generalLimiter);

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares gerais
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de contexto do Supabase (aplicado globalmente para usuários autenticados)
app.use(optionalAuthenticate);
app.use(setSupabaseContext);

app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.API_VERSION || 'v1'
  });
});



// Rota específica para login de administrador
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// Rota para página inicial
app.get('/start', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'start.html'));
});

// Rota para login geral
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', protectRoute, requireAdminAccess, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(204).end();
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Restaurant Menu API with User Management',
    version: process.env.API_VERSION || 'v1',
    documentation: '/api/docs',
    health: '/health',
    admin: '/admin',
    login: '/login',
    start: '/start',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      restaurants: '/api/v1/restaurants',
      categories: '/api/v1/categories',
      products: '/api/v1/products',
      menu: '/api/v1/menu'
    }
  });
});

// Importar e usar rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const restaurantUserRoutes = require('./routes/restaurantUsers');
const restaurantRoutes = require('./routes/restaurants');
const categoryRoutes = require('./routes/categories');
const restaurantCategoryRoutes = require('./routes/restaurantCategories');
const productRoutes = require('./routes/products');
const categoryProductRoutes = require('./routes/categoryProducts');
const restaurantProductRoutes = require('./routes/restaurantProducts');
const menuRoutes = require('./routes/menu');
const tableRoutes = require('./routes/tables');
const restaurantTableRoutes = require('./routes/restaurantTables');


// Rotas de autenticação e usuários (novas)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/restaurants/:restaurant_id/users', restaurantUserRoutes);

// Rotas existentes (agora com proteção de autenticação onde necessário)
app.use('/api/v1/restaurants', restaurantRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/restaurants/:restaurant_id/categories', restaurantCategoryRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories/:category_id/products', categoryProductRoutes);
app.use('/api/v1/restaurants/:restaurant_id/products', restaurantProductRoutes);

// Rotas de mesas
app.use('/api/v1/tables', tableRoutes);
app.use('/api/v1/restaurants/:restaurant_id/tables', restaurantTableRoutes);

app.use('/api/v1/qr', qrCodeRoutes);

// Rota de menu (pública para visualização)
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
  console.log(`👤 Admin: http://localhost:${PORT}/admin`);
  console.log(`🔑 Login: http://localhost:${PORT}/login`);
  console.log(`🏠 Home: http://localhost:${PORT}/start`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n📋 Endpoints disponíveis:`);
    console.log(`   Auth: http://localhost:${PORT}/api/v1/auth`);
    console.log(`   Users: http://localhost:${PORT}/api/v1/users`);
    console.log(`   Restaurants: http://localhost:${PORT}/api/v1/restaurants`);
    console.log(`   Categories: http://localhost:${PORT}/api/v1/categories`);
    console.log(`   Products: http://localhost:${PORT}/api/v1/products`);
    console.log(`   Menu: http://localhost:${PORT}/api/v1/menu`);
  }
});

module.exports = app;