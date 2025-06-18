const Joi = require('joi');

/**
 * Validadores para operações de mesa
 */

const createTableSchema = Joi.object({
  restaurant_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID do restaurante deve ser um número',
      'number.integer': 'ID do restaurante deve ser um número inteiro',
      'number.positive': 'ID do restaurante deve ser um número positivo',
      'any.required': 'ID do restaurante é obrigatório'
    }),

  table_number: Joi.number()
    .integer()
    .positive()
    .max(9999)
    .required()
    .messages({
      'number.base': 'Número da mesa deve ser um número',
      'number.integer': 'Número da mesa deve ser um número inteiro',
      'number.positive': 'Número da mesa deve ser maior que zero',
      'number.max': 'Número da mesa deve ser menor que 10000',
      'any.required': 'Número da mesa é obrigatório'
    }),

  name: Joi.string()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Nome da mesa deve ter no máximo 100 caracteres'
    }),

  capacity: Joi.number()
    .integer()
    .positive()
    .max(50)
    .optional()
    .default(4)
    .messages({
      'number.base': 'Capacidade deve ser um número',
      'number.integer': 'Capacidade deve ser um número inteiro',
      'number.positive': 'Capacidade deve ser maior que zero',
      'number.max': 'Capacidade deve ser menor que 51'
    }),

  location: Joi.string()
    .max(255)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Localização deve ter no máximo 255 caracteres'
    }),

  is_active: Joi.boolean()
    .optional()
    .default(true)
});

const updateTableSchema = Joi.object({
  restaurant_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'ID do restaurante deve ser um número',
      'number.integer': 'ID do restaurante deve ser um número inteiro',
      'number.positive': 'ID do restaurante deve ser um número positivo'
    }),

  table_number: Joi.number()
    .integer()
    .positive()
    .max(9999)
    .optional()
    .messages({
      'number.base': 'Número da mesa deve ser um número',
      'number.integer': 'Número da mesa deve ser um número inteiro',
      'number.positive': 'Número da mesa deve ser maior que zero',
      'number.max': 'Número da mesa deve ser menor que 10000'
    }),

  name: Joi.string()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Nome da mesa deve ter no máximo 100 caracteres'
    }),

  capacity: Joi.number()
    .integer()
    .positive()
    .max(50)
    .optional()
    .messages({
      'number.base': 'Capacidade deve ser um número',
      'number.integer': 'Capacidade deve ser um número inteiro',
      'number.positive': 'Capacidade deve ser maior que zero',
      'number.max': 'Capacidade deve ser menor que 51'
    }),

  location: Joi.string()
    .max(255)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Localização deve ter no máximo 255 caracteres'
    }),

  is_active: Joi.boolean()
    .optional()
});

const batchCreateSchema = Joi.object({
  table_numbers: Joi.array()
    .items(
      Joi.number()
        .integer()
        .positive()
        .max(9999)
        .messages({
          'number.base': 'Número da mesa deve ser um número',
          'number.integer': 'Número da mesa deve ser um número inteiro',
          'number.positive': 'Número da mesa deve ser maior que zero',
          'number.max': 'Número da mesa deve ser menor que 10000'
        })
    )
    .min(1)
    .max(100)
    .unique()
    .required()
    .messages({
      'array.min': 'Pelo menos um número de mesa deve ser fornecido',
      'array.max': 'Máximo de 100 mesas por vez',
      'array.unique': 'Números de mesa não podem ser duplicados',
      'any.required': 'Lista de números de mesa é obrigatória'
    }),

  capacity: Joi.number()
    .integer()
    .positive()
    .max(50)
    .optional()
    .default(4)
    .messages({
      'number.base': 'Capacidade deve ser um número',
      'number.integer': 'Capacidade deve ser um número inteiro',
      'number.positive': 'Capacidade deve ser maior que zero',
      'number.max': 'Capacidade deve ser menor que 51'
    })
});

