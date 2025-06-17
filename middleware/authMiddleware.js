const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ValidationError, UnauthorizedError } = require('../utils/errors');

/**
 * Middleware para verificar autenticação
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.access_token;
    
    // Aceitar token do header ou cookie
    const token = authHeader?.split(' ')[1] || cookieToken;

    if (!token) {
      throw new UnauthorizedError('Token de acesso não fornecido');
    }

    try {
      // Verificar token JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

      // Buscar usuário
      const user = await User.findById(decoded.userId);

      if (!user.is_active) {
        throw new UnauthorizedError('Usuário inativo');
      }

      // Adicionar usuário ao request
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurant_id: user.restaurant_id
      };

      // Adicionar o token atual ao request para uso no logout
      req.currentToken = token;

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Token inválido');
      }
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token expirado');
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para verificar autenticação (opcional)
 * Se não estiver autenticado, continua sem erro
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continua sem usuário
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      const user = await User.findById(decoded.userId);

      if (user.is_active) {
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          restaurant_id: user.restaurant_id
        };
      }
    } catch (error) {
      // Ignora erros de token e continua
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Middleware para verificar se o usuário é super admin
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new UnauthorizedError('Usuário não autenticado'));
  }

  if (req.user.role !== 'super_admin') {
    return next(new UnauthorizedError('Acesso negado. Apenas super administradores.'));
  }

  next();
};

/**
 * Middleware para verificar se o usuário tem acesso ao restaurante
 * @param {string} paramName - Nome do parâmetro que contém o ID do restaurante
 */
const requireRestaurantAccess = (paramName = 'restaurant_id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError('Usuário não autenticado'));
      }

      const restaurantId = req.params[paramName];

      if (!restaurantId) {
        return next(new ValidationError('ID do restaurante não fornecido'));
      }

      // Super admin tem acesso a todos os restaurantes
      if (req.user.role === 'super_admin') {
        return next();
      }

      // Restaurant user só tem acesso ao próprio restaurante
      if (req.user.role === 'restaurant_user') {
        if (req.user.restaurant_id !== parseInt(restaurantId)) {
          return next(new UnauthorizedError('Acesso negado a este restaurante'));
        }
        return next();
      }

      // Role não reconhecido
      return next(new UnauthorizedError('Role de usuário não reconhecido'));
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para verificar se o usuário pode gerenciar outros usuários
 */
const requireUserManagement = (req, res, next) => {
  if (!req.user) {
    return next(new UnauthorizedError('Usuário não autenticado'));
  }

  // Apenas super admin pode gerenciar usuários
  if (req.user.role !== 'super_admin') {
    return next(new UnauthorizedError('Acesso negado. Apenas super administradores podem gerenciar usuários.'));
  }

  next();
};

/**
 * Middleware para verificar se o usuário pode acessar seus próprios dados ou é admin
 */
const requireSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new UnauthorizedError('Usuário não autenticado'));
  }

  const targetUserId = parseInt(req.params.id || req.params.user_id);

  // Super admin pode acessar qualquer usuário
  if (req.user.role === 'super_admin') {
    return next();
  }

  // Usuário pode acessar apenas seus próprios dados
  if (req.user.id === targetUserId) {
    return next();
  }

  return next(new UnauthorizedError('Acesso negado. Você só pode acessar seus próprios dados.'));
};

/**
 * Middleware para verificar permissões baseadas em roles
 * @param {...string} allowedRoles - Roles permitidos
 */
const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Usuário não autenticado'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new UnauthorizedError(`Acesso negado. Roles permitidos: ${allowedRoles.join(', ')}`));
    }

    next();
  };
};

/**
 * Middleware para log de atividades
 */
const logActivity = (action, entityType = null) => {
  return async (req, res, next) => {
    // Salvar dados originais do response
    const originalSend = res.send;
    
    res.send = function(data) {
      // Chamar o método original
      const result = originalSend.call(this, data);
      
      // Log apenas se a operação foi bem-sucedida
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        setImmediate(async () => {
          try {
            const entityId = req.params.id || req.params.restaurant_id || req.params.category_id || req.params.product_id;
            
            await User.logActivity({
              user_id: req.user.id,
              restaurant_id: req.user.restaurant_id,
              action: action,
              entity_type: entityType,
              entity_id: entityId ? parseInt(entityId) : null,
              details: {
                method: req.method,
                path: req.path,
                query: req.query,
                body_keys: req.body ? Object.keys(req.body) : []
              },
              ip_address: req.ip,
              user_agent: req.get('User-Agent')
            });
          } catch (error) {
            console.error('Erro ao registrar atividade:', error);
          }
        });
      }
      
      return result;
    };

    next();
  };
};

/**
 * Middleware para definir contexto do usuário no Supabase (para RLS)
 */
const setSupabaseContext = async (req, res, next) => {
  if (req.user) {
    try {
      const { supabase } = require('../config/supabase');
      
      // Definir contexto do usuário para Row Level Security
      await supabase.rpc('set_config', {
        setting_name: 'app.current_user_id',
        setting_value: req.user.id.toString(),
        is_local: true
      });
      
      await supabase.rpc('set_config', {
        setting_name: 'app.current_user_role',
        setting_value: req.user.role,
        is_local: true
      });
      
      if (req.user.restaurant_id) {
        await supabase.rpc('set_config', {
          setting_name: 'app.current_restaurant_id',
          setting_value: req.user.restaurant_id.toString(),
          is_local: true
        });
      }
    } catch (error) {
      console.error('Erro ao definir contexto Supabase:', error);
    }
  }
  
  next();
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  requireSuperAdmin,
  requireRestaurantAccess,
  requireUserManagement,
  requireSelfOrAdmin,
  requireRoles,
  logActivity,
  setSupabaseContext
};