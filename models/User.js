const { supabase } = require('../config/supabase');
const { handleSupabaseError, NotFoundError, ConflictError, ValidationError } = require('../utils/errors');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class User {
  constructor() {
    this.table = 'users';
    this.tokenTable = 'auth_tokens';
    this.activityTable = 'activity_logs';
  }

  /**
   * Buscar todos os usuários com filtros
   * @param {Object} options - Opções de filtro e paginação
   * @returns {Promise<Object>} - Lista paginada de usuários
   */
  async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        role = null,
        restaurantId = null,
        isActive = null,
        search = null,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = options;

      let query = supabase
        .from('users_with_restaurant')
        .select(`
          id, uuid, name, email, role, is_active, email_verified,
          last_login, created_at, updated_at,
          restaurant_id, restaurant_name, restaurant_city,
          created_by_name
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      // Filtros
      if (role) {
        query = query.eq('role', role);
      }

      if (restaurantId) {
        query = query.eq('restaurant_id', restaurantId);
      }

      if (isActive !== null) {
        query = query.eq('is_active', isActive);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      // Paginação
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        throw handleSupabaseError(error);
      }

      return {
        data: data || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || data?.length || 0,
          totalPages: Math.ceil((count || data?.length || 0) / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar usuário por ID
   * @param {number} id - ID do usuário
   * @returns {Promise<Object>} - Dados do usuário
   */
  async findById(id) {
    try {
      const { data, error } = await supabase
        .from('users_with_restaurant')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError('Usuário não encontrado');
        }
        throw handleSupabaseError(error);
      }

      // Remover senha do retorno
      const { password_hash, ...userWithoutPassword } = data;
      return userWithoutPassword;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar usuário por email
   * @param {string} email - Email do usuário
   * @returns {Promise<Object>} - Dados do usuário
   */
  async findByEmail(email) {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError('Usuário não encontrado');
        }
        throw handleSupabaseError(error);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Criar novo usuário
   * @param {Object} userData - Dados do usuário
   * @param {number} createdBy - ID do usuário que está criando
   * @returns {Promise<Object>} - Usuário criado
   */
  async create(userData, createdBy = null) {
    try {
      // Verificar se email já existe
      try {
        await this.findByEmail(userData.email);
        throw new ConflictError('Email já está em uso');
      } catch (error) {
        if (!(error instanceof NotFoundError)) {
          throw error;
        }
      }

      // Validar role e restaurant_id
      if (userData.role === 'super_admin' && userData.restaurant_id) {
        throw new ValidationError('Super admin não pode ter restaurante associado');
      }

      if (userData.role === 'restaurant_user' && !userData.restaurant_id) {
        throw new ValidationError('Usuário de restaurante deve ter restaurante associado');
      }

      // Hash da senha
      const password_hash = await bcrypt.hash(userData.password, 10);

      const newUser = {
        ...userData,
        email: userData.email.toLowerCase(),
        password_hash,
        created_by: createdBy
      };

      // Remover senha em texto plano
      delete newUser.password;

      const { data, error } = await supabase
        .from(this.table)
        .insert([newUser])
        .select(`
          id, uuid, name, email, role, restaurant_id, 
          is_active, email_verified, created_at, updated_at
        `)
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      // Log da atividade
      await this.logActivity({
        user_id: createdBy,
        action: 'create_user',
        entity_type: 'user',
        entity_id: data.id,
        details: { 
          created_user_email: data.email,
          created_user_role: data.role 
        }
      });

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualizar usuário
   * @param {number} id - ID do usuário
   * @param {Object} updateData - Dados para atualização
   * @param {number} updatedBy - ID do usuário que está atualizando
   * @returns {Promise<Object>} - Usuário atualizado
   */
  async update(id, updateData, updatedBy = null) {
    try {
      // Verificar se o usuário existe
      await this.findById(id);

      // Se está atualizando senha, fazer hash
      if (updateData.password) {
        updateData.password_hash = await bcrypt.hash(updateData.password, 10);
        delete updateData.password;
      }

      // Se está mudando email, verificar se já existe
      if (updateData.email) {
        updateData.email = updateData.email.toLowerCase();
        try {
          const existingUser = await this.findByEmail(updateData.email);
          if (existingUser.id !== id) {
            throw new ConflictError('Email já está em uso');
          }
        } catch (error) {
          if (!(error instanceof NotFoundError)) {
            throw error;
          }
        }
      }

      const { data, error } = await supabase
        .from(this.table)
        .update(updateData)
        .eq('id', id)
        .select(`
          id, uuid, name, email, role, restaurant_id, 
          is_active, email_verified, created_at, updated_at
        `)
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      // Log da atividade
      await this.logActivity({
        user_id: updatedBy,
        action: 'update_user',
        entity_type: 'user',
        entity_id: id,
        details: { updated_fields: Object.keys(updateData) }
      });

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Inativar usuário
   * @param {number} id - ID do usuário
   * @param {number} deletedBy - ID do usuário que está inativando
   * @returns {Promise<Object>} - Usuário inativado
   */
  async delete(id, deletedBy = null) {
    try {
      // Verificar se o usuário existe
      const user = await this.findById(id);

      // Não permitir inativar o próprio usuário
      if (id === deletedBy) {
        throw new ValidationError('Não é possível inativar o próprio usuário');
      }

      // Não permitir inativar o último super admin
      if (user.role === 'super_admin') {
        const { data: superAdmins } = await supabase
          .from(this.table)
          .select('id')
          .eq('role', 'super_admin')
          .eq('is_active', true);

        if (superAdmins.length === 1) {
          throw new ValidationError('Não é possível inativar o último super administrador');
        }
      }

      const { data, error } = await supabase
        .from(this.table)
        .update({ is_active: false })
        .eq('id', id)
        .select(`
          id, uuid, name, email, role, restaurant_id, 
          is_active, email_verified, created_at, updated_at
        `)
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      // Revogar todos os tokens do usuário
      await this.revokeAllTokens(id);

      // Log da atividade
      await this.logActivity({
        user_id: deletedBy,
        action: 'deactivate_user',
        entity_type: 'user',
        entity_id: id,
        details: { deactivated_user_email: user.email }
      });

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reativar usuário
   * @param {number} id - ID do usuário
   * @param {number} reactivatedBy - ID do usuário que está reativando
   * @returns {Promise<Object>} - Usuário reativado
   */
  async reactivate(id, reactivatedBy = null) {
    try {
      // Verificar se o usuário existe
      await this.findById(id);

      const { data, error } = await supabase
        .from(this.table)
        .update({ is_active: true })
        .eq('id', id)
        .select(`
          id, uuid, name, email, role, restaurant_id, 
          is_active, email_verified, created_at, updated_at
        `)
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      // Log da atividade
      await this.logActivity({
        user_id: reactivatedBy,
        action: 'reactivate_user',
        entity_type: 'user',
        entity_id: id,
        details: { reactivated_user_email: data.email }
      });

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Autenticar usuário
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise<Object>} - Dados do usuário autenticado
   */
  async authenticate(email, password) {
    try {
      const user = await this.findByEmail(email);

      if (!user.is_active) {
        throw new ValidationError('Usuário inativo');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        throw new ValidationError('Email ou senha inválidos');
      }

      // Atualizar último login
      await supabase
        .from(this.table)
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      // Log da atividade
      await this.logActivity({
        user_id: user.id,
        action: 'login',
        entity_type: 'user',
        entity_id: user.id
      });

      // Remover senha do retorno
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar usuários por restaurante
   * @param {number} restaurantId - ID do restaurante
   * @returns {Promise<Array>} - Lista de usuários do restaurante
   */
  async findByRestaurant(restaurantId) {
    try {
      const { data, error } = await supabase
        .from('users_with_restaurant')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) {
        throw handleSupabaseError(error);
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar estatísticas dos usuários
   * @returns {Promise<Object>} - Estatísticas
   */
  async getStats() {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Revogar todos os tokens de um usuário
   * @param {number} userId - ID do usuário
   */
  async revokeAllTokens(userId) {
    try {
      await supabase
        .from(this.tokenTable)
        .update({ is_revoked: true })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Erro ao revogar tokens:', error);
    }
  }

  /**
   * Log de atividade
   * @param {Object} activityData - Dados da atividade
   */
  async logActivity(activityData) {
    try {
      await supabase
        .from(this.activityTable)
        .insert([{
          ...activityData,
          created_at: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Erro ao registrar atividade:', error);
    }
  }

  /**
   * Verificar se usuário tem permissão para acessar restaurante
   * @param {number} userId - ID do usuário
   * @param {number} restaurantId - ID do restaurante
   * @returns {Promise<boolean>} - Tem permissão
   */
  async hasRestaurantAccess(userId, restaurantId) {
    try {
      const user = await this.findById(userId);
      
      // Super admin tem acesso a tudo
      if (user.role === 'super_admin') {
        return true;
      }

      // Restaurant user só tem acesso ao próprio restaurante
      return user.restaurant_id === parseInt(restaurantId);
    } catch (error) {
      return false;
    }
  }
}

module.exports = new User();