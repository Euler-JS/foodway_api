const express = require('express');
const router = express.Router({ mergeParams: true });

const UserController = require('../controllers/userController');
const { 
  authenticate, 
  requireRestaurantAccess,
  requireUserManagement,
  logActivity 
} = require('../middleware/authMiddleware');
const {
  validateCreate,
  validateRestaurantParam
} = require('../validators/userValidator');

/**
 * Rotas aninhadas para usuários de restaurantes
 * Base: /api/v1/restaurants/:restaurant_id/users
 */

/**
 * @route GET /api/v1/restaurants/:restaurant_id/users
 * @desc Listar usuários do restaurante
 * @access Private (Restaurant Access)
 */
router.get('/', 
  authenticate,
  validateRestaurantParam,
  requireRestaurantAccess(),
  UserController.indexByRestaurant
);

/**
 * @route POST /api/v1/restaurants/:restaurant_id/users
 * @desc Criar usuário para o restaurante
 * @access Private (Super Admin)
 */
router.post('/', 
  authenticate,
  validateRestaurantParam,
  requireUserManagement,
  validateCreate,
  logActivity('create_restaurant_user', 'user'),
  UserController.storeForRestaurant
);

module.exports = router;