const Order = require('../models/Order');
const ApiResponse = require('../utils/response');
const { ValidationError } = require('../utils/errors');

class OrderController {
  /**
   * Listar pedidos
   * GET /api/v1/orders
   */
  async index(req, res, next) {
    try {
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        restaurantId: req.query.restaurant_id,
        tableId: req.query.table_id,
        status: req.query.status,
        startDate: req.query.start_date,
        endDate: req.query.end_date,
        sortBy: req.query.sort_by,
        sortOrder: req.query.sort_order
      };

      // Filtrar por restaurante se for restaurant_user
      if (req.user?.role === 'restaurant_user' && req.user.restaurant_id) {
        options.restaurantId = req.user.restaurant_id;
      }

      const result = await Order.findAll(options);
      return ApiResponse.success(res, result, 'Pedidos listados com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar pedido por ID
   * GET /api/v1/orders/:id
   */
  async show(req, res, next) {
    try {
      const { id } = req.params;
      const order = await Order.findById(id);

      // Verificar permissão
      if (req.user?.role === 'restaurant_user' && 
          req.user.restaurant_id !== order.restaurant_id) {
        throw new ValidationError('Sem permissão para ver este pedido');
      }

      return ApiResponse.success(res, order, 'Pedido encontrado');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Criar novo pedido
   * POST /api/v1/orders
   */
  async store(req, res, next) {
    try {
      const { items, ...orderData } = req.body;

      if (!items || items.length === 0) {
        throw new ValidationError('Pedido deve ter pelo menos um item');
      }

      // Calcular totais
      const subtotal = items.reduce((sum, item) => 
        sum + (item.quantity * item.unit_price), 0);
      
      orderData.subtotal = subtotal;
      orderData.total_amount = subtotal; // Por enquanto sem impostos

      const order = await Order.create(orderData, items);

      return ApiResponse.success(
        res, 
        order, 
        'Pedido criado com sucesso', 
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar status do pedido
   * PATCH /api/v1/orders/:id/status
   */
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new ValidationError('Status inválido');
      }

      const order = await Order.updateStatus(id, status, req.user?.id);

      return ApiResponse.success(res, order, 'Status atualizado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Estatísticas de pedidos
   * GET /api/v1/orders/stats
   */
  async stats(req, res, next) {
    try {
      const restaurantId = req.query.restaurant_id;
      const period = req.query.period || 'today';

      // Filtrar por restaurante se for restaurant_user
      const finalRestaurantId = req.user?.role === 'restaurant_user' 
        ? req.user.restaurant_id 
        : restaurantId;

      const stats = await Order.getStats(finalRestaurantId, period);

      return ApiResponse.success(res, stats, 'Estatísticas obtidas');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Pedidos em tempo real (para cozinha)
   * GET /api/v1/orders/kitchen
   */
  async kitchen(req, res, next) {
    try {
      const restaurantId = req.user?.role === 'restaurant_user' 
        ? req.user.restaurant_id 
        : req.query.restaurant_id;

      if (!restaurantId) {
        throw new ValidationError('Restaurant ID é obrigatório');
      }

      const result = await Order.findAll({
        restaurantId,
        status: ['confirmed', 'preparing'],
        sortBy: 'created_at',
        sortOrder: 'asc',
        limit: 50
      });

      return ApiResponse.success(res, result.data, 'Pedidos da cozinha');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
