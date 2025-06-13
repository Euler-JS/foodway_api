const Category = require('../models/Category');
const Restaurant = require('../models/Restaurant');
const ApiResponse = require('../utils/response');
const { AppError } = require('../utils/errors');

class CategoryController {
  /**
   * Listar todas as categorias
   * GET /api/v1/categories
   */
  async index(req, res, next) {
    try {
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        restaurantId: req.query.restaurant_id,
        isActive: req.query.is_active,
        search: req.query.search,
        sortBy: req.query.sort_by,
        sortOrder: req.query.sort_order
      };

      const result = await Category.findAll(options);

      return ApiResponse.success(res, result, 'Categorias listadas com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar categoria por ID
   * GET /api/v1/categories/:id
   */
  async show(req, res, next) {
    try {
      const { id } = req.params;
      const category = await Category.findById(id);

      return ApiResponse.success(res, category, 'Categoria encontrada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar categoria por UUID
   * GET /api/v1/categories/uuid/:uuid
   */
  async showByUuid(req, res, next) {
    try {
      const { uuid } = req.params;
      const category = await Category.findByUuid(uuid);

      return ApiResponse.success(res, category, 'Categoria encontrada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Listar categorias por restaurante
   * GET /api/v1/restaurants/:restaurant_id/categories
   */
  async indexByRestaurant(req, res, next) {
    try {
      const { restaurant_id } = req.params;
      
      // Verificar se o restaurante existe
      await Restaurant.findById(restaurant_id);

      const options = {
        isActive: req.query.is_active,
        includeProductCount: req.query.include_product_count
      };

      const categories = await Category.findByRestaurant(restaurant_id, options);

      return ApiResponse.success(
        res, 
        categories, 
        'Categorias do restaurante listadas com sucesso'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Criar nova categoria
   * POST /api/v1/categories
   */
  async store(req, res, next) {
    try {
      const categoryData = req.body;

      // Verificar se o restaurante existe
      await Restaurant.findById(categoryData.restaurant_id);

      const category = await Category.create(categoryData);

      return ApiResponse.success(
        res, 
        category, 
        'Categoria criada com sucesso', 
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Criar categoria para um restaurante específico
   * POST /api/v1/restaurants/:restaurant_id/categories
   */
  async storeForRestaurant(req, res, next) {
    try {
      const { restaurant_id } = req.params;
      const categoryData = { ...req.body, restaurant_id: parseInt(restaurant_id) };

      // Verificar se o restaurante existe
      await Restaurant.findById(restaurant_id);

      const category = await Category.create(categoryData);

      return ApiResponse.success(
        res, 
        category, 
        'Categoria criada com sucesso', 
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar categoria
   * PUT /api/v1/categories/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Se está mudando o restaurante, verificar se existe
      if (updateData.restaurant_id) {
        await Restaurant.findById(updateData.restaurant_id);
      }

      const category = await Category.update(id, updateData);

      return ApiResponse.success(res, category, 'Categoria atualizada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletar categoria (soft delete)
   * DELETE /api/v1/categories/:id
   */
  async destroy(req, res, next) {
    try {
      const { id } = req.params;
      const category = await Category.delete(id);

      return ApiResponse.success(res, category, 'Categoria inativada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletar categoria permanentemente
   * DELETE /api/v1/categories/:id/hard
   */
  async hardDestroy(req, res, next) {
    try {
      const { id } = req.params;
      await Category.hardDelete(id);

      return ApiResponse.success(res, null, 'Categoria deletada permanentemente');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reativar categoria
   * PATCH /api/v1/categories/:id/reactivate
   */
  async reactivate(req, res, next) {
    try {
      const { id } = req.params;
      const category = await Category.reactivate(id);

      return ApiResponse.success(res, category, 'Categoria reativada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Duplicar categoria
   * POST /api/v1/categories/:id/duplicate
   */
  async duplicate(req, res, next) {
    try {
      const { id } = req.params;
      const overrides = req.body;

      const category = await Category.duplicate(id, overrides);

      return ApiResponse.success(
        res, 
        category, 
        'Categoria duplicada com sucesso', 
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reordenar categorias de um restaurante
   * PUT /api/v1/restaurants/:restaurant_id/categories/reorder
   */
  async reorder(req, res, next) {
    try {
      const { restaurant_id } = req.params;
      const { categories } = req.body;

      // Verificar se o restaurante existe
      await Restaurant.findById(restaurant_id);

      const reorderedCategories = await Category.reorder(restaurant_id, categories);

      return ApiResponse.success(
        res, 
        reorderedCategories, 
        'Categorias reordenadas com sucesso'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter estatísticas das categorias
   * GET /api/v1/categories/stats
   */
  async stats(req, res, next) {
    try {
      const restaurantId = req.query.restaurant_id;
      
      // Se fornecido restaurant_id, verificar se existe
      if (restaurantId) {
        await Restaurant.findById(restaurantId);
      }

      const stats = await Category.getStats(restaurantId);

      return ApiResponse.success(res, stats, 'Estatísticas obtidas com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter estatísticas das categorias de um restaurante
   * GET /api/v1/restaurants/:restaurant_id/categories/stats
   */
  async statsByRestaurant(req, res, next) {
    try {
      const { restaurant_id } = req.params;
      
      // Verificar se o restaurante existe
      await Restaurant.findById(restaurant_id);

      const stats = await Category.getStats(restaurant_id);

      return ApiResponse.success(
        res, 
        stats, 
        'Estatísticas das categorias do restaurante obtidas com sucesso'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar categorias
   * GET /api/v1/categories/search
   */
  async search(req, res, next) {
    try {
      const { q } = req.query;
      
      if (!q || q.trim().length === 0) {
        throw new AppError('Parâmetro de busca é obrigatório', 400);
      }

      const options = {
        page: req.query.page || 1,
        limit: req.query.limit || 10,
        search: q.trim(),
        restaurantId: req.query.restaurant_id,
        isActive: req.query.is_active !== undefined ? req.query.is_active : true
      };

      const result = await Category.findAll(options);

      return ApiResponse.success(
        res, 
        result, 
        `Categorias encontradas para "${q}"`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar categorias por restaurante com filtros
   * GET /api/v1/restaurants/:restaurant_id/categories/search
   */
  async searchByRestaurant(req, res, next) {
    try {
      const { restaurant_id } = req.params;
      const { q } = req.query;
      
      if (!q || q.trim().length === 0) {
        throw new AppError('Parâmetro de busca é obrigatório', 400);
      }

      // Verificar se o restaurante existe
      await Restaurant.findById(restaurant_id);

      const options = {
        page: req.query.page || 1,
        limit: req.query.limit || 10,
        search: q.trim(),
        restaurantId: restaurant_id,
        isActive: req.query.is_active !== undefined ? req.query.is_active : true
      };

      const result = await Category.findAll(options);

      return ApiResponse.success(
        res, 
        result, 
        `Categorias do restaurante encontradas para "${q}"`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verificar se categoria existe
   * HEAD /api/v1/categories/:id
   */
  async exists(req, res, next) {
    try {
      const { id } = req.params;
      await Category.findById(id);

      return res.status(200).end();
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).end();
      }
      next(error);
    }
  }
}

module.exports = new CategoryController();