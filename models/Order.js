const { supabase } = require('../config/supabase');
const { handleSupabaseError, NotFoundError } = require('../utils/errors');

class Order {
  constructor() {
    this.table = 'orders';
    this.itemsTable = 'order_items';
  }

  /**
   * Criar novo pedido
   */
  async create(orderData, items) {
    try {
      // Começar transação
      const { data: order, error: orderError } = await supabase
        .from(this.table)
        .insert([{
          ...orderData,
          order_number: await this.generateOrderNumber(orderData.restaurant_id)
        }])
        .select(`
          *,
          restaurant:restaurants(name),
          table:tables(table_number, name)
        `)
        .single();

      if (orderError) throw handleSupabaseError(orderError);

      // Adicionar itens
      if (items && items.length > 0) {
        const orderItems = items.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
          notes: item.notes || null
        }));

        const { error: itemsError } = await supabase
          .from(this.itemsTable)
          .insert(orderItems);

        if (itemsError) throw handleSupabaseError(itemsError);
      }

      return await this.findById(order.id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar pedido por ID com itens
   */
  async findById(id) {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select(`
          *,
          restaurant:restaurants(id, name),
          table:tables(id, table_number, name),
          items:order_items(
            *,
            product:products(id, name, image_url)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError('Pedido não encontrado');
        }
        throw handleSupabaseError(error);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Listar pedidos com filtros
   */
  async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        restaurantId = null,
        tableId = null,
        status = null,
        startDate = null,
        endDate = null,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = options;

      let query = supabase
        .from(this.table)
        .select(`
          *,
          restaurant:restaurants(name),
          table:tables(table_number, name),
          items:order_items(
            quantity,
            total_price,
            product:products(name)
          )
        `, { count: 'exact' })
        .order(sortBy, { ascending: sortOrder === 'asc' });

      // Filtros
      if (restaurantId) query = query.eq('restaurant_id', restaurantId);
      if (tableId) query = query.eq('table_id', tableId);
      if (status) {
        if (Array.isArray(status)) {
          query = query.in('status', status);  // Para arrays: ['confirmed', 'preparing']
        } else {
          query = query.eq('status', status);  // Para strings: 'pending'
        }
      }
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);

      // Paginação
      const from = (page - 1) * limit;
      query = query.range(from, from + limit - 1);

      const { data, error, count } = await query;

      if (error) throw handleSupabaseError(error);

      return {
        data: data || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualizar status do pedido
   */
  async updateStatus(id, status, userId = null) {
    try {
      const updateData = { status };
      
      // Adicionar timestamp específico
      if (status === 'confirmed') updateData.confirmed_at = new Date().toISOString();
      if (status === 'ready') updateData.ready_at = new Date().toISOString();
      if (status === 'delivered') updateData.delivered_at = new Date().toISOString();

      const { data, error } = await supabase
        .from(this.table)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw handleSupabaseError(error);

      // Log da atividade (opcional)
      if (userId) {
        await this.logOrderActivity(id, `Status alterado para: ${status}`, userId);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gerar número do pedido
   */
  async generateOrderNumber(restaurantId) {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    const { data } = await supabase
      .from(this.table)
      .select('order_number')
      .eq('restaurant_id', restaurantId)
      .like('order_number', `${restaurantId}-${today}-%`)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastNumber = data && data.length > 0 
      ? parseInt(data[0].order_number.split('-').pop()) || 0
      : 0;

    return `${restaurantId}-${today}-${String(lastNumber + 1).padStart(3, '0')}`;
  }

  /**
   * Estatísticas de pedidos
   */
  async getStats(restaurantId = null, period = 'today') {
    try {
      let dateFilter = new Date();
      
      if (period === 'today') {
        dateFilter.setHours(0, 0, 0, 0);
      } else if (period === 'week') {
        dateFilter.setDate(dateFilter.getDate() - 7);
      } else if (period === 'month') {
        dateFilter.setMonth(dateFilter.getMonth() - 1);
      }

      let query = supabase
        .from(this.table)
        .select('status, total_amount')
        .gte('created_at', dateFilter.toISOString());

      if (restaurantId) {
        query = query.eq('restaurant_id', restaurantId);
      }

      const { data, error } = await query;
      if (error) throw handleSupabaseError(error);

      const stats = {
        total_orders: data.length,
        pending: data.filter(o => o.status === 'pending').length,
        confirmed: data.filter(o => o.status === 'confirmed').length,
        preparing: data.filter(o => o.status === 'preparing').length,
        ready: data.filter(o => o.status === 'ready').length,
        delivered: data.filter(o => o.status === 'delivered').length,
        cancelled: data.filter(o => o.status === 'cancelled').length,
        total_revenue: data
          .filter(o => o.status === 'delivered')
          .reduce((sum, o) => sum + parseFloat(o.total_amount), 0)
      };

      return stats;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Log de atividades do pedido
   */
  async logOrderActivity(orderId, activity, userId) {
    try {
      await supabase
        .from('order_activities')
        .insert([{
          order_id: orderId,
          activity,
          user_id: userId,
          created_at: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Erro ao registrar atividade:', error);
    }
  }
}

module.exports = new Order();
