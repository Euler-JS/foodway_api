const { supabase } = require('../config/supabase');
const { handleSupabaseError, NotFoundError } = require('../utils/errors');

class Menu {
  constructor() {
    this.restaurantTable = 'restaurants';
    this.categoryTable = 'categories';
    this.productTable = 'products';
  }

  /**
   * Buscar menu completo de um restaurante
   * @param {number|string} restaurantIdentifier - ID ou UUID do restaurante
   * @param {Object} options - Opções de filtro
   * @returns {Promise<Object>} - Menu completo no formato do Flutter
   */
  async getCompleteMenu(restaurantIdentifier, options = {}) {
    try {
      const {
        includeInactive = false,
        includeUnavailable = false,
        categoryId = null
      } = options;

      // Buscar restaurante por ID ou UUID
      let restaurant;
      if (typeof restaurantIdentifier === 'string' && restaurantIdentifier.includes('-')) {
        restaurant = await this.findRestaurantByUuid(restaurantIdentifier);
      } else {
        restaurant = await this.findRestaurantById(restaurantIdentifier);
      }

      // Buscar categorias do restaurante
      const categories = await this.getCategoriesWithProducts(
        restaurant.id, 
        { includeInactive, includeUnavailable, categoryId }
      );

      // Montar resposta no formato do Flutter
      const menuResponse = {
        success: true,
        restaurant: {
          id: restaurant.id,
          uuid: restaurant.uuid,
          name: restaurant.name,
          logo: restaurant.logo,
          address: restaurant.address,
          city: restaurant.city,
          phone: restaurant.phone
        },
        menu: categories
      };

      return menuResponse;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar restaurante por ID
   * @param {number} id - ID do restaurante
   * @returns {Promise<Object>} - Dados do restaurante
   */
  async findRestaurantById(id) {
    try {
      const { data, error } = await supabase
        .from(this.restaurantTable)
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
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
  async findRestaurantByUuid(uuid) {
    try {
      const { data, error } = await supabase
        .from(this.restaurantTable)
        .select('*')
        .eq('uuid', uuid)
        .eq('is_active', true)
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
   * Buscar categorias com produtos
   * @param {number} restaurantId - ID do restaurante
   * @param {Object} options - Opções de filtro
   * @returns {Promise<Array>} - Categorias com produtos no formato do Flutter
   */
  async getCategoriesWithProducts(restaurantId, options = {}) {
    try {
      const {
        includeInactive = false,
        includeUnavailable = false,
        categoryId = null
      } = options;

      // Query para categorias
      let categoryQuery = supabase
        .from(this.categoryTable)
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order', { ascending: true });

      if (!includeInactive) {
        categoryQuery = categoryQuery.eq('is_active', true);
      }

      if (categoryId) {
        categoryQuery = categoryQuery.eq('id', categoryId);
      }

      const { data: categories, error: categoryError } = await categoryQuery;

      if (categoryError) {
        throw handleSupabaseError(categoryError);
      }

      if (!categories || categories.length === 0) {
        return [];
      }

      // Buscar produtos para cada categoria
      const menuCategories = [];

      for (const category of categories) {
        const products = await this.getProductsByCategory(
          category.id, 
          { includeUnavailable }
        );

        const menuCategory = {
          category_id: category.id,
          uuid: category.uuid,
          category_name: category.name,
          image_url: category.image_url || 'https://mannauniverse-aybw3.kinsta.app/assets/images/category_default.png',
          products: products
        };

        menuCategories.push(menuCategory);
      }

      return menuCategories;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar produtos de uma categoria
   * @param {number} categoryId - ID da categoria
   * @param {Object} options - Opções de filtro
   * @returns {Promise<Array>} - Produtos no formato do Flutter
   */
  async getProductsByCategory(categoryId, options = {}) {
    try {
      const { includeUnavailable = false } = options;

      let productQuery = supabase
        .from(this.productTable)
        .select('*')
        .eq('category_id', categoryId)
        .order('sort_order', { ascending: true });

      if (!includeUnavailable) {
        productQuery = productQuery.eq('is_available', true);
      }

      const { data: products, error: productError } = await productQuery;

      if (productError) {
        throw handleSupabaseError(productError);
      }

      if (!products) {
        return [];
      }

      // Formatar produtos para o Flutter
      return products.map(product => ({
        id: product.id,
        uuid: product.uuid,
        name: product.name,
        description: product.description || '',
        regular_price: product.regular_price,
        current_price: product.current_price,
        is_on_promotion: product.is_on_promotion,
        image_url: product.image_url || 'https://mannauniverse-aybw3.kinsta.app/assets/images/category_default.png'
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar menu por categoria específica
   * @param {number|string} restaurantIdentifier - ID ou UUID do restaurante
   * @param {number} categoryId - ID da categoria
   * @returns {Promise<Object>} - Menu da categoria específica
   */
  async getMenuByCategory(restaurantIdentifier, categoryId) {
    try {
      return await this.getCompleteMenu(restaurantIdentifier, { categoryId });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar produtos em promoção de um restaurante
   * @param {number|string} restaurantIdentifier - ID ou UUID do restaurante
   * @returns {Promise<Array>} - Produtos em promoção
   */
  async getPromotions(restaurantIdentifier) {
    try {
      // Buscar restaurante
      let restaurant;
      if (typeof restaurantIdentifier === 'string' && restaurantIdentifier.includes('-')) {
        restaurant = await this.findRestaurantByUuid(restaurantIdentifier);
      } else {
        restaurant = await this.findRestaurantById(restaurantIdentifier);
      }

      // Buscar produtos em promoção
      const { data: products, error } = await supabase
        .from(this.productTable)
        .select(`
          *,
          category:categories!inner(
            id,
            name,
            restaurant_id
          )
        `)
        .eq('categories.restaurant_id', restaurant.id)
        .eq('is_on_promotion', true)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw handleSupabaseError(error);
      }

      // Agrupar por categoria
      const promotionsByCategory = {};
      
      products.forEach(product => {
        const categoryName = product.category.name;
        
        if (!promotionsByCategory[categoryName]) {
          promotionsByCategory[categoryName] = {
            category_id: product.category.id,
            category_name: categoryName,
            products: []
          };
        }

        promotionsByCategory[categoryName].products.push({
          id: product.id,
          uuid: product.uuid,
          name: product.name,
          description: product.description || '',
          regular_price: product.regular_price,
          current_price: product.current_price,
          is_on_promotion: product.is_on_promotion,
          image_url: product.image_url || 'https://mannauniverse-aybw3.kinsta.app/assets/images/category_default.png'
        });
      });

      return Object.values(promotionsByCategory);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar item específico do menu
   * @param {number|string} restaurantIdentifier - ID ou UUID do restaurante
   * @param {number|string} productIdentifier - ID ou UUID do produto
   * @returns {Promise<Object>} - Detalhes do item
   */
  async getMenuItem(restaurantIdentifier, productIdentifier) {
    try {
      // Buscar restaurante
      let restaurant;
      if (typeof restaurantIdentifier === 'string' && restaurantIdentifier.includes('-')) {
        restaurant = await this.findRestaurantByUuid(restaurantIdentifier);
      } else {
        restaurant = await this.findRestaurantById(restaurantIdentifier);
      }

      // Buscar produto
      let productQuery = supabase
        .from(this.productTable)
        .select(`
          *,
          category:categories!inner(
            id,
            name,
            restaurant_id
          )
        `)
        .eq('categories.restaurant_id', restaurant.id);

      if (typeof productIdentifier === 'string' && productIdentifier.includes('-')) {
        productQuery = productQuery.eq('uuid', productIdentifier);
      } else {
        productQuery = productQuery.eq('id', productIdentifier);
      }

      const { data, error } = await productQuery.single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError('Item do menu não encontrado');
        }
        throw handleSupabaseError(error);
      }

      return {
        success: true,
        restaurant: {
          id: restaurant.id,
          uuid: restaurant.uuid,
          name: restaurant.name,
          logo: restaurant.logo,
          address: restaurant.address,
          city: restaurant.city,
          phone: restaurant.phone
        },
        category: {
          id: data.category.id,
          name: data.category.name
        },
        product: {
          id: data.id,
          uuid: data.uuid,
          name: data.name,
          description: data.description || '',
          regular_price: data.regular_price,
          current_price: data.current_price,
          is_on_promotion: data.is_on_promotion,
          image_url: data.image_url || 'https://mannauniverse-aybw3.kinsta.app/assets/images/category_default.png'
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar estatísticas do menu
   * @param {number|string} restaurantIdentifier - ID ou UUID do restaurante
   * @returns {Promise<Object>} - Estatísticas do menu
   */
  async getMenuStats(restaurantIdentifier) {
    try {
      // Buscar restaurante
      let restaurant;
      if (typeof restaurantIdentifier === 'string' && restaurantIdentifier.includes('-')) {
        restaurant = await this.findRestaurantByUuid(restaurantIdentifier);
      } else {
        restaurant = await this.findRestaurantById(restaurantIdentifier);
      }

      // Buscar estatísticas
      const [categoriesResult, productsResult, promotionsResult] = await Promise.all([
        // Total de categorias ativas
        supabase
          .from(this.categoryTable)
          .select('id')
          .eq('restaurant_id', restaurant.id)
          .eq('is_active', true),
        
        // Total de produtos disponíveis
        supabase
          .from(this.productTable)
          .select('id, current_price, categories!inner(restaurant_id)')
          .eq('categories.restaurant_id', restaurant.id)
          .eq('is_available', true),
        
        // Total de produtos em promoção
        supabase
          .from(this.productTable)
          .select('id, categories!inner(restaurant_id)')
          .eq('categories.restaurant_id', restaurant.id)
          .eq('is_available', true)
          .eq('is_on_promotion', true)
      ]);

      const totalCategories = categoriesResult.data?.length || 0;
      const products = productsResult.data || [];
      const totalProducts = products.length;
      const totalPromotions = promotionsResult.data?.length || 0;
      
      const averagePrice = totalProducts > 0 
        ? products.reduce((sum, p) => sum + parseFloat(p.current_price), 0) / totalProducts 
        : 0;

      return {
        success: true,
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name,
        stats: {
          total_categories: totalCategories,
          total_products: totalProducts,
          total_promotions: totalPromotions,
          average_price: Math.round(averagePrice * 100) / 100
        }
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new Menu();