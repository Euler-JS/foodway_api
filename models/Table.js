const { supabase } = require('../config/supabase');
const { handleSupabaseError, NotFoundError, ConflictError } = require('../utils/errors');

class Table {
  constructor() {
    this.table = 'tables';
  }

  /**
   * Buscar todas as mesas com filtros
   * @param {Object} options - Opções de filtro e paginação
   * @returns {Promise<Object>} - Lista paginada de mesas
   */
  async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        restaurantId = null,
        isActive = null,
        sortBy = 'table_number',
        sortOrder = 'asc'
      } = options;

      let query = supabase
        .from(this.table)
        .select(`
          *,
          restaurant:restaurants(
            id,
            name,
            uuid,
            city
          )
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      // Filtros
      if (restaurantId) {
        query = query.eq('restaurant_id', restaurantId);
      }

      if (isActive !== null) {
        query = query.eq('is_active', isActive);
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
   * Buscar mesa por ID
   * @param {number} id - ID da mesa
   * @returns {Promise<Object>} - Dados da mesa
   */
  async findById(id) {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select(`
          *,
          restaurant:restaurants(
            id,
            name,
            uuid,
            city
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError('Mesa não encontrada');
        }
        throw handleSupabaseError(error);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar mesas por restaurante
   * @param {number} restaurantId - ID do restaurante
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Array>} - Lista de mesas do restaurante
   */
  async findByRestaurant(restaurantId, options = {}) {
    try {
      const { isActive = true } = options;

      let query = supabase
        .from(this.table)
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('table_number', { ascending: true });

      if (isActive !== null) {
        query = query.eq('is_active', isActive);
      }

      const { data, error } = await query;

      if (error) {
        throw handleSupabaseError(error);
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar mesa por restaurante e número
   * @param {number} restaurantId - ID do restaurante
   * @param {number} tableNumber - Número da mesa
   * @returns {Promise<Object>} - Dados da mesa
   */
  async findByRestaurantAndNumber(restaurantId, tableNumber) {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select(`
          *,
          restaurant:restaurants(
            id,
            name,
            uuid,
            city
          )
        `)
        .eq('restaurant_id', restaurantId)
        .eq('table_number', tableNumber)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError('Mesa não encontrada');
        }
        throw handleSupabaseError(error);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Criar nova mesa
   * @param {Object} tableData - Dados da mesa
   * @returns {Promise<Object>} - Mesa criada
   */
  async create(tableData) {
    try {
      // Verificar se já existe mesa com este número no restaurante
      try {
        await this.findByRestaurantAndNumber(tableData.restaurant_id, tableData.table_number);
        throw new ConflictError(`Mesa ${tableData.table_number} já existe neste restaurante`);
      } catch (error) {
        if (!(error instanceof NotFoundError)) {
          throw error;
        }
      }

      const { data, error } = await supabase
        .from(this.table)
        .insert([tableData])
        .select(`
          *,
          restaurant:restaurants(
            id,
            name,
            uuid,
            city
          )
        `)
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
   * Criar múltiplas mesas em lote
   * @param {number} restaurantId - ID do restaurante
   * @param {Array} tableNumbers - Array de números de mesa
   * @returns {Promise<Array>} - Mesas criadas
   */
  async createBatch(restaurantId, tableNumbers) {
    try {
      // Verificar quais números já existem
      const existingTables = await this.findByRestaurant(restaurantId, { isActive: null });
      const existingNumbers = existingTables.map(table => table.table_number);
      
      // Filtrar apenas números que não existem
      const newNumbers = tableNumbers.filter(num => !existingNumbers.includes(num));
      
      if (newNumbers.length === 0) {
        throw new ConflictError('Todas as mesas especificadas já existem');
      }

      // Preparar dados para inserção
      const tablesToInsert = newNumbers.map(tableNumber => ({
        restaurant_id: restaurantId,
        table_number: tableNumber,
        is_active: true
      }));

      const { data, error } = await supabase
        .from(this.table)
        .insert(tablesToInsert)
        .select(`
          *,
          restaurant:restaurants(
            id,
            name,
            uuid,
            city
          )
        `);

      if (error) {
        throw handleSupabaseError(error);
      }

      return {
        created: data || [],
        skipped: existingNumbers.filter(num => tableNumbers.includes(num)),
        total_created: data?.length || 0,
        total_skipped: tableNumbers.length - (data?.length || 0)
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualizar mesa
   * @param {number} id - ID da mesa
   * @param {Object} updateData - Dados para atualização
   * @returns {Promise<Object>} - Mesa atualizada
   */
  async update(id, updateData) {
    try {
      // Verificar se a mesa existe
      await this.findById(id);

      // Se está mudando o número da mesa, verificar conflito
      if (updateData.table_number) {
        const table = await this.findById(id);
        if (updateData.table_number !== table.table_number) {
          try {
            await this.findByRestaurantAndNumber(table.restaurant_id, updateData.table_number);
            throw new ConflictError(`Mesa ${updateData.table_number} já existe neste restaurante`);
          } catch (error) {
            if (!(error instanceof NotFoundError)) {
              throw error;
            }
          }
        }
      }

      const { data, error } = await supabase
        .from(this.table)
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          restaurant:restaurants(
            id,
            name,
            uuid,
            city
          )
        `)
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
   * Deletar mesa (soft delete)
   * @param {number} id - ID da mesa
   * @returns {Promise<Object>} - Mesa deletada
   */
  async delete(id) {
    try {
      // Verificar se a mesa existe
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
   * Deletar mesa permanentemente
   * @param {number} id - ID da mesa
   * @returns {Promise<boolean>} - Sucesso da operação
   */
  async hardDelete(id) {
    try {
      // Verificar se a mesa existe
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
   * Reativar mesa
   * @param {number} id - ID da mesa
   * @returns {Promise<Object>} - Mesa reativada
   */
  async reactivate(id) {
    try {
      // Verificar se a mesa existe
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
   * Obter estatísticas das mesas
   * @param {number} restaurantId - ID do restaurante (opcional)
   * @returns {Promise<Object>} - Estatísticas
   */
  async getStats(restaurantId = null) {
    try {
      let totalQuery = supabase
        .from(this.table)
        .select('id')
        .eq('is_active', true);

      let inactiveQuery = supabase
        .from(this.table)
        .select('id')
        .eq('is_active', false);

      if (restaurantId) {
        totalQuery = totalQuery.eq('restaurant_id', restaurantId);
        inactiveQuery = inactiveQuery.eq('restaurant_id', restaurantId);
      }

      const [totalResult, inactiveResult] = await Promise.all([
        totalQuery,
        inactiveQuery
      ]);

      if (totalResult.error || inactiveResult.error) {
        throw handleSupabaseError(totalResult.error || inactiveResult.error);
      }

      return {
        total: totalResult.data?.length || 0,
        active: totalResult.data?.length || 0,
        inactive: inactiveResult.data?.length || 0,
        restaurant_id: restaurantId
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new Table();