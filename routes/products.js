const express = require('express');
const router = express.Router();

const ProductController = require('../controllers/productController');
const {
  validateCreate,
  validateUpdate,
  validateDuplicate,
  validatePromotion,
  validateMoveCategory,
  validateQuery,
  validateId,
  validateUuid
} = require('../validators/productValidator');

/**
 * @route GET /api/v1/products/promotions
 * @desc Buscar produtos em promoção
 * @access Public
 */
router.get('/promotions', validateQuery, ProductController.promotions);

/**
 * @route GET /api/v1/products/stats
 * @desc Obter estatísticas dos produtos
 * @access Public
 */
router.get('/stats', validateQuery, ProductController.stats);

/**
 * @route GET /api/v1/products/search
 * @desc Buscar produtos por nome ou descrição
 * @access Public
 * @param {string} q - Termo de busca (query parameter)
 */
router.get('/search', validateQuery, ProductController.search);

/**
 * @route GET /api/v1/products/uuid/:uuid
 * @desc Buscar produto por UUID
 * @access Public
 */
router.get('/uuid/:uuid', validateUuid, ProductController.showByUuid);

/**
 * @route GET /api/v1/products
 * @desc Listar todos os produtos com filtros e paginação
 * @access Public
 */
router.get('/', validateQuery, ProductController.index);

/**
 * @route POST /api/v1/products
 * @desc Criar novo produto
 * @access Public
 */
router.post('/', validateCreate, ProductController.store);

/**
 * @route HEAD /api/v1/products/:id
 * @desc Verificar se produto existe
 * @access Public
 */
router.head('/:id', validateId, ProductController.exists);

/**
 * @route GET /api/v1/products/:id
 * @desc Buscar produto por ID
 * @access Public
 */
router.get('/:id', validateId, ProductController.show);

/**
 * @route PUT /api/v1/products/:id
 * @desc Atualizar produto
 * @access Public
 */
router.put('/:id', validateId, validateUpdate, ProductController.update);

/**
 * @route DELETE /api/v1/products/:id
 * @desc Indisponibilizar produto (soft delete)
 * @access Public
 */
router.delete('/:id', validateId, ProductController.destroy);

/**
 * @route DELETE /api/v1/products/:id/hard
 * @desc Deletar produto permanentemente
 * @access Public
 */
router.delete('/:id/hard', validateId, ProductController.hardDestroy);

/**
 * @route PATCH /api/v1/products/:id/reactivate
 * @desc Reativar produto
 * @access Public
 */
router.patch('/:id/reactivate', validateId, ProductController.reactivate);

/**
 * @route PATCH /api/v1/products/:id/promotion
 * @desc Aplicar/remover promoção do produto
 * @access Public
 */
router.patch('/:id/promotion', validateId, validatePromotion, ProductController.togglePromotion);

/**
 * @route POST /api/v1/products/:id/duplicate
 * @desc Duplicar produto
 * @access Public
 */
router.post('/:id/duplicate', validateId, validateDuplicate, ProductController.duplicate);

/**
 * @route PATCH /api/v1/products/:id/move
 * @desc Mover produto para outra categoria
 * @access Public
 */
router.patch('/:id/move', validateId, validateMoveCategory, ProductController.moveToCategory);

module.exports = router;