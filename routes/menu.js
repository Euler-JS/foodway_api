const express = require('express');
const router = express.Router();

const MenuController = require('../controllers/menuController');
const {
  validateRestaurantParam,
  validateCategoryParam,
  validateProductParam,
  validateMenuQuery
} = require('../validators/menuValidator');

/**
 * ROTAS COMPATÍVEIS COM O FLUTTER (formato original)
 */

/**
 * @route GET /api/v1/menu/restaurant/:restaurant_id
 * @desc Buscar menu completo para o Flutter (formato original)
 * @access Public
 * @param {number|string} restaurant_id - ID ou UUID do restaurante
 */
router.get('/restaurant/:restaurant_id', validateRestaurantParam, MenuController.getMenuForFlutter);

/**
 * @route GET /api/v1/menu/restaurant/:restaurant_id/item/:product_id
 * @desc Buscar item específico para o Flutter
 * @access Public
 * @param {number|string} restaurant_id - ID ou UUID do restaurante
 * @param {number|string} product_id - ID ou UUID do produto
 */
router.get('/restaurant/:restaurant_id/item/:product_id', validateProductParam, MenuController.getMenuItemForFlutter);

/**
 * ROTAS ADMINISTRATIVAS E AVANÇADAS
 */

/**
 * @route GET /api/v1/menu/:restaurant_id/stats
 * @desc Buscar estatísticas do menu
 * @access Public
 * @param {number|string} restaurant_id - ID ou UUID do restaurante
 */
router.get('/:restaurant_id/stats', validateRestaurantParam, MenuController.getMenuStats);

/**
 * @route GET /api/v1/menu/:restaurant_id/promotions
 * @desc Buscar produtos em promoção
 * @access Public
 * @param {number|string} restaurant_id - ID ou UUID do restaurante
 */
router.get('/:restaurant_id/promotions', validateRestaurantParam, MenuController.getPromotions);

/**
 * @route GET /api/v1/menu/:restaurant_id/categories
 * @desc Buscar categorias do menu (sem produtos)
 * @access Public
 * @param {number|string} restaurant_id - ID ou UUID do restaurante
 */
router.get('/:restaurant_id/categories', validateRestaurantParam, MenuController.getMenuCategories);

/**
 * @route GET /api/v1/menu/:restaurant_id/categories/:category_id/products
 * @desc Buscar produtos de uma categoria específica
 * @access Public
 * @param {number|string} restaurant_id - ID ou UUID do restaurante
 * @param {number} category_id - ID da categoria
 */
router.get('/:restaurant_id/categories/:category_id/products', validateCategoryParam, MenuController.getCategoryProducts);

/**
 * @route GET /api/v1/menu/:restaurant_id/category/:category_id
 * @desc Buscar menu por categoria específica
 * @access Public
 * @param {number|string} restaurant_id - ID ou UUID do restaurante
 * @param {number} category_id - ID da categoria
 */
router.get('/:restaurant_id/category/:category_id', validateCategoryParam, MenuController.getMenuByCategory);

/**
 * @route GET /api/v1/menu/:restaurant_id/item/:product_id
 * @desc Buscar item específico do menu
 * @access Public
 * @param {number|string} restaurant_id - ID ou UUID do restaurante
 * @param {number|string} product_id - ID ou UUID do produto
 */
router.get('/:restaurant_id/item/:product_id', validateProductParam, MenuController.getMenuItem);

/**
 * @route GET /api/v1/menu/:restaurant_id
 * @desc Buscar menu completo de um restaurante
 * @access Public
 * @param {number|string} restaurant_id - ID ou UUID do restaurante
 * @query {boolean} include_inactive - Incluir categorias inativas
 * @query {boolean} include_unavailable - Incluir produtos indisponíveis
 * @query {number} category_id - Filtrar por categoria específica
 */
router.get('/:restaurant_id', validateRestaurantParam, validateMenuQuery, MenuController.getCompleteMenu);

module.exports = router;