const express = require('express');
const router = express.Router();

const TableController = require('../controllers/tableController');
const { 
  authenticate, 
  requireRestaurantAccess,
  logActivity 
} = require('../middleware/authMiddleware');
const {
  validateCreate,
  validateUpdate,
  validateBatchCreate,
  validateGenerateRange,
  validateQuery,
  validateId
} = require('../validators/tableValidator');

/**
 * @route GET /api/v1/tables/stats
 * @desc Obter estatísticas das mesas
 * @access Private
 */
router.get('/stats', 
  authenticate,
  validateQuery,
  TableController.stats
);

/**
 * @route GET /api/v1/tables
 * @desc Listar todas as mesas com filtros e paginação
 * @access Private
 */
router.get('/', 
  authenticate,
  validateQuery,
  TableController.index
);

/**
 * @route POST /api/v1/tables
 * @desc Criar nova mesa
 * @access Private
 */
router.post('/', 
  authenticate,
  validateCreate,
  logActivity('create_table', 'table'),
  TableController.store
);

/**
 * @route HEAD /api/v1/tables/:id
 * @desc Verificar se mesa existe
 * @access Private
 */
router.head('/:id', 
  authenticate,
  validateId,
  TableController.exists
);

/**
 * @route GET /api/v1/tables/:id
 * @desc Buscar mesa por ID
 * @access Private
 */
router.get('/:id', 
  authenticate,
  validateId,
  TableController.show
);

/**
 * @route PUT /api/v1/tables/:id
 * @desc Atualizar mesa
 * @access Private
 */
router.put('/:id', 
  authenticate,
  validateId,
  validateUpdate,
  logActivity('update_table', 'table'),
  TableController.update
);

/**
 * @route DELETE /api/v1/tables/:id
 * @desc Inativar mesa (soft delete)
 * @access Private
 */
router.delete('/:id', 
  authenticate,
  validateId,
  logActivity('delete_table', 'table'),
  TableController.destroy
);

/**
 * @route DELETE /api/v1/tables/:id/hard
 * @desc Deletar mesa permanentemente
 * @access Private
 */
router.delete('/:id/hard', 
  authenticate,
  validateId,
  logActivity('hard_delete_table', 'table'),
  TableController.hardDestroy
);

/**
 * @route PATCH /api/v1/tables/:id/reactivate
 * @desc Reativar mesa
 * @access Private
 */
router.patch('/:id/reactivate', 
  authenticate,
  validateId,
  logActivity('reactivate_table', 'table'),
  TableController.reactivate
);

module.exports = router;