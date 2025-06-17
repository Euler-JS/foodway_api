const User = require('../models/User');
const ApiResponse = require('../utils/response');
const { ValidationError } = require('../utils/errors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class AuthController {
        constructor() {
    // Fazer bind de todos os métodos
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.me = this.me.bind(this);
    this.generateTokens = this.generateTokens.bind(this);
  }
  /**
   * Login do usuário
   * POST /api/v1/auth/login
   */
  async login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError('Email e senha são obrigatórios');
    }
    
    // Autenticar usuário
    const user = await User.authenticate(email, password);

    // Gerar tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    // Salvar refresh token no banco
    await this.saveRefreshToken(user.id, refreshToken, req);

    // Configurar cookies para navegador (apenas para rotas web)
    const isWebRequest = req.headers.accept?.includes('text/html') || 
                        req.headers['user-agent']?.includes('Mozilla');
    
    if (isWebRequest) {
      // Definir cookies seguros
      res.cookie('access_token', accessToken, {
        httpOnly: true, // Protege contra XSS
        secure: process.env.NODE_ENV === 'production', // HTTPS apenas em produção
        sameSite: 'strict', // Protege contra CSRF
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
      });

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
      });

      res.cookie('user_info', JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }), {
        httpOnly: false, // Permite acesso via JavaScript
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
      });
    }

    return ApiResponse.success(res, {
      user,
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: 24 * 60 * 60 // 24 horas em segundos
      }
    }, 'Login realizado com sucesso');
  } catch (error) {
    next(error);
  }
}

/**
 * Logout do usuário
 * POST /api/v1/auth/logout
 */
async logout(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.access_token;
    
    const token = authHeader?.split(' ')[1] || cookieToken || req.currentToken;
    
    if (!token) {
      // Se não há token, considerar como logout bem-sucedido
      // (usuário já estava deslogado)
      if (req.cookies?.access_token) {
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        res.clearCookie('user_info');
      }
      
      return ApiResponse.success(res, null, 'Logout realizado com sucesso');
    }

    try {
      // Tentar revogar o token específico
      await this.revokeToken(token);
    } catch (error) {
      // Se falhar ao revogar (token inválido, etc.), continuar com logout
      console.warn('Erro ao revogar token durante logout:', error.message);
    }

    // Limpar cookies se existirem
    if (req.cookies?.access_token || req.cookies?.refresh_token || req.cookies?.user_info) {
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      res.clearCookie('user_info');
    }

    return ApiResponse.success(res, null, 'Logout realizado com sucesso');
  } catch (error) {
    // Em caso de erro, ainda assim limpar cookies e considerar logout bem-sucedido
    console.error('Erro durante logout:', error);
    
    if (req.cookies?.access_token || req.cookies?.refresh_token || req.cookies?.user_info) {
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      res.clearCookie('user_info');
    }
    
    return ApiResponse.success(res, null, 'Logout realizado com sucesso');
  }
}

  /**
   * Logout de todos os dispositivos
   * POST /api/v1/auth/logout-all
   */
  async logoutAll(req, res, next) {
    try {
      if (!req.user) {
        throw new ValidationError('Usuário não autenticado');
      }

      // Revogar todos os tokens do usuário
      await User.revokeAllTokens(req.user.id);

      return ApiResponse.success(res, null, 'Logout realizado em todos os dispositivos');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh token
   * POST /api/v1/auth/refresh
   */
  async refresh(req, res, next) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        throw new ValidationError('Refresh token é obrigatório');
      }

      // Verificar e decodificar refresh token
      const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET || 'refresh_secret');

      // Buscar token no banco de dados
      const { supabase } = require('../config/supabase');
      const { data: tokenData, error } = await supabase
        .from('auth_tokens')
        .select('*')
        .eq('token_hash', this.hashToken(refresh_token))
        .eq('token_type', 'refresh')
        .eq('is_revoked', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !tokenData) {
        throw new ValidationError('Refresh token inválido ou expirado');
      }

      // Buscar usuário
      const user = await User.findById(decoded.userId);

      if (!user.is_active) {
        throw new ValidationError('Usuário inativo');
      }

      // Gerar novos tokens
      const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(user);

      // Revogar o refresh token antigo
      await supabase
        .from('auth_tokens')
        .update({ is_revoked: true })
        .eq('id', tokenData.id);

      // Salvar novo refresh token
      await this.saveRefreshToken(user.id, newRefreshToken, req);

      return ApiResponse.success(res, {
        tokens: {
          access_token: accessToken,
          refresh_token: newRefreshToken,
          token_type: 'Bearer',
          expires_in: 24 * 60 * 60
        }
      }, 'Tokens atualizados com sucesso');
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return next(new ValidationError('Refresh token inválido ou expirado'));
      }
      next(error);
    }
  }

  /**
   * Verificar token e obter usuário
   * GET /api/v1/auth/me
   */
  async me(req, res, next) {
    try {
      if (!req.user) {
        throw new ValidationError('Token inválido ou expirado');
      }

      const user = await User.findById(req.user.id);

      return ApiResponse.success(res, user, 'Usuário autenticado');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Solicitar reset de senha
   * POST /api/v1/auth/forgot-password
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        throw new ValidationError('Email é obrigatório');
      }

      try {
        const user = await User.findByEmail(email);

        if (!user.is_active) {
          throw new ValidationError('Usuário inativo');
        }

        // Gerar token de reset
        const resetToken = this.generateResetToken();
        const expires_at = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

        // Salvar token no banco
        const { supabase } = require('../config/supabase');
        await supabase
          .from('auth_tokens')
          .insert([{
            user_id: user.id,
            token_hash: this.hashToken(resetToken),
            token_type: 'reset_password',
            expires_at: expires_at.toISOString()
          }]);

        // TODO: Enviar email com o token
        // Por enquanto, retornar o token na resposta (apenas para desenvolvimento)
        const responseData = process.env.NODE_ENV === 'development' 
          ? { reset_token: resetToken }
          : null;

        return ApiResponse.success(
          res, 
          responseData, 
          'Se o email existir, você receberá instruções para redefinir sua senha'
        );
      } catch (error) {
        // Não revelar se o email existe ou não
        return ApiResponse.success(
          res, 
          null, 
          'Se o email existir, você receberá instruções para redefinir sua senha'
        );
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Alterar senha do usuário logado
   * POST /api/v1/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      if (!req.user) {
        throw new ValidationError('Usuário não autenticado');
      }

      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        throw new ValidationError('Senha atual e nova senha são obrigatórias');
      }

      if (new_password.length < 6) {
        throw new ValidationError('Nova senha deve ter pelo menos 6 caracteres');
      }

      // Verificar senha atual
      const userWithPassword = await User.findByEmail(req.user.email);
      const isCurrentPasswordValid = await bcrypt.compare(current_password, userWithPassword.password_hash);
      
      if (!isCurrentPasswordValid) {
        throw new ValidationError('Senha atual incorreta');
      }

      // Atualizar senha
      await User.update(req.user.id, { password: new_password }, req.user.id);

      // Revogar todos os tokens (forçar novo login)
      await User.revokeAllTokens(req.user.id);

      return ApiResponse.success(res, null, 'Senha alterada com sucesso. Faça login novamente.');
    } catch (error) {
      next(error);
    }
  }


  /**
   * Reset de senha
   * POST /api/v1/auth/reset-password
   */
  async resetPassword(req, res, next) {
    try {
      const { token, new_password } = req.body;

      if (!token || !new_password) {
        throw new ValidationError('Token e nova senha são obrigatórios');
      }

      if (new_password.length < 6) {
        throw new ValidationError('Nova senha deve ter pelo menos 6 caracteres');
      }

      // Buscar token no banco
      const { supabase } = require('../config/supabase');
      const { data: tokenData, error } = await supabase
        .from('auth_tokens')
        .select('*')
        .eq('token_hash', this.hashToken(token))
        .eq('token_type', 'reset_password')
        .eq('is_revoked', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !tokenData) {
        throw new ValidationError('Token de reset inválido ou expirado');
      }

      // Atualizar senha do usuário
      await User.update(tokenData.user_id, { password: new_password });

      // Revogar o token de reset
      await supabase
        .from('auth_tokens')
        .update({ is_revoked: true })
        .eq('id', tokenData.id);

      // Revogar todos os tokens de acesso (forçar novo login)
      await User.revokeAllTokens(tokenData.user_id);

      return ApiResponse.success(res, null, 'Senha redefinida com sucesso. Faça login novamente.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verificar status da sessão
   * GET /api/v1/auth/status
   */
  async status(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return ApiResponse.success(res, { authenticated: false }, 'Não autenticado');
      }

      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const user = await User.findById(decoded.userId);
        
        return ApiResponse.success(res, { 
          authenticated: true, 
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        }, 'Autenticado');
      } catch (error) {
        return ApiResponse.success(res, { authenticated: false }, 'Token inválido');
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Gerar tokens de acesso e refresh
   * @param {Object} user - Dados do usuário
   * @returns {Object} - Tokens gerados
   */
  async generateTokens(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurant_id
    };

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Salvar refresh token no banco
   * @param {number} userId - ID do usuário
   * @param {string} refreshToken - Refresh token
   * @param {Object} req - Request object
   */
  async saveRefreshToken(userId, refreshToken, req) {
    const { supabase } = require('../config/supabase');
    
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    await supabase
      .from('auth_tokens')
      .insert([{
        user_id: userId,
        token_hash: this.hashToken(refreshToken),
        token_type: 'refresh',
        expires_at: expires_at.toISOString(),
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      }]);
  }

/**
 * Revogar token específico - MÉTODO ATUALIZADO
 * @param {string} token - Token a ser revogado
 */
async revokeToken(token) {
  try {
    const { supabase } = require('../config/supabase');
    
    // Verificar se o token existe antes de tentar revogar
    const tokenHash = this.hashToken(token);
    
    const { data: existingToken, error: findError } = await supabase
      .from('auth_tokens')
      .select('id')
      .eq('token_hash', tokenHash)
      .eq('is_revoked', false)
      .single();
    
    if (findError && findError.code !== 'PGRST116') {
      // PGRST116 = "JSON object requested, multiple (or no) rows returned"
      throw findError;
    }
    
    if (existingToken) {
      const { error: updateError } = await supabase
        .from('auth_tokens')
        .update({ 
          is_revoked: true,
          revoked_at: new Date().toISOString()
        })
        .eq('token_hash', tokenHash);
      
      if (updateError) {
        throw updateError;
      }
    }
    // Se o token não existe, não é um erro - pode já ter sido revogado
    
  } catch (error) {
    console.error('Erro ao revogar token:', error);
    // Não lançar erro - logout deve continuar mesmo se revogar falhar
  }
}

  /**
   * Gerar token de reset de senha
   * @returns {string} - Token gerado
   */
  generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Gerar hash do token
   * @param {string} token - Token para fazer hash
   * @returns {string} - Hash do token
   */
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

module.exports = new AuthController();