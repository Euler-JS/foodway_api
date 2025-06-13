const express = require('express');
const router = express.Router({ mergeParams: true });

const CategoryController = require('../controllers/categoryController');
const {
  validateCreate,
  validateReorder,
  validateQuery,
  validateRestaurantParam
} = require('../validators/categoryValidator');

/**
 * Rotas aninhadas para categorias de restaurantes
 * Base: /api/v1/restaurants/:restaurant_id/categories
 */

/**
 * @route GET /api/v1/restaurants/:restaurant_id/categories/stats
 * @desc Obter estatísticas das categorias do restaurante
 * @access Public
 */
router.get('/stats', validateRestaurantParam, CategoryController.statsByRestaurant);

/**
 * @route GET /api/v1/restaurants/:restaurant_id/categories/search
 * @desc Buscar categorias do restaurante
 * @access Public
 * @param {string} q - Termo de busca (query parameter)
 */
router.get('/search', validateRestaurantParam, validateQuery, CategoryController.searchByRestaurant);

/**
 * @route PUT /api/v1/restaurants/:restaurant_id/categories/reorder
 * @desc Reordenar categorias do restaurante
 * @access Public
 */
router.put('/reorder', validateRestaurantParam, validateReorder, CategoryController.reorder);

/**
 * @route GET /api/v1/restaurants/:restaurant_id/categories
 * @desc Listar categorias do restaurante
 * @access Public
 */
router.get('/', validateRestaurantParam, validateQuery, CategoryController.indexByRestaurant);

/**
 * @route POST /api/v1/restaurants/:restaurant_id/categories
 * @desc Criar categoria para o restaurante
 * @access Public
 */
router.post('/', validateRestaurantParam, validateCreate, CategoryController.storeForRestaurant);

module.exports = router;