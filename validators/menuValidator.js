const Joi = require('joi');

/**
 * Validadores para operações de menu
 */

const restaurantParamSchema = Joi.object({
  restaurant_id: Joi.alternatives()
    .try(
      Joi.number().integer().positive(),
      Joi.string().guid({ version: 'uuidv4' })
    )
    .required()
    .messages({
      'alternatives.match': 'ID do restaurante deve ser um número positivo ou UUID válido',
      'any.required': 'ID do restaurante é obrigatório'
    })
});

const categoryParamSchema = Joi.object({
  restaurant_id: Joi.alternatives()
    .try(
      Joi.number().integer().positive(),
      Joi.string().guid({ version: 'uuidv4' })
    )
    .required()
    .messages({
      'alternatives.match': 'ID do restaurante deve ser um número positivo ou UUID válido',
      'any.required': 'ID do restaurante é obrigatório'
    }),

  category_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID da categoria deve ser um número',
      'number.integer': 'ID da categoria deve ser um número inteiro',
      'number.positive': 'ID da categoria deve ser um número positivo',
      'any.required': 'ID da categoria é obrigatório'
    })
});

const productParamSchema = Joi.object({
  restaurant_id: Joi.alternatives()
    .try(
      Joi.number().integer().positive(),
      Joi.string().guid({ version: 'uuidv4' })
    )
    .required()
    .messages({
      'alternatives.match': 'ID do restaurante deve ser um número positivo ou UUID válido',
      'any.required': 'ID do restaurante é obrigatório'
    }),

  product_id: Joi.alternatives()
    .try(
      Joi.number().integer().positive(),
      Joi.string().guid({ version: 'uuidv4' })
    )
    .required()
    .messages({
      'alternatives.match': 'ID do produto deve ser um número positivo ou UUID válido',
      'any.required': 'ID do produto é obrigatório'
    })
});

const menuQuerySchema = Joi.object({
  include_inactive: Joi.boolean()
    .optional()
    .default(false)
    .messages({
      'boolean.base': 'include_inactive deve ser verdadeiro ou falso'
    }),

  include_unavailable: Joi.boolean()
    .optional()
    .default(false)
    .messages({
      'boolean.base': 'include_unavailable deve ser verdadeiro ou falso'
    }),

  category_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'ID da categoria deve ser um número',
      'number.integer': 'ID da categoria deve ser um número inteiro',
      'number.positive': 'ID da categoria deve ser um número positivo'
    })
});

/**
 * Middleware de validação
 * @param {Object} schema - Schema Joi para validação
 * @param {string} property - Propriedade do request a ser validada (body, params, query)
 * @returns {Function} - Middleware do Express
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(422).json({
        success: false,
        message: 'Erro de validação',
        errors,
        timestamp: new Date().toISOString()
      });
    }

    // Substituir os valores originais pelos validados
    req[property] = value;
    next();
  };
};

/**
 * Middleware para converter string para número quando necessário
 */
const convertRestaurantId = (req, res, next) => {
  const { restaurant_id } = req.params;
  
  // Se é um número em string, converter para number
  if (restaurant_id && !restaurant_id.includes('-') && !isNaN(restaurant_id)) {
    req.params.restaurant_id = parseInt(restaurant_id);
  }
  
  next();
};

/**
 * Middleware para converter IDs de produtos
 */
const convertProductId = (req, res, next) => {
  const { product_id } = req.params;
  
  // Se é um número em string, converter para number
  if (product_id && !product_id.includes('-') && !isNaN(product_id)) {
    req.params.product_id = parseInt(product_id);
  }
  
  next();
};

module.exports = {
  restaurantParamSchema,
  categoryParamSchema,
  productParamSchema,
  menuQuerySchema,
  validate,
  convertRestaurantId,
  convertProductId,
  
  // Middlewares prontos para uso
  validateRestaurantParam: [convertRestaurantId, validate(restaurantParamSchema, 'params')],
  validateCategoryParam: [convertRestaurantId, validate(categoryParamSchema, 'params')],
  validateProductParam: [convertRestaurantId, convertProductId, validate(productParamSchema, 'params')],
  validateMenuQuery: validate(menuQuerySchema, 'query')
};