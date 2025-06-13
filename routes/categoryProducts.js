const express = require('express');
const router = express.Router({ mergeParams: true });

const ProductController = require('../controllers/productController');
const {
  validateCreate,
  validateReorder,
  validateQuery,
  validateCategoryParam
} = require('../validators/productValidator');

/**
 * Rotas aninhadas para produtos de categorias
 * Base: /api/v1/categories/:category_id/products
 */

/**
 * @route GET /api/v1/categories/:category_id/products/stats
 * @desc Obter estatísticas dos produtos da categoria
 * @access Public
 */
router.get('/stats', validateCategoryParam, ProductController.statsByCategory);

/**
 * @route PUT /api/v1/categories/:category_id/products/reorder
 * @desc Reordenar produtos da categoria
 * @access Public
 */
router.put('/reorder', validateCategoryParam, validateReorder, ProductController.reorder);

/**
 * @route GET /api/v1/categories/:category_id/products
 * @desc Listar produtos da categoria
 * @access Public
 */
router.get('/', validateCategoryParam, validateQuery, ProductController.indexByCategory);

/**
 * @route POST /api/v1/categories/:category_id/products
 * @desc Criar produto para a categoria
 * @access Public
 */
router.post('/', validateCategoryParam, validateCreate, ProductController.storeForCategory);

module.exports = router;