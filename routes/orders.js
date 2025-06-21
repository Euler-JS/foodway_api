const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/authMiddleware');

const { supabase } = require('../config/supabase');

// POST /api/v1/orders - Criar pedido
router.post('/', async (req, res) => {
  try {
    const { 
      restaurant_id, 
      table_number, 
      customer_name, 
      customer_phone, 
      customer_email, 
      notes, 
      items, 
      total_amount 
    } = req.body;

    // Validações básicas
    if (!restaurant_id || !customer_name || !customer_phone || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Dados obrigatórios: restaurant_id, customer_name, customer_phone, items'
      });
    }

    // Gerar número do pedido
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const orderNumber = `${restaurant_id}-${today}-${Date.now().toString().slice(-4)}`;

    // Buscar table_id se table_number fornecido
    let table_id = null;
    if (table_number) {
      const { data: tableData, error: tableError } = await supabase
        .from('tables')
        .select('id')
        .eq('restaurant_id', restaurant_id)
        .eq('table_number', table_number)
        .single();
      
      if (tableError) {
        console.error('Erro ao buscar mesa:', tableError);
        return res.status(400).json({
          success: false,
          message: 'Mesa não encontrada'
        });
      }
      
      table_id = tableData?.id || null;
    }

    // Criar pedido - removendo table_number dos dados inseridos
    const orderData = {
      restaurant_id: parseInt(restaurant_id),
      customer_name,
      customer_phone,
      customer_email,
      notes,
      total_amount: parseFloat(total_amount),
      subtotal: parseFloat(total_amount),
      order_number: orderNumber,
      status: 'pending'
    };

    // Só adicionar table_id se foi encontrado
    if (table_id) {
      orderData.table_id = table_id;
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError) {
      console.error('Erro ao criar pedido:', orderError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar pedido',
        error: orderError.message
      });
    }

    // Criar itens do pedido
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: parseInt(item.product_id),
      quantity: parseInt(item.quantity),
      unit_price: parseFloat(item.unit_price),
      total_price: parseInt(item.quantity) * parseFloat(item.unit_price)
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Erro ao criar itens:', itemsError);
      // Tentar deletar o pedido criado
      await supabase.from('orders').delete().eq('id', order.id);
      
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar itens do pedido',
        error: itemsError.message
      });
    }

    res.status(201).json({
      success: true,
      data: {
        id: order.id,
        uuid: order.uuid,
        order_number: order.order_number,
        status: order.status,
        total_amount: order.total_amount,
        table_id: order.table_id
      },
      message: 'Pedido criado com sucesso'
    });

  } catch (error) {
    console.error('Erro no endpoint de pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Todas as rotas requerem autenticação (exceto a POST acima)
router.use(authenticate);

// Rotas principais
router.get('/', orderController.index);
router.get('/stats', orderController.stats);
router.get('/kitchen', orderController.kitchen);
router.get('/:id', orderController.show);
router.patch('/:id/status', orderController.updateStatus);

module.exports = router;