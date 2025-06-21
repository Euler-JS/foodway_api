const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/authMiddleware');

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas principais
router.get('/', orderController.index);
router.get('/stats', orderController.stats);
router.get('/kitchen', orderController.kitchen);
router.get('/:id', orderController.show);
router.post('/', orderController.store);
router.patch('/:id/status', orderController.updateStatus);

module.exports = router;