const express = require('express');
const router = express.Router();

const RestaurantController = require('../controllers/restaurantController');
const {
  validateCreate,
  validateUpdate,
  validateQuery,
  validateId,
  validateUuid
} = require('../validators/restaurantValidator');

/**
 * @route GET /api/v1/restaurants/stats
 * @desc Obter estatísticas dos restaurantes
 * @access Public
 */
router.get('/stats', RestaurantController.stats);

/**
 * @route GET /api/v1/restaurants/search
 * @desc Buscar restaurantes por nome ou descrição
 * @access Public
 * @param {string} q - Termo de busca (query parameter)
 */
router.get('/search', validateQuery, RestaurantController.search);

/**
 * @route GET /api/v1/restaurants/city/:city
 * @desc Buscar restaurantes por cidade
 * @access Public
 */
router.get('/city/:city', validateQuery, RestaurantController.findByCity);

/**
 * @route GET /api/v1/restaurants/uuid/:uuid
 * @desc Buscar restaurante por UUID
 * @access Public
 */
router.get('/uuid/:uuid', validateUuid, RestaurantController.showByUuid);

/**
 * @route GET /api/v1/restaurants
 * @desc Listar todos os restaurantes com filtros e paginação
 * @access Public
 */
router.get('/', validateQuery, RestaurantController.index);

/**
 * @route POST /api/v1/restaurants
 * @desc Criar novo restaurante
 * @access Public
 */
router.post('/', validateCreate, RestaurantController.store);

/**
 * @route GET /api/v1/restaurants/:id
 * @desc Buscar restaurante por ID
 * @access Public
 */
router.get('/:id', validateId, RestaurantController.show);

/**
 * @route PUT /api/v1/restaurants/:id
 * @desc Atualizar restaurante
 * @access Public
 */
router.put('/:id', validateId, validateUpdate, RestaurantController.update);

/**
 * @route DELETE /api/v1/restaurants/:id
 * @desc Inativar restaurante (soft delete)
 * @access Public
 */
router.delete('/:id', validateId, RestaurantController.destroy);

/**
 * @route DELETE /api/v1/restaurants/:id/hard
 * @desc Deletar restaurante permanentemente
 * @access Public
 */
router.delete('/:id/hard', validateId, RestaurantController.hardDestroy);

/**
 * @route PATCH /api/v1/restaurants/:id/reactivate
 * @desc Reativar restaurante
 * @access Public
 */
router.patch('/:id/reactivate', validateId, RestaurantController.reactivate);

module.exports = router;