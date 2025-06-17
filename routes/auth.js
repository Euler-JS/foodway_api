const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/authController');
const { authenticate, optionalAuthenticate, logActivity } = require('../middleware/authMiddleware');
const {
  validateLogin,
  validateRefresh,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword
} = require('../validators/authValidator');

/**
 * @route POST /api/v1/auth/login
 * @desc Login do usuário
 * @access Public
 */
router.post('/login', 
  validateLogin,
  logActivity('login', 'user'),
  AuthController.login
);

/**
 * @route POST /api/v1/auth/logout
 * @desc Logout do usuário
 * @access Private
 */
router.post('/logout', 
  authenticate,
  logActivity('logout', 'user'),
  AuthController.logout
);

/**
 * @route POST /api/v1/auth/logout-all
 * @desc Logout de todos os dispositivos
 * @access Private
 */
router.post('/logout-all', 
  authenticate,
  logActivity('logout_all', 'user'),
  AuthController.logoutAll
);

/**
 * @route POST /api/v1/auth/refresh
 * @desc Renovar tokens de acesso
 * @access Public
 */
router.post('/refresh', 
  validateRefresh,
  AuthController.refresh
);

/**
 * @route GET /api/v1/auth/me
 * @desc Obter dados do usuário autenticado
 * @access Private
 */
router.get('/me', 
  authenticate,
  AuthController.me
);

/**
 * @route GET /api/v1/auth/status
 * @desc Verificar status da autenticação
 * @access Public
 */
router.get('/status', 
  optionalAuthenticate,
  AuthController.status
);

/**
 * @route POST /api/v1/auth/forgot-password
 * @desc Solicitar reset de senha
 * @access Public
 */
router.post('/forgot-password', 
  validateForgotPassword,
  AuthController.forgotPassword
);

/**
 * @route POST /api/v1/auth/reset-password
 * @desc Redefinir senha
 * @access Public
 */
router.post('/reset-password', 
  validateResetPassword,
  logActivity('reset_password', 'user'),
  AuthController.resetPassword
);

/**
 * @route POST /api/v1/auth/change-password
 * @desc Alterar senha do usuário logado
 * @access Private
 */
router.post('/change-password', 
  authenticate,
  validateChangePassword,
  logActivity('change_password', 'user'),
  AuthController.changePassword
);

module.exports = router;