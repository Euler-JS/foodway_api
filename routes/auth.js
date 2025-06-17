const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, optionalAuthenticate } = require('../middleware/authMiddleware');
const { logActivity } = require('../middleware/authMiddleware');
const { 
  validateLogin, 
  validateRefresh, 
  validateForgotPassword, 
  validateResetPassword, 
  validateChangePassword 
} = require('../validators/authValidator');

// Rotas públicas (sem autenticação)
router.post('/login', validateLogin, logActivity('login', 'user'), authController.login);
router.post('/refresh', validateRefresh, authController.refresh);
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);
router.post('/reset-password', validateResetPassword, authController.resetPassword);
router.get('/status', authController.status);

// Rotas que requerem autenticação
router.post('/logout', optionalAuthenticate, logActivity('logout', 'user'), authController.logout);
router.post('/logout-all', authenticate, logActivity('logout_all', 'user'), authController.logoutAll);
router.get('/me', authenticate, authController.me);
router.post('/change-password', authenticate, validateChangePassword, logActivity('change_password', 'user'), authController.changePassword);

module.exports = router;