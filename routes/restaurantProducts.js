const express = require('express');
const router = express.Router({ mergeParams: true });

const ProductController = require('../controllers/productController');
const {
  validateQuery,
  validateRestaurantParam
} = require('../validators/productValidator');

/**
 * Rotas aninhadas para produtos de restaurantes
 * Base: /api/v1/restaurants/:restaurant_id/products
 */

/**
 * @route GET /api/v1/restaurants/:restaurant_id/products/promotions
 * @desc Buscar produtos em promoção do restaurante
 * @access Public
 */
router.get('/promotions', validateRestaurantParam, validateQuery, ProductController.promotionsByRestaurant);

/**
 * @route GET /api/v1/restaurants/:restaurant_id/products/stats
 * @desc Obter estatísticas dos produtos do restaurante
 * @access Public
 */
router.get('/stats', validateRestaurantParam, ProductController.statsByRestaurant);

/**
 * @route GET /api/v1/restaurants/:restaurant_id/products
 * @desc Listar produtos do restaurante
 * @access Public
 */
router.get('/', validateRestaurantParam, validateQuery, ProductController.indexByRestaurant);

module.exports = router;