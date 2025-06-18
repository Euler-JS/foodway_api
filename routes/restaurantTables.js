const express = require('express');
const router = express.Router({ mergeParams: true });

const TableController = require('../controllers/tableController');
const { 
  authenticate, 
  requireRestaurantAccess,
  logActivity 
} = require('../middleware/authMiddleware');
const {
  validateCreate,
  validateBatchCreate,
  validateGenerateRange,
  validateQuery,
  validateRestaurantParam,
  validateTableParam
} = require('../validators/tableValidator');

/**
 * Rotas aninhadas para mesas de restaurantes
 * Base: /api/v1/restaurants/:restaurant_id/tables
 */

/**
 * @route GET /api/v1/restaurants/:restaurant_id/tables/stats
 * @desc Obter estatísticas das mesas do restaurante
 * @access Private (Restaurant Access)
 */
router.get('/stats', 
  authenticate,
  validateRestaurantParam,
  requireRestaurantAccess(),
  TableController.statsByRestaurant
);

/**
 * @route POST /api/v1/restaurants/:restaurant_id/tables/batch
 * @desc Criar múltiplas mesas em lote
 * @access Private (Restaurant Access)
 */
router.post('/batch', 
  authenticate,
  validateRestaurantParam,
  requireRestaurantAccess(),
  validateBatchCreate,
  logActivity('create_tables_batch', 'table'),
  TableController.createBatch
);

/**
 * @route POST /api/v1/restaurants/:restaurant_id/tables/generate
 * @desc Gerar range de mesas (ex: 1-20)
 * @access Private (Restaurant Access)
 */
router.post('/generate', 
  authenticate,
  validateRestaurantParam,
  requireRestaurantAccess(),
  validateGenerateRange,
  logActivity('generate_tables_range', 'table'),
  TableController.generateRange
);

/**
 * @route GET /api/v1/restaurants/:restaurant_id/tables/number/:table_number
 * @desc Buscar mesa por restaurante e número
 * @access Private (Restaurant Access)
 */
router.get('/number/:table_number', 
  authenticate,
  validateTableParam,
  requireRestaurantAccess(),
  TableController.showByRestaurantAndNumber
);

/**
 * @route GET /api/v1/restaurants/:restaurant_id/tables
 * @desc Listar mesas do restaurante
 * @access Private (Restaurant Access)
 */
router.get('/', 
  authenticate,
  validateRestaurantParam,
  requireRestaurantAccess(),
  validateQuery,
  TableController.indexByRestaurant
);

/**
 * @route POST /api/v1/restaurants/:restaurant_id/tables
 * @desc Criar mesa para o restaurante
 * @access Private (Restaurant Access)
 */
router.post('/', 
  authenticate,
  validateRestaurantParam,
  requireRestaurantAccess(),
  validateCreate,
  logActivity('create_restaurant_table', 'table'),
  TableController.storeForRestaurant
);

module.exports = router;