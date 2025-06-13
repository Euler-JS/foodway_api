const { supabase } = require('../config/supabase');
const { handleSupabaseError, NotFoundError } = require('../utils/errors');

class Product {
  constructor() {
    this.table = 'products';
  }

  /**
   * Buscar todos os produtos
   * @param {Object} options - Opções de filtro e paginação
   * @returns {Promise<Array>} - Lista de produtos
   */
  async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        categoryId = null,
        restaurantId = null,
        isAvailable = null,
        isOnPromotion = null,
        minPrice = null,
        maxPrice = null,
        search = null,
        sortBy = 'sort_order',
        sortOrder = 'asc'
      } = options;

      let query = supabase
        .from(this.table)
        .select(`
          *,
          category:categories(
            id,
            name,
            restaurant_id,
            restaurant:restaurants(
              id,
              name,
              city
            )
          )
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      // Filtros opcionais
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (restaurantId) {
        query = query.eq('categories.restaurant_id', restaurantId);
      }

      if (isAvailable !== null) {
        query = query.eq('is_available', isAvailable);
      }

      if (isOnPromotion !== null) {
        query = query.eq('is_on_promotion', isOnPromotion);
      }

      if (minPrice !== null) {
        query = query.gte('current_price', minPrice);
      }

      if (maxPrice !== null) {
        query = query.lte('current_price', maxPrice);
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
   * Buscar produto por ID
   * @param {number} id - ID do produto
   * @returns {Promise<Object>} - Dados do produto
   */
  async findById(id) {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select(`
          *,
          category:categories(
            id,
            name,
            restaurant_id,
            uuid,
            restaurant:restaurants(
              id,
              name,
              city,
              uuid
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError('Produto não encontrado');
        }
        throw handleSupabaseError(error);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar produto por UUID
   * @param {string} uuid - UUID do produto
   * @returns {Promise<Object>} - Dados do produto
   */
  async findByUuid(uuid) {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select(`
          *,
          category:categories(
            id,
            name,
            restaurant_id,
            uuid,
            restaurant:restaurants(
              id,
              name,
              city,
              uuid
            )
          )
        `)
        .eq('uuid', uuid)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError('Produto não encontrado');
        }
        throw handleSupabaseError(error);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar produtos por categoria
   * @param {number} categoryId - ID da categoria
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Array>} - Lista de produtos da categoria
   */
  async findByCategory(categoryId, options = {}) {
    try {
      const {
        isAvailable = true,
        sortBy = 'sort_order',
        sortOrder = 'asc'
      } = options;

      let query = supabase
        .from(this.table)
        .select('*')
        .eq('category_id', categoryId)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (isAvailable !== null) {
        query = query.eq('is_available', isAvailable);
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
   * Buscar produtos por restaurante
   * @param {number} restaurantId - ID do restaurante
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Array>} - Lista de produtos do restaurante
   */
  async findByRestaurant(restaurantId, options = {}) {
    try {
      const {
        isAvailable = true,
        isOnPromotion = null,
        categoryId = null,
        sortBy = 'sort_order',
        sortOrder = 'asc'
      } = options;

      let query = supabase
        .from(this.table)
        .select(`
          *,
          category:categories!inner(
            id,
            name,
            restaurant_id
          )
        `)
        .eq('categories.restaurant_id', restaurantId)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (isAvailable !== null) {
        query = query.eq('is_available', isAvailable);
      }

      if (isOnPromotion !== null) {
        query = query.eq('is_on_promotion', isOnPromotion);
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId);
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
   * Criar novo produto
   * @param {Object} productData - Dados do produto
   * @returns {Promise<Object>} - Produto criado
   */
  async create(productData) {
    try {
      // Se não foi fornecido sort_order, calcular o próximo
      if (!productData.sort_order) {
        const { data: lastProduct } = await supabase
          .from(this.table)
          .select('sort_order')
          .eq('category_id', productData.category_id)
          .order('sort_order', { ascending: false })
          .limit(1)
          .single();

        productData.sort_order = (lastProduct?.sort_order || 0) + 1;
      }

      // Se current_price não foi fornecido, usar regular_price
      if (!productData.current_price && productData.regular_price) {
        productData.current_price = productData.regular_price;
      }

      const { data, error } = await supabase
        .from(this.table)
        .insert([productData])
        .select(`
          *,
          category:categories(
            id,
            name,
            restaurant_id,
            restaurant:restaurants(
              id,
              name,
              city
            )
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
   * Atualizar produto
   * @param {number} id - ID do produto
   * @param {Object} updateData - Dados para atualização
   * @returns {Promise<Object>} - Produto atualizado
   */
  async update(id, updateData) {
    try {
      // Verificar se o produto existe
      await this.findById(id);

      const { data, error } = await supabase
        .from(this.table)
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          category:categories(
            id,
            name,
            restaurant_id,
            restaurant:restaurants(
              id,
              name,
              city
            )
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
   * Deletar produto (soft delete)
   * @param {number} id - ID do produto
   * @returns {Promise<Object>} - Produto deletado
   */
  async delete(id) {
    try {
      // Verificar se o produto existe
      await this.findById(id);

      const { data, error } = await supabase
        .from(this.table)
        .update({ is_available: false })
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
   * Deletar produto permanentemente
   * @param {number} id - ID do produto
   * @returns {Promise<boolean>} - Sucesso da operação
   */
  async hardDelete(id) {
    try {
      // Verificar se o produto existe
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
   * Reativar produto
   * @param {number} id - ID do produto
   * @returns {Promise<Object>} - Produto reativado
   */
  async reactivate(id) {
    try {
      // Verificar se o produto existe
      await this.findById(id);

      const { data, error } = await supabase
        .from(this.table)
        .update({ is_available: true })
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
   * Aplicar/remover promoção
   * @param {number} id - ID do produto
   * @param {number} promotionPrice - Preço promocional (null para remover)
   * @returns {Promise<Object>} - Produto atualizado
   */
  async togglePromotion(id, promotionPrice = null) {
    try {
      const product = await this.findById(id);

      const updateData = {
        is_on_promotion: promotionPrice !== null,
        current_price: promotionPrice || product.regular_price
      };

      return await this.update(id, updateData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reordenar produtos de uma categoria
   * @param {number} categoryId - ID da categoria
   * @param {Array} productOrders - Array com {id, sort_order}
   * @returns {Promise<Array>} - Produtos reordenados
   */
  async reorder(categoryId, productOrders) {
    try {
      const updates = [];

      for (const productOrder of productOrders) {
        const { id, sort_order } = productOrder;
        
        const updatePromise = supabase
          .from(this.table)
          .update({ sort_order })
          .eq('id', id)
          .eq('category_id', categoryId);

        updates.push(updatePromise);
      }

      await Promise.all(updates);

      // Retornar os produtos reordenados
      return await this.findByCategory(categoryId);
    } catch (error) {
      throw handleSupabaseError(error);
    }
  }

  /**
   * Duplicar produto
   * @param {number} id - ID do produto a ser duplicado
   * @param {Object} overrides - Dados para sobrescrever
   * @returns {Promise<Object>} - Novo produto criado
   */
  async duplicate(id, overrides = {}) {
    try {
      // Buscar o produto original
      const originalProduct = await this.findById(id);

      // Remover campos que não devem ser duplicados
      const { id: _, uuid: __, created_at: ___, updated_at: ____, category: _____, ...productData } = originalProduct;

      // Aplicar sobrescrições
      const newProductData = {
        ...productData,
        ...overrides,
        name: overrides.name || `${productData.name} (Cópia)`
      };

      return await this.create(newProductData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mover produto para outra categoria
   * @param {number} id - ID do produto
   * @param {number} newCategoryId - ID da nova categoria
   * @returns {Promise<Object>} - Produto movido
   */
  async moveToCategory(id, newCategoryId) {
    try {
      // Verificar se o produto existe
      await this.findById(id);

      // Calcular nova posição na categoria de destino
      const { data: lastProduct } = await supabase
        .from(this.table)
        .select('sort_order')
        .eq('category_id', newCategoryId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

      const newSortOrder = (lastProduct?.sort_order || 0) + 1;

      return await this.update(id, {
        category_id: newCategoryId,
        sort_order: newSortOrder
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar produtos em promoção
   * @param {number} restaurantId - ID do restaurante (opcional)
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Array>} - Lista de produtos em promoção
   */
  async findPromotions(restaurantId = null, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = options;

      let query = supabase
        .from(this.table)
        .select(`
          *,
          category:categories(
            id,
            name,
            restaurant_id,
            restaurant:restaurants(
              id,
              name,
              city
            )
          )
        `)
        .eq('is_on_promotion', true)
        .eq('is_available', true)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (restaurantId) {
        query = query.eq('categories.restaurant_id', restaurantId);
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
   * Buscar estatísticas dos produtos
   * @param {number} categoryId - ID da categoria (opcional)
   * @param {number} restaurantId - ID do restaurante (opcional)
   * @returns {Promise<Object>} - Estatísticas
   */
  async getStats(categoryId = null, restaurantId = null) {
    try {
      let baseQuery = supabase.from(this.table).select('id, is_available, is_on_promotion, current_price');

      if (categoryId) {
        baseQuery = baseQuery.eq('category_id', categoryId);
      }

      if (restaurantId) {
        baseQuery = baseQuery
          .select('id, is_available, is_on_promotion, current_price, categories!inner(restaurant_id)')
          .eq('categories.restaurant_id', restaurantId);
      }

      const { data, error } = await baseQuery;

      if (error) {
        throw handleSupabaseError(error);
      }

      const stats = {
        total: data.length,
        available: data.filter(p => p.is_available).length,
        unavailable: data.filter(p => !p.is_available).length,
        on_promotion: data.filter(p => p.is_on_promotion && p.is_available).length,
        average_price: data.length > 0 
          ? data.reduce((sum, p) => sum + parseFloat(p.current_price), 0) / data.length 
          : 0,
        category_id: categoryId,
        restaurant_id: restaurantId
      };

      return stats;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new Product();