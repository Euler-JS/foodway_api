const Restaurant = require('../models/Restaurant');
const ApiResponse = require('../utils/response');
const { AppError } = require('../utils/errors');

class RestaurantController {
  /**
   * Listar todos os restaurantes
   * GET /api/v1/restaurants
   */
  async index(req, res, next) {
    try {
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        isActive: req.query.is_active,
        city: req.query.city,
        search: req.query.search
      };

      const result = await Restaurant.findAll(options);

      return ApiResponse.success(res, result, 'Restaurantes listados com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar restaurante por ID
   * GET /api/v1/restaurants/:id
   */
  async show(req, res, next) {
    try {
      const { id } = req.params;
      const restaurant = await Restaurant.findById(id);

      return ApiResponse.success(res, restaurant, 'Restaurante encontrado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar restaurante por UUID
   * GET /api/v1/restaurants/uuid/:uuid
   */
  async showByUuid(req, res, next) {
    try {
      const { uuid } = req.params;
      const restaurant = await Restaurant.findByUuid(uuid);

      return ApiResponse.success(res, restaurant, 'Restaurante encontrado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Criar novo restaurante
   * POST /api/v1/restaurants
   */
  async store(req, res, next) {
    try {
      const restaurantData = req.body;
      const restaurant = await Restaurant.create(restaurantData);

      return ApiResponse.success(
        res, 
        restaurant, 
        'Restaurante criado com sucesso', 
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar restaurante
   * PUT /api/v1/restaurants/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const restaurant = await Restaurant.update(id, updateData);

      return ApiResponse.success(res, restaurant, 'Restaurante atualizado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletar restaurante (soft delete)
   * DELETE /api/v1/restaurants/:id
   */
  async destroy(req, res, next) {
    try {
      const { id } = req.params;
      const restaurant = await Restaurant.delete(id);

      return ApiResponse.success(res, restaurant, 'Restaurante inativado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletar restaurante permanentemente
   * DELETE /api/v1/restaurants/:id/hard
   */
  async hardDestroy(req, res, next) {
    try {
      const { id } = req.params;
      await Restaurant.hardDelete(id);

      return ApiResponse.success(res, null, 'Restaurante deletado permanentemente');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reativar restaurante
   * PATCH /api/v1/restaurants/:id/reactivate
   */
  async reactivate(req, res, next) {
    try {
      const { id } = req.params;
      const restaurant = await Restaurant.reactivate(id);

      return ApiResponse.success(res, restaurant, 'Restaurante reativado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter estatísticas dos restaurantes
   * GET /api/v1/restaurants/stats
   */
  async stats(req, res, next) {
    try {
      const stats = await Restaurant.getStats();

      return ApiResponse.success(res, stats, 'Estatísticas obtidas com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar restaurantes por cidade
   * GET /api/v1/restaurants/city/:city
   */
  async findByCity(req, res, next) {
    try {
      const { city } = req.params;
      const options = {
        page: req.query.page || 1,
        limit: req.query.limit || 10,
        city: city,
        isActive: req.query.is_active !== undefined ? req.query.is_active : true
      };

      const result = await Restaurant.findAll(options);

      return ApiResponse.success(
        res, 
        result, 
        `Restaurantes encontrados em ${city}`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar restaurantes
   * GET /api/v1/restaurants/search
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
        isActive: req.query.is_active !== undefined ? req.query.is_active : true
      };

      const result = await Restaurant.findAll(options);

      return ApiResponse.success(
        res, 
        result, 
        `Restaurantes encontrados para "${q}"`
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RestaurantController();