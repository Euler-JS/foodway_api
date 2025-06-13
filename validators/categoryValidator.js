const Joi = require('joi');

/**
 * Validadores para operações de categoria
 */

const createCategorySchema = Joi.object({
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

  description: Joi.string()
    .max(2000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Descrição deve ter no máximo 2000 caracteres'
    }),

  image_url: Joi.string()
    .uri()
    .max(500)
    .optional()
    .allow('')
    .default('category_default.png')
    .messages({
      'string.uri': 'URL da imagem deve ter um formato válido',
      'string.max': 'URL da imagem deve ter no máximo 500 caracteres'
    }),

  sort_order: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Ordem deve ser um número',
      'number.integer': 'Ordem deve ser um número inteiro',
      'number.min': 'Ordem deve ser maior ou igual a 0'
    }),

  is_active: Joi.boolean()
    .optional()
    .default(true)
});

const updateCategorySchema = Joi.object({
  restaurant_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'ID do restaurante deve ser um número',
      'number.integer': 'ID do restaurante deve ser um número inteiro',
      'number.positive': 'ID do restaurante deve ser um número positivo'
    }),

  name: Joi.string()
    .min(2)
    .max(255)
    .optional()
    .messages({
      'string.empty': 'Nome não pode estar vazio',
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 255 caracteres'
    }),

  description: Joi.string()
    .max(2000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Descrição deve ter no máximo 2000 caracteres'
    }),

  image_url: Joi.string()
    .uri()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.uri': 'URL da imagem deve ter um formato válido',
      'string.max': 'URL da imagem deve ter no máximo 500 caracteres'
    }),

  sort_order: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Ordem deve ser um número',
      'number.integer': 'Ordem deve ser um número inteiro',
      'number.min': 'Ordem deve ser maior ou igual a 0'
    }),

  is_active: Joi.boolean()
    .optional()
});

const duplicateCategorySchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .optional()
    .messages({
      'string.empty': 'Nome não pode estar vazio',
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 255 caracteres'
    }),

  description: Joi.string()
    .max(2000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Descrição deve ter no máximo 2000 caracteres'
    }),

  image_url: Joi.string()
    .uri()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.uri': 'URL da imagem deve ter um formato válido',
      'string.max': 'URL da imagem deve ter no máximo 500 caracteres'
    })
});

const reorderCategoriesSchema = Joi.object({
  categories: Joi.array()
    .items(
      Joi.object({
        id: Joi.number()
          .integer()
          .positive()
          .required()
          .messages({
            'number.base': 'ID da categoria deve ser um número',
            'number.integer': 'ID da categoria deve ser um número inteiro',
            'number.positive': 'ID da categoria deve ser um número positivo',
            'any.required': 'ID da categoria é obrigatório'
          }),
        
        sort_order: Joi.number()
          .integer()
          .min(0)
          .required()
          .messages({
            'number.base': 'Ordem deve ser um número',
            'number.integer': 'Ordem deve ser um número inteiro',
            'number.min': 'Ordem deve ser maior ou igual a 0',
            'any.required': 'Ordem é obrigatória'
          })
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'Pelo menos uma categoria deve ser fornecida',
      'any.required': 'Lista de categorias é obrigatória'
    })
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

  search: Joi.string()
    .max(255)
    .optional()
    .messages({
      'string.max': 'Busca deve ter no máximo 255 caracteres'
    }),

  sort_by: Joi.string()
    .valid('name', 'sort_order', 'created_at', 'updated_at')
    .optional()
    .default('sort_order')
    .messages({
      'any.only': 'Ordenação deve ser por: name, sort_order, created_at ou updated_at'
    }),

  sort_order: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .default('asc')
    .messages({
      'any.only': 'Ordem deve ser: asc ou desc'
    }),

  include_product_count: Joi.boolean()
    .optional()
    .default(false)
    .messages({
      'boolean.base': 'include_product_count deve ser verdadeiro ou falso'
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
  createCategorySchema,
  updateCategorySchema,
  duplicateCategorySchema,
  reorderCategoriesSchema,
  queryParamsSchema,
  restaurantParamsSchema,
  idParamSchema,
  uuidParamSchema,
  validate,
  
  // Middlewares prontos para uso
  validateCreate: validate(createCategorySchema),
  validateUpdate: validate(updateCategorySchema),
  validateDuplicate: validate(duplicateCategorySchema),
  validateReorder: validate(reorderCategoriesSchema),
  validateQuery: validate(queryParamsSchema, 'query'),
  validateRestaurantParam: validate(restaurantParamsSchema, 'params'),
  validateId: validate(idParamSchema, 'params'),
  validateUuid: validate(uuidParamSchema, 'params')
};