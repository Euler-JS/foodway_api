const Table = require('../models/Table');
const Restaurant = require('../models/Restaurant');
const ApiResponse = require('../utils/response');
const { AppError } = require('../utils/errors');

class TableController {
  /**
   * Listar todas as mesas
   * GET /api/v1/tables
   */
  async index(req, res, next) {
    try {
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        restaurantId: req.query.restaurant_id,
        isActive: req.query.is_active,
        sortBy: req.query.sort_by,
        sortOrder: req.query.sort_order
      };

      const result = await Table.findAll(options);

      return ApiResponse.success(res, result, 'Mesas listadas com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar mesa por ID
   * GET /api/v1/tables/:id
   */
  async show(req, res, next) {
    try {
      const { id } = req.params;
      const table = await Table.findById(id);

      return ApiResponse.success(res, table, 'Mesa encontrada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Listar mesas por restaurante
   * GET /api/v1/restaurants/:restaurant_id/tables
   */
  async indexByRestaurant(req, res, next) {
    try {
      const { restaurant_id } = req.params;
      
      // Verificar se o restaurante existe
      await Restaurant.findById(restaurant_id);

      const options = {
        isActive: req.query.is_active
      };

      const tables = await Table.findByRestaurant(restaurant_id, options);

      return ApiResponse.success(
        res, 
        tables, 
        'Mesas do restaurante listadas com sucesso'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Criar nova mesa
   * POST /api/v1/tables
   */
  async store(req, res, next) {
    try {
      const tableData = req.body;

      // Verificar se o restaurante existe
      await Restaurant.findById(tableData.restaurant_id);

      const table = await Table.create(tableData);

      return ApiResponse.success(
        res, 
        table, 
        'Mesa criada com sucesso', 
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Criar mesa para um restaurante específico
   * POST /api/v1/restaurants/:restaurant_id/tables
   */
  async storeForRestaurant(req, res, next) {
    try {
      const { restaurant_id } = req.params;
      const tableData = { ...req.body, restaurant_id: parseInt(restaurant_id) };

      // Verificar se o restaurante existe
      await Restaurant.findById(restaurant_id);

      const table = await Table.create(tableData);

      return ApiResponse.success(
        res, 
        table, 
        'Mesa criada com sucesso', 
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Criar múltiplas mesas em lote
   * POST /api/v1/restaurants/:restaurant_id/tables/batch
   */
  async createBatch(req, res, next) {
    try {
      const { restaurant_id } = req.params;
      const { table_numbers } = req.body;

      // Verificar se o restaurante existe
      await Restaurant.findById(restaurant_id);

      if (!Array.isArray(table_numbers) || table_numbers.length === 0) {
        throw new AppError('Lista de números de mesa é obrigatória', 400);
      }

      // Validar números
      const validNumbers = table_numbers.filter(num => 
        Number.isInteger(num) && num > 0
      );

      if (validNumbers.length === 0) {
        throw new AppError('Nenhum número de mesa válido fornecido', 400);
      }

      const result = await Table.createBatch(restaurant_id, validNumbers);

      return ApiResponse.success(
        res, 
        result, 
        `${result.total_created} mesas criadas com sucesso`, 
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar mesa
   * PUT /api/v1/tables/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Se está mudando o restaurante, verificar se existe
      if (updateData.restaurant_id) {
        await Restaurant.findById(updateData.restaurant_id);
      }

      const table = await Table.update(id, updateData);

      return ApiResponse.success(res, table, 'Mesa atualizada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletar mesa (soft delete)
   * DELETE /api/v1/tables/:id
   */
  async destroy(req, res, next) {
    try {
      const { id } = req.params;
      const table = await Table.delete(id);

      return ApiResponse.success(res, table, 'Mesa inativada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletar mesa permanentemente
   * DELETE /api/v1/tables/:id/hard
   */
  async hardDestroy(req, res, next) {
    try {
      const { id } = req.params;
      await Table.hardDelete(id);

      return ApiResponse.success(res, null, 'Mesa deletada permanentemente');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reativar mesa
   * PATCH /api/v1/tables/:id/reactivate
   */
  async reactivate(req, res, next) {
    try {
      const { id } = req.params;
      const table = await Table.reactivate(id);

      return ApiResponse.success(res, table, 'Mesa reativada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter estatísticas das mesas
   * GET /api/v1/tables/stats
   */
  async stats(req, res, next) {
    try {
      const restaurantId = req.query.restaurant_id;
      
      // Se fornecido restaurant_id, verificar se existe
      if (restaurantId) {
        await Restaurant.findById(restaurantId);
      }

      const stats = await Table.getStats(restaurantId);

      return ApiResponse.success(res, stats, 'Estatísticas obtidas com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter estatísticas das mesas de um restaurante
   * GET /api/v1/restaurants/:restaurant_id/tables/stats
   */
  async statsByRestaurant(req, res, next) {
    try {
      const { restaurant_id } = req.params;
      
      // Verificar se o restaurante existe
      await Restaurant.findById(restaurant_id);

      const stats = await Table.getStats(restaurant_id);

      return ApiResponse.success(
        res, 
        stats, 
        'Estatísticas das mesas do restaurante obtidas com sucesso'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar mesa por restaurante e número
   * GET /api/v1/restaurants/:restaurant_id/tables/number/:table_number
   */
  async showByRestaurantAndNumber(req, res, next) {
    try {
      const { restaurant_id, table_number } = req.params;
      
      // Verificar se o restaurante existe
      await Restaurant.findById(restaurant_id);

      const table = await Table.findByRestaurantAndNumber(
        restaurant_id, 
        parseInt(table_number)
      );

      return ApiResponse.success(res, table, 'Mesa encontrada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verificar se mesa existe
   * HEAD /api/v1/tables/:id
   */
  async exists(req, res, next) {
    try {
      const { id } = req.params;
      await Table.findById(id);

      return res.status(200).end();
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).end();
      }
      next(error);
    }
  }

  /**
   * Gerar range de mesas (helper endpoint)
   * POST /api/v1/restaurants/:restaurant_id/tables/generate
   */
  async generateRange(req, res, next) {
    try {
      const { restaurant_id } = req.params;
      const { start_number, end_number, capacity = 4 } = req.body;

      // Verificar se o restaurante existe
      await Restaurant.findById(restaurant_id);

      if (!start_number || !end_number || start_number > end_number) {
        throw new AppError('Números inicial e final são obrigatórios e válidos', 400);
      }

      if (end_number - start_number > 100) {
        throw new AppError('Máximo de 100 mesas por vez', 400);
      }

      // Gerar array de números
      const tableNumbers = [];
      for (let i = start_number; i <= end_number; i++) {
        tableNumbers.push(i);
      }

      const result = await Table.createBatch(restaurant_id, tableNumbers);

      return ApiResponse.success(
        res, 
        {
          ...result,
          range: `${start_number}-${end_number}`,
          capacity_per_table: capacity
        }, 
        `Mesas ${start_number}-${end_number} processadas com sucesso`, 
        201
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TableController();