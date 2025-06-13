const express = require('express');
const router = express.Router();

const CategoryController = require('../controllers/categoryController');
const {
  validateCreate,
  validateUpdate,
  validateDuplicate,
  validateReorder,
  validateQuery,
  validateRestaurantParam,
  validateId,
  validateUuid
} = require('../validators/categoryValidator');

/**
 * @route GET /api/v1/categories/stats
 * @desc Obter estatísticas das categorias
 * @access Public
 */
router.get('/stats', validateQuery, CategoryController.stats);

/**
 * @route GET /api/v1/categories/search
 * @desc Buscar categorias por nome ou descrição
 * @access Public
 * @param {string} q - Termo de busca (query parameter)
 */
router.get('/search', validateQuery, CategoryController.search);

/**
 * @route GET /api/v1/categories/uuid/:uuid
 * @desc Buscar categoria por UUID
 * @access Public
 */
router.get('/uuid/:uuid', validateUuid, CategoryController.showByUuid);

/**
 * @route GET /api/v1/categories
 * @desc Listar todas as categorias com filtros e paginação
 * @access Public
 */
router.get('/', validateQuery, CategoryController.index);

/**
 * @route POST /api/v1/categories
 * @desc Criar nova categoria
 * @access Public
 */
router.post('/', validateCreate, CategoryController.store);

/**
 * @route HEAD /api/v1/categories/:id
 * @desc Verificar se categoria existe
 * @access Public
 */
router.head('/:id', validateId, CategoryController.exists);

/**
 * @route GET /api/v1/categories/:id
 * @desc Buscar categoria por ID
 * @access Public
 */
router.get('/:id', validateId, CategoryController.show);

/**
 * @route PUT /api/v1/categories/:id
 * @desc Atualizar categoria
 * @access Public
 */
router.put('/:id', validateId, validateUpdate, CategoryController.update);

/**
 * @route DELETE /api/v1/categories/:id
 * @desc Inativar categoria (soft delete)
 * @access Public
 */
router.delete('/:id', validateId, CategoryController.destroy);

/**
 * @route DELETE /api/v1/categories/:id/hard
 * @desc Deletar categoria permanentemente
 * @access Public
 */
router.delete('/:id/hard', validateId, CategoryController.hardDestroy);

/**
 * @route PATCH /api/v1/categories/:id/reactivate
 * @desc Reativar categoria
 * @access Public
 */
router.patch('/:id/reactivate', validateId, CategoryController.reactivate);

/**
 * @route POST /api/v1/categories/:id/duplicate
 * @desc Duplicar categoria
 * @access Public
 */
router.post('/:id/duplicate', validateId, validateDuplicate, CategoryController.duplicate);

module.exports = router;