const generateRangeSchema = Joi.object({
  start_number: Joi.number()
    .integer()
    .positive()
    .max(9999)
    .required()
    .messages({
      'number.base': 'Número inicial deve ser um número',
      'number.integer': 'Número inicial deve ser um número inteiro',
      'number.positive': 'Número inicial deve ser maior que zero',
      'number.max': 'Número inicial deve ser menor que 10000',
      'any.required': 'Número inicial é obrigatório'
    }),

  end_number: Joi.number()
    .integer()
    .positive()
    .max(9999)
    .greater(Joi.ref('start_number'))
    .required()
    .messages({
      'number.base': 'Número final deve ser um número',
      'number.integer': 'Número final deve ser um número inteiro',
      'number.positive': 'Número final deve ser maior que zero',
      'number.max': 'Número final deve ser menor que 10000',
      'number.greater': 'Número final deve ser maior que o número inicial',
      'any.required': 'Número final é obrigatório'
    }),

  capacity: Joi.number()
    .integer()
    .positive()
    .max(50)
    .optional()
    .default(4)
    .messages({
      'number.base': 'Capacidade deve ser um número',
      'number.integer': 'Capacidade deve ser um número inteiro',
      'number.positive': 'Capacidade deve ser maior que zero',
      'number.max': 'Capacidade deve ser menor que 51'
    })
}).custom((value, helpers) => {
  // Validar se o range não é muito grande
  if (value.end_number - value.start_number > 100) {
    return helpers.error('custom.rangeTooBig');
  }
  return value;
}).messages({
  'custom.rangeTooBig': 'Range máximo de 100 mesas por vez'
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
    .default(50)
    .messages({
      'number.base': 'Limite deve ser um número',
      'number.integer': 'Limite deve ser um número inteiro',
      'number.min': 'Limite deve ser maior que 0',
      'number.max': 'Limite deve ser no máximo 100'
    }),

  restaurant_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'ID do restaurante deve ser um número',
      'number.integer': 'ID do restaurante deve ser um número inteiro',
      'number.positive': 'ID do restaurante deve ser um número positivo'
    }),

  is_active: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'is_active deve ser verdadeiro ou falso'
    }),

  sort_by: Joi.string()
    .valid('table_number', 'name', 'capacity', 'created_at', 'updated_at')
    .optional()
    .default('table_number')
    .messages({
      'any.only': 'Ordenação deve ser por: table_number, name, capacity, created_at ou updated_at'
    }),

  sort_order: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .default('asc')
    .messages({
      'any.only': 'Ordem deve ser: asc ou desc'
    })
});

const restaurantParamsSchema = Joi.object({
  restaurant_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID do restaurante deve ser um número',
      'number.integer': 'ID do restaurante deve ser um número inteiro',
      'number.positive': 'ID do restaurante deve ser um número positivo',
      'any.required': 'ID do restaurante é obrigatório'
    })
});

const tableParamsSchema = Joi.object({
  restaurant_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID do restaurante deve ser um número',
      'number.integer': 'ID do restaurante deve ser um número inteiro',
      'number.positive': 'ID do restaurante deve ser um número positivo',
      'any.required': 'ID do restaurante é obrigatório'
    }),

  table_number: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Número da mesa deve ser um número',
      'number.integer': 'Número da mesa deve ser um número inteiro',
      'number.positive': 'Número da mesa deve ser maior que zero',
      'any.required': 'Número da mesa é obrigatório'
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

/**
 * Middleware de validação
 * @param {Object} schema - Schema Joi para validação
 * @param {string} property - Propriedade do request a ser validada
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
  createTableSchema,
  updateTableSchema,
  batchCreateSchema,
  generateRangeSchema,
  queryParamsSchema,
  restaurantParamsSchema,
  tableParamsSchema,
  idParamSchema,
  validate,
  
  // Middlewares prontos para uso
  validateCreate: validate(createTableSchema),
  validateUpdate: validate(updateTableSchema),
  validateBatchCreate: validate(batchCreateSchema),
  validateGenerateRange: validate(generateRangeSchema),
  validateQuery: validate(queryParamsSchema, 'query'),
  validateRestaurantParam: validate(restaurantParamsSchema, 'params'),
  validateTableParam: validate(tableParamsSchema, 'params'),
  validateId: validate(idParamSchema, 'params')
};