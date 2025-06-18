const express = require('express');
const router = express.Router();

const QRCodeController = require('../controllers/qrCodeController');
const { 
  authenticate, 
  requireRestaurantAccess,
  logActivity 
} = require('../middleware/authMiddleware');
const Joi = require('joi');

/**
 * Validadores específicos para QR Code
 */
const validateQRParams = (req, res, next) => {
  const schema = Joi.object({
    restaurant_id: Joi.number().integer().positive().required(),
    table_number: Joi.number().integer().positive().optional()
  });

  const { error } = schema.validate(req.params);
  if (error) {
    return res.status(422).json({
      success: false,
      message: 'Parâmetros inválidos',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  next();
};

const validateQRQuery = (req, res, next) => {
  const schema = Joi.object({
    format: Joi.string().valid('png', 'svg', 'json').optional().default('png'),
    size: Joi.number().integer().min(100).max(500).optional().default(200),
    table_numbers: Joi.string().optional(),
    type: Joi.string().valid('tables', 'restaurant').optional().default('tables'), // Nova opção
  });

  const { error, value } = schema.validate(req.query);
  if (error) {
    return res.status(422).json({
      success: false,
      message: 'Parâmetros de consulta inválidos',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  req.query = value;
  next();
};

const validateBatchQR = (req, res, next) => {
  const schema = Joi.object({
    table_numbers: Joi.array()
      .items(Joi.number().integer().positive())
      .min(1)
      .max(50)
      .required(),
    format: Joi.string().valid('png', 'svg', 'json').optional().default('json')
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(422).json({
      success: false,
      message: 'Dados inválidos',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  req.body = value;
  next();
};

/**
 * @route GET /api/v1/qr/restaurant/:restaurant_id/info
 * @desc Obter informações sobre QR Codes do restaurante
 * @access Private (Restaurant Access)
 */
router.get('/restaurant/:restaurant_id/info',
  authenticate,
  validateQRParams,
  requireRestaurantAccess('restaurant_id'),
  QRCodeController.getQRInfo
);

/**
 * @route GET /api/v1/qr/restaurant/:restaurant_id/print
 * @desc Gerar página de impressão de QR Codes
 * @access Private (Restaurant Access)
 * @query {string} table_numbers - Números de mesa separados por vírgula (opcional)
 */
router.get('/restaurant/:restaurant_id/print',
  authenticate,
  validateQRParams,
  requireRestaurantAccess('restaurant_id'),
  validateQRQuery,
  logActivity('generate_qr_print_page', 'qr_code'),
  QRCodeController.generatePrintPage
);

/**
 * @route GET /api/v1/qr/restaurant/:restaurant_id
 * @desc Gerar QR Code para o restaurante (sem mesa específica)
 * @access Private (Restaurant Access)
 * @query {string} format - Formato: png, svg, json (default: png)
 * @query {number} size - Tamanho em pixels (default: 200)
 */
router.get('/restaurant/:restaurant_id',
  authenticate,
  validateQRParams,
  requireRestaurantAccess('restaurant_id'),
  validateQRQuery,
  logActivity('generate_restaurant_qr', 'qr_code'),
  QRCodeController.generateRestaurantQR
);

/**
 * @route GET /api/v1/qr/restaurant/:restaurant_id/table/:table_number
 * @desc Gerar QR Code para mesa específica
 * @access Private (Restaurant Access)
 * @query {string} format - Formato: png, svg, json (default: png)
 * @query {number} size - Tamanho em pixels (default: 200)
 */
router.get('/restaurant/:restaurant_id/table/:table_number',
  authenticate,
  validateQRParams,
  requireRestaurantAccess('restaurant_id'),
  validateQRQuery,
  logActivity('generate_table_qr', 'qr_code'),
  QRCodeController.generateTableQR
);

/**
 * @route POST /api/v1/qr/restaurant/:restaurant_id/tables/batch
 * @desc Gerar QR Codes para múltiplas mesas
 * @access Private (Restaurant Access)
 */
router.post('/restaurant/:restaurant_id/tables/batch',
  authenticate,
  validateQRParams,
  requireRestaurantAccess('restaurant_id'),
  validateBatchQR,
  logActivity('generate_batch_table_qr', 'qr_code'),
  QRCodeController.generateBatchTableQR
);

module.exports = router;