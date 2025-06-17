const express = require('express');
const router = express.Router();

const UserController = require('../controllers/userController');
const { 
  authenticate, 
  requireSuperAdmin, 
  requireUserManagement,
  requireSelfOrAdmin,
  logActivity 
} = require('../middleware/authMiddleware');
const {
  validateCreate,
  validateUpdate,
  validateUpdateMe,
  validateQuery,
  validateId
} = require('../validators/userValidator');

/**
 * @route GET /api/v1/users/stats
 * @desc Obter estatísticas dos usuários
 * @access Private (Super Admin)
 */
router.get('/stats', 
  authenticate,
  requireSuperAdmin,
  UserController.stats
);

/**
 * @route GET /api/v1/users/search
 * @desc Buscar usuários
 * @access Private
 */
router.get('/search', 
  authenticate,
  validateQuery,
  UserController.search
);

/**
 * @route GET /api/v1/users/me
 * @desc Obter perfil do usuário logado
 * @access Private
 */
router.get('/me', 
  authenticate,
  UserController.me
);

/**
 * @route PUT /api/v1/users/me
 * @desc Atualizar perfil do usuário logado
 * @access Private
 */
router.put('/me', 
  authenticate,
  validateUpdateMe,
  logActivity('update_profile', 'user'),
  UserController.updateMe
);

/**
 * @route GET /api/v1/users/:id/activities
 * @desc Listar atividades do usuário
 * @access Private (Self or Admin)
 */
router.get('/:id/activities', 
  authenticate,
  validateId,
  requireSelfOrAdmin,
  UserController.activities
);

/**
 * @route GET /api/v1/users
 * @desc Listar todos os usuários
 * @access Private (Super Admin)
 */
router.get('/', 
  authenticate,
  requireSuperAdmin,
  validateQuery,
  UserController.index
);

/**
 * @route POST /api/v1/users
 * @desc Criar novo usuário
 * @access Private (Super Admin)
 */
router.post('/', 
  authenticate,
  requireUserManagement,
  validateCreate,
  logActivity('create_user', 'user'),
  UserController.store
);

/**
 * @route HEAD /api/v1/users/:id
 * @desc Verificar se usuário existe
 * @access Private
 */
router.head('/:id', 
  authenticate,
  validateId,
  UserController.exists
);

/**
 * @route GET /api/v1/users/:id
 * @desc Buscar usuário por ID
 * @access Private (Self or Admin)
 */
router.get('/:id', 
  authenticate,
  validateId,
  requireSelfOrAdmin,
  UserController.show
);

/**
 * @route PUT /api/v1/users/:id
 * @desc Atualizar usuário
 * @access Private (Self or Admin)
 */
router.put('/:id', 
  authenticate,
  validateId,
  validateUpdate,
  requireSelfOrAdmin,
  logActivity('update_user', 'user'),
  UserController.update
);

/**
 * @route DELETE /api/v1/users/:id
 * @desc Inativar usuário
 * @access Private (Super Admin)
 */
router.delete('/:id', 
  authenticate,
  validateId,
  requireUserManagement,
  logActivity('deactivate_user', 'user'),
  UserController.destroy
);

/**
 * @route PATCH /api/v1/users/:id/reactivate
 * @desc Reativar usuário
 * @access Private (Super Admin)
 */
router.patch('/:id/reactivate', 
  authenticate,
  validateId,
  requireUserManagement,
  logActivity('reactivate_user', 'user'),
  UserController.reactivate
);

module.exports = router;