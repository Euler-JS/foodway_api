const { supabase } = require('../config/supabase');
const { handleSupabaseError, NotFoundError } = require('../utils/errors');

class Category {
  constructor() {
    this.table = 'categories';
  }

  /**
   * Buscar todas as categorias
   * @param {Object} options - Opções de filtro e paginação
   * @returns {Promise<Array>} - Lista de categorias
   */
  async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        restaurantId = null,
        isActive = null,
        search = null,
        sortBy = 'sort_order',
        sortOrder = 'asc'
      } = options;

      let query = supabase
        .from(this.table)
        .select(`
          *,
          restaurant:restaurants(
            id,
            name,
            city
          )
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      // Filtros opcionais
      if (restaurantId) {
        query = query.eq('restaurant_id', restaurantId);
      }

      if (isActive !== null) {
        query = query.eq('is_active', isActive);
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
   * Buscar categoria por ID
   * @param {number} id - ID da categoria
   * @returns {Promise<Object>} - Dados da categoria
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
            city,
            uuid
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError('Categoria não encontrada');
        }
        throw handleSupabaseError(error);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar categoria por UUID
   * @param {string} uuid - UUID da categoria
   * @returns {Promise<Object>} - Dados da categoria
   */
  async findByUuid(uuid) {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select(`
          *,
          restaurant:restaurants(
            id,
            name,
            city,
            uuid
          )
        `)
        .eq('uuid', uuid)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError('Categoria não encontrada');
        }
        throw handleSupabaseError(error);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar categorias por restaurante
   * @param {number} restaurantId - ID do restaurante
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Array>} - Lista de categorias do restaurante
   */
  async findByRestaurant(restaurantId, options = {}) {
    try {
      const {
        isActive = true,
        includeProductCount = false
      } = options;

      let selectQuery = '*';
      
      if (includeProductCount) {
        selectQuery = `
          *,
          products:products(count)
        `;
      }

      let query = supabase
        .from(this.table)
        .select(selectQuery)
        .eq('restaurant_id', restaurantId)
        .order('sort_order', { ascending: true });

      if (isActive !== null) {
        query = query.eq('is_active', isActive);
      }

      const { data, error } = await query;

      if (error) {
        throw handleSupabaseError(error);
      }

      // Se incluir contagem de produtos, processar os dados
      if (includeProductCount && data) {
        return data.map(category => ({
          ...category,
          products_count: category.products?.[0]?.count || 0,
          products: undefined // Remover o campo products usado apenas para contagem
        }));
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Criar nova categoria
   * @param {Object} categoryData - Dados da categoria
   * @returns {Promise<Object>} - Categoria criada
   */
  async create(categoryData) {
    try {
      // Se não foi fornecido sort_order, calcular o próximo
      if (!categoryData.sort_order) {
        const { data: lastCategory } = await supabase
          .from(this.table)
          .select('sort_order')
          .eq('restaurant_id', categoryData.restaurant_id)
          .order('sort_order', { ascending: false })
          .limit(1)
          .single();

        categoryData.sort_order = (lastCategory?.sort_order || 0) + 1;
      }

      const { data, error } = await supabase
        .from(this.table)
        .insert([categoryData])
        .select(`
          *,
          restaurant:restaurants(
            id,
            name,
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
   * Atualizar categoria
   * @param {number} id - ID da categoria
   * @param {Object} updateData - Dados para atualização
   * @returns {Promise<Object>} - Categoria atualizada
   */
  async update(id, updateData) {
    try {
      // Verificar se a categoria existe
      await this.findById(id);

      const { data, error } = await supabase
        .from(this.table)
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          restaurant:restaurants(
            id,
            name,
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
   * Deletar categoria (soft delete)
   * @param {number} id - ID da categoria
   * @returns {Promise<Object>} - Categoria deletada
   */
  async delete(id) {
    try {
      // Verificar se a categoria existe
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
   * Deletar categoria permanentemente
   * @param {number} id - ID da categoria
   * @returns {Promise<boolean>} - Sucesso da operação
   */
  async hardDelete(id) {
    try {
      // Verificar se a categoria existe
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
   * Reativar categoria
   * @param {number} id - ID da categoria
   * @returns {Promise<Object>} - Categoria reativada
   */
  async reactivate(id) {
    try {
      // Verificar se a categoria existe
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
   * Reordenar categorias
   * @param {number} restaurantId - ID do restaurante
   * @param {Array} categoryOrders - Array com {id, sort_order}
   * @returns {Promise<Array>} - Categorias reordenadas
   */
  async reorder(restaurantId, categoryOrders) {
    try {
      const updates = [];

      for (const categoryOrder of categoryOrders) {
        const { id, sort_order } = categoryOrder;
        
        const updatePromise = supabase
          .from(this.table)
          .update({ sort_order })
          .eq('id', id)
          .eq('restaurant_id', restaurantId);

        updates.push(updatePromise);
      }

      await Promise.all(updates);

      // Retornar as categorias reordenadas
      return await this.findByRestaurant(restaurantId);
    } catch (error) {
      throw handleSupabaseError(error);
    }
  }

  /**
   * Duplicar categoria
   * @param {number} id - ID da categoria a ser duplicada
   * @param {Object} overrides - Dados para sobrescrever
   * @returns {Promise<Object>} - Nova categoria criada
   */
  async duplicate(id, overrides = {}) {
    try {
      // Buscar a categoria original
      const originalCategory = await this.findById(id);

      // Remover campos que não devem ser duplicados
      const { id: _, uuid: __, created_at: ___, updated_at: ____, restaurant: _____, ...categoryData } = originalCategory;

      // Aplicar sobrescrições
      const newCategoryData = {
        ...categoryData,
        ...overrides,
        name: overrides.name || `${categoryData.name} (Cópia)`
      };

      return await this.create(newCategoryData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar estatísticas das categorias
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

module.exports = new Category();