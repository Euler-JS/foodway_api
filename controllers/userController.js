const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const ApiResponse = require('../utils/response');
const { AppError, ValidationError } = require('../utils/errors');

class UserController {
  /**
   * Listar todos os usuários
   * GET /api/v1/users
   */
  async index(req, res, next) {
    try {
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        role: req.query.role,
        restaurantId: req.query.restaurant_id,
        isActive: req.query.is_active,
        search: req.query.search,
        sortBy: req.query.sort_by,
        sortOrder: req.query.sort_order
      };

      const result = await User.findAll(options);

      return ApiResponse.success(res, result, 'Usuários listados com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar usuário por ID
   * GET /api/v1/users/:id
   */
  async show(req, res, next) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);

      return ApiResponse.success(res, user, 'Usuário encontrado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Criar novo usuário
   * POST /api/v1/users
   */
  async store(req, res, next) {
    try {
      const userData = req.body;
      const createdBy = req.user?.id; // Vem do middleware de autenticação

      // Verificar se quem está criando tem permissão
      if (!req.user || req.user.role !== 'super_admin') {
        throw new ValidationError('Apenas super administradores podem criar usuários');
      }

      // Se está criando um restaurant_user, verificar se o restaurante existe
      if (userData.role === 'restaurant_user' && userData.restaurant_id) {
        await Restaurant.findById(userData.restaurant_id);
      }

      const user = await User.create(userData, createdBy);

      return ApiResponse.success(
        res, 
        user, 
        'Usuário criado com sucesso', 
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar usuário
   * PUT /api/v1/users/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = req.user?.id;

      // Verificar permissões
      if (!req.user) {
        throw new ValidationError('Usuário não autenticado');
      }

      // Super admin pode atualizar qualquer usuário
      // Restaurant user só pode atualizar a si mesmo
      if (req.user.role !== 'super_admin' && req.user.id !== parseInt(id)) {
        throw new ValidationError('Sem permissão para atualizar este usuário');
      }

      // Se está mudando o restaurante, verificar se existe
      if (updateData.restaurant_id) {
        await Restaurant.findById(updateData.restaurant_id);
      }

      // Restaurant user não pode mudar o próprio role ou restaurante
      if (req.user.role === 'restaurant_user' && req.user.id === parseInt(id)) {
        delete updateData.role;
        delete updateData.restaurant_id;
        delete updateData.is_active;
      }

      const user = await User.update(id, updateData, updatedBy);

      return ApiResponse.success(res, user, 'Usuário atualizado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Inativar usuário
   * DELETE /api/v1/users/:id
   */
  async destroy(req, res, next) {
    try {
      const { id } = req.params;
      const deletedBy = req.user?.id;

      // Apenas super admin pode inativar usuários
      if (!req.user || req.user.role !== 'super_admin') {
        throw new ValidationError('Apenas super administradores podem inativar usuários');
      }

      const user = await User.delete(id, deletedBy);

      return ApiResponse.success(res, user, 'Usuário inativado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reativar usuário
   * PATCH /api/v1/users/:id/reactivate
   */
  async reactivate(req, res, next) {
    try {
      const { id } = req.params;
      const reactivatedBy = req.user?.id;

      // Apenas super admin pode reativar usuários
      if (!req.user || req.user.role !== 'super_admin') {
        throw new ValidationError('Apenas super administradores podem reativar usuários');
      }

      const user = await User.reactivate(id, reactivatedBy);

      return ApiResponse.success(res, user, 'Usuário reativado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Listar usuários por restaurante
   * GET /api/v1/restaurants/:restaurant_id/users
   */
  async indexByRestaurant(req, res, next) {
    try {
      const { restaurant_id } = req.params;

      // Verificar se o restaurante existe
      await Restaurant.findById(restaurant_id);

      // Verificar permissões
      if (!req.user) {
        throw new ValidationError('Usuário não autenticado');
      }

      // Super admin pode ver usuários de qualquer restaurante
      // Restaurant user só pode ver usuários do próprio restaurante
      if (req.user.role === 'restaurant_user' && req.user.restaurant_id !== parseInt(restaurant_id)) {
        throw new ValidationError('Sem permissão para ver usuários deste restaurante');
      }

      const users = await User.findByRestaurant(restaurant_id);

      return ApiResponse.success(
        res, 
        users, 
        'Usuários do restaurante listados com sucesso'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Criar usuário para um restaurante específico
   * POST /api/v1/restaurants/:restaurant_id/users
   */
  async storeForRestaurant(req, res, next) {
    try {
      const { restaurant_id } = req.params;
      const userData = { ...req.body, restaurant_id: parseInt(restaurant_id), role: 'restaurant_user' };
      const createdBy = req.user?.id;

      // Verificar se quem está criando tem permissão
      if (!req.user || req.user.role !== 'super_admin') {
        throw new ValidationError('Apenas super administradores podem criar usuários');
      }

      // Verificar se o restaurante existe
      await Restaurant.findById(restaurant_id);

      const user = await User.create(userData, createdBy);

      return ApiResponse.success(
        res, 
        user, 
        'Usuário criado com sucesso para o restaurante', 
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter estatísticas dos usuários
   * GET /api/v1/users/stats
   */
  async stats(req, res, next) {
    try {
      // Apenas super admin pode ver estatísticas gerais
      if (!req.user || req.user.role !== 'super_admin') {
        throw new ValidationError('Apenas super administradores podem ver estatísticas');
      }

      const stats = await User.getStats();

      return ApiResponse.success(res, stats, 'Estatísticas obtidas com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar usuários
   * GET /api/v1/users/search
   */
  async search(req, res, next) {
    try {
      const { q } = req.query;
      
      if (!q || q.trim().length === 0) {
        throw new AppError('Parâmetro de busca é obrigatório', 400);
      }

      // Restaurant users só podem buscar no próprio restaurante
      let restaurantId = null;
      if (req.user?.role === 'restaurant_user') {
        restaurantId = req.user.restaurant_id;
      }

      const options = {
        page: req.query.page || 1,
        limit: req.query.limit || 10,
        search: q.trim(),
        restaurantId: restaurantId,
        isActive: req.query.is_active !== undefined ? req.query.is_active : true
      };

      const result = await User.findAll(options);

      return ApiResponse.success(
        res, 
        result, 
        `Usuários encontrados para "${q}"`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verificar se usuário existe
   * HEAD /api/v1/users/:id
   */
  async exists(req, res, next) {
    try {
      const { id } = req.params;
      await User.findById(id);

      return res.status(200).end();
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).end();
      }
      next(error);
    }
  }

  /**
   * Obter perfil do usuário logado
   * GET /api/v1/users/me
   */
  async me(req, res, next) {
    try {
      if (!req.user) {
        throw new ValidationError('Usuário não autenticado');
      }

      const user = await User.findById(req.user.id);

      return ApiResponse.success(res, user, 'Perfil obtido com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar perfil do usuário logado
   * PUT /api/v1/users/me
   */
  async updateMe(req, res, next) {
    try {
      if (!req.user) {
        throw new ValidationError('Usuário não autenticado');
      }

      const updateData = req.body;
      
      // Remover campos que o usuário não pode alterar sobre si mesmo
      delete updateData.role;
      delete updateData.restaurant_id;
      delete updateData.is_active;
      delete updateData.email_verified;

      const user = await User.update(req.user.id, updateData, req.user.id);

      return ApiResponse.success(res, user, 'Perfil atualizado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Alterar senha do usuário logado
   * POST /api/v1/users/change-password
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
      const bcrypt = require('bcrypt');
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
   * Listar atividades do usuário
   * GET /api/v1/users/:id/activities
   */
  async activities(req, res, next) {
    try {
      const { id } = req.params;

      // Verificar permissões
      if (!req.user) {
        throw new ValidationError('Usuário não autenticado');
      }

      // Super admin pode ver atividades de qualquer usuário
      // Restaurant user só pode ver as próprias atividades
      if (req.user.role !== 'super_admin' && req.user.id !== parseInt(id)) {
        throw new ValidationError('Sem permissão para ver atividades deste usuário');
      }

      const { supabase } = require('../config/supabase');
      
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      return ApiResponse.success(res, data || [], 'Atividades listadas com sucesso');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();