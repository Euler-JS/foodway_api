const Joi = require('joi');

/**
 * Validadores para operações de restaurante
 */

const createRestaurantSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Nome é obrigatório',
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 255 caracteres',
      'any.required': 'Nome é obrigatório'
    }),

  logo: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .default('logo_default.png')
    .messages({
      'string.max': 'URL do logo deve ter no máximo 500 caracteres'
    }),

  address: Joi.string()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Endereço deve ter no máximo 1000 caracteres'
    }),

  city: Joi.string()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Cidade deve ter no máximo 100 caracteres'
    }),

  phone: Joi.string()
    .pattern(/^[0-9+\-\s()]+$/)
    .max(20)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'Telefone deve conter apenas números e caracteres válidos',
      'string.max': 'Telefone deve ter no máximo 20 caracteres'
    }),

  email: Joi.string()
    .email()
    .max(255)
    .optional()
    .allow('')
    .messages({
      'string.email': 'Email deve ter um formato válido',
      'string.max': 'Email deve ter no máximo 255 caracteres'
    }),

  description: Joi.string()
    .max(2000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Descrição deve ter no máximo 2000 caracteres'
    }),

  is_active: Joi.boolean()
    .optional()
    .default(true)
});

const updateRestaurantSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .optional()
    .messages({
      'string.empty': 'Nome não pode estar vazio',
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 255 caracteres'
    }),

  logo: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'URL do logo deve ter no máximo 500 caracteres'
    }),

  address: Joi.string()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Endereço deve ter no máximo 1000 caracteres'
    }),

  city: Joi.string()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Cidade deve ter no máximo 100 caracteres'
    }),

  phone: Joi.string()
    .pattern(/^[0-9+\-\s()]+$/)
    .max(20)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'Telefone deve conter apenas números e caracteres válidos',
      'string.max': 'Telefone deve ter no máximo 20 caracteres'
    }),

  email: Joi.string()
    .email()
    .max(255)
    .optional()
    .allow('')
    .messages({
      'string.email': 'Email deve ter um formato válido',
      'string.max': 'Email deve ter no máximo 255 caracteres'
    }),

  description: Joi.string()
    .max(2000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Descrição deve ter no máximo 2000 caracteres'
    }),

  is_active: Joi.boolean()
    .optional()
});

const queryParamsSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.base': 'Página deve ser um número',
      'number.integer': 'Página deve ser um número inteiro',
      'number.min': 'Página deve ser maior que 0'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .messages({
      'number.base': 'Limite deve ser um número',
      'number.integer': 'Limite deve ser um número inteiro',
      'number.min': 'Limite deve ser maior que 0',
      'number.max': 'Limite deve ser no máximo 100'
    }),

  is_active: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'is_active deve ser verdadeiro ou falso'
    }),

  city: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Cidade deve ter no máximo 100 caracteres'
    }),

  search: Joi.string()
    .max(255)
    .optional()
    .messages({
      'string.max': 'Busca deve ter no máximo 255 caracteres'
    })
});

const idParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID deve ser um número',
      'number.integer': 'ID deve ser um número inteiro',
      'number.positive': 'ID deve ser um número positivo',
      'any.required': 'ID é obrigatório'
    })
});

const uuidParamSchema = Joi.object({
  uuid: Joi.string()
    .guid({ version: 'uuidv4' })
    .required()
    .messages({
      'string.guid': 'UUID deve ter um formato válido',
      'any.required': 'UUID é obrigatório'
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
      stripUnknown: true
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

module.exports = {
  createRestaurantSchema,
  updateRestaurantSchema,
  queryParamsSchema,
  idParamSchema,
  uuidParamSchema,
  validate,
  
  // Middlewares prontos para uso
  validateCreate: validate(createRestaurantSchema),
  validateUpdate: validate(updateRestaurantSchema),
  validateQuery: validate(queryParamsSchema, 'query'),
  validateId: validate(idParamSchema, 'params'),
  validateUuid: validate(uuidParamSchema, 'params')
};