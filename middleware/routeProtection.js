// middleware/routeProtection.js

/**
 * Middleware para proteger rotas que requerem autenticação via browser
 * Diferente do authenticate que é para API, este é para páginas HTML
 */
const jwt = require('jsonwebtoken');

const protectRoute = async (req, res, next) => {
  // Verificar se existe token no cookie, header ou query
  const token = req.headers.authorization?.split(' ')[1] || 
                req.cookies?.access_token ||
                req.query.token; // fallback para token via query

  if (!token) {
    // Se não tem token, redirecionar para login
    return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
  }

  try {
    // Verificar se o token é válido
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    // Verificar se usuário ainda existe e está ativo
    const User = require('../models/User');
    const user = await User.findById(decoded.userId);
    
    if (!user.is_active) {
      // Limpar cookies se usuário inativo
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      res.clearCookie('user_info');
      return res.redirect('/login?error=inactive');
    }
    
    // Token válido e usuário ativo, permitir acesso
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      restaurant_id: user.restaurant_id
    };
    next();
  } catch (error) {
    // Token inválido, limpar cookies e redirecionar
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.clearCookie('user_info');
    
    if (error.name === 'TokenExpiredError') {
      return res.redirect('/login?error=expired');
    }
    
    return res.redirect('/login?error=invalid');
  }
};

/**
 * Middleware para verificar se é super admin (para rotas administrativas)
 */
const requireSuperAdminRoute = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Acesso Negado</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            margin-top: 50px; 
            background: #f5f5f5;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: inline-block;
          }
          .error-code { font-size: 4rem; color: #FF5722; margin-bottom: 20px; }
          h1 { color: #333; margin-bottom: 20px; }
          p { color: #666; margin-bottom: 30px; }
          .btn {
            background: #FF5722;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error-code">403</div>
          <h1>Acesso Negado</h1>
          <p>Você precisa ser um Super Administrador para acessar esta página.</p>
          <a href="/login" class="btn">Fazer Login</a>
        </div>
      </body>
      </html>
    `);
  }
  next();
};

module.exports = {
  protectRoute,
  requireSuperAdminRoute
};