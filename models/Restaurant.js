const { supabase } = require('../config/supabase');
const { handleSupabaseError, NotFoundError } = require('../utils/errors');

class Restaurant {
  constructor() {
    this.table = 'restaurants';
  }

  /**
   * Buscar todos os restaurantes
   * @param {Object} options - Opções de filtro e paginação
   * @returns {Promise<Array>} - Lista de restaurantes
   */
  async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        isActive = null,
        city = null,
        search = null
      } = options;

      let query = supabase
        .from(this.table)
        .select('*')
        .order('created_at', { ascending: false });

      // Filtros opcionais
      if (isActive !== null) {
        query = query.eq('is_active', isActive);
      }

      if (city) {
        query = query.ilike('city', `%${city}%`);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
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
   * Buscar restaurante por ID
   * @param {number} id - ID do restaurante
   * @returns {Promise<Object>} - Dados do restaurante
   */
  async findById(id) {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError('Restaurante não encontrado');
        }
        throw handleSupabaseError(error);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar restaurante por UUID
   * @param {string} uuid - UUID do restaurante
   * @returns {Promise<Object>} - Dados do restaurante
   */
  async findByUuid(uuid) {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('uuid', uuid)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError('Restaurante não encontrado');
        }
        throw handleSupabaseError(error);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Criar novo restaurante
   * @param {Object} restaurantData - Dados do restaurante
   * @returns {Promise<Object>} - Restaurante criado
   */
  async create(restaurantData) {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .insert([restaurantData])
        .select()
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
   * Atualizar restaurante
   * @param {number} id - ID do restaurante
   * @param {Object} updateData - Dados para atualização
   * @returns {Promise<Object>} - Restaurante atualizado
   */
  async update(id, updateData) {
    try {
      // Verificar se o restaurante existe
      await this.findById(id);

      const { data, error } = await supabase
        .from(this.table)
        .update(updateData)
        .eq('id', id)
        .select()
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
   * Deletar restaurante (soft delete)
   * @param {number} id - ID do restaurante
   * @returns {Promise<Object>} - Restaurante deletado
   */
  async delete(id) {
    try {
      // Verificar se o restaurante existe
      await this.findById(id);

      const { data, error } = await supabase
        .from(this.table)
        .update({ is_active: false })
        .eq('id', id)
        .select()
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
   * Deletar restaurante permanentemente
   * @param {number} id - ID do restaurante
   * @returns {Promise<boolean>} - Sucesso da operação
   */
  async hardDelete(id) {
    try {
      // Verificar se o restaurante existe
      await this.findById(id);

      const { error } = await supabase
        .from(this.table)
        .delete()
        .eq('id', id);

      if (error) {
        throw handleSupabaseError(error);
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reativar restaurante
   * @param {number} id - ID do restaurante
   * @returns {Promise<Object>} - Restaurante reativado
   */
  async reactivate(id) {
    try {
      // Verificar se o restaurante existe
      await this.findById(id);

      const { data, error } = await supabase
        .from(this.table)
        .update({ is_active: true })
        .eq('id', id)
        .select()
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
   * Buscar estatísticas básicas dos restaurantes
   * @returns {Promise<Object>} - Estatísticas
   */
  async getStats() {
    try {
      const { data: totalData, error: totalError } = await supabase
        .from(this.table)
        .select('id')
        .eq('is_active', true);

      const { data: inactiveData, error: inactiveError } = await supabase
        .from(this.table)
        .select('id')
        .eq('is_active', false);

      if (totalError || inactiveError) {
        throw handleSupabaseError(totalError || inactiveError);
      }

      return {
        total: totalData?.length || 0,
        active: totalData?.length || 0,
        inactive: inactiveData?.length || 0
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new Restaurant();