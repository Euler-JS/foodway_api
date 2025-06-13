const Joi = require('joi');

/**
 * Validadores para operações de produto
 */

const createProductSchema = Joi.object({
  category_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID da categoria deve ser um número',
      'number.integer': 'ID da categoria deve ser um número inteiro',
      'number.positive': 'ID da categoria deve ser um número positivo',
      'any.required': 'ID da categoria é obrigatório'
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

  regular_price: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base': 'Preço regular deve ser um número',
      'number.positive': 'Preço regular deve ser maior que zero',
      'any.required': 'Preço regular é obrigatório'
    }),

  current_price: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Preço atual deve ser um número',
      'number.positive': 'Preço atual deve ser maior que zero'
    }),

  is_on_promotion: Joi.boolean()
    .optional()
    .default(false),

  image_url: Joi.string()
    .uri()
    .max(500)
    .optional()
    .allow('')
    .default('product_default.png')
    .messages({
      'string.uri': 'URL da imagem deve ter um formato válido',
      'string.max': 'URL da imagem deve ter no máximo 500 caracteres'
    }),

  is_available: Joi.boolean()
    .optional()
    .default(true),

  sort_order: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Ordem deve ser um número',
      'number.integer': 'Ordem deve ser um número inteiro',
      'number.min': 'Ordem deve ser maior ou igual a 0'
    })
});

const updateProductSchema = Joi.object({
  category_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'ID da categoria deve ser um número',
      'number.integer': 'ID da categoria deve ser um número inteiro',
      'number.positive': 'ID da categoria deve ser um número positivo'
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

  regular_price: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Preço regular deve ser um número',
      'number.positive': 'Preço regular deve ser maior que zero'
    }),

  current_price: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Preço atual deve ser um número',
      'number.positive': 'Preço atual deve ser maior que zero'
    }),

  is_on_promotion: Joi.boolean()
    .optional(),

  image_url: Joi.string()
    .uri()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.uri': 'URL da imagem deve ter um formato válido',
      'string.max': 'URL da imagem deve ter no máximo 500 caracteres'
    }),

  is_available: Joi.boolean()
    .optional(),

  sort_order: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Ordem deve ser um número',
      'number.integer': 'Ordem deve ser um número inteiro',
      'number.min': 'Ordem deve ser maior ou igual a 0'
    })
});

const duplicateProductSchema = Joi.object({
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

  regular_price: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Preço regular deve ser um número',
      'number.positive': 'Preço regular deve ser maior que zero'
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

const promotionSchema = Joi.object({
  promotion_price: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .allow(null)
    .messages({
      'number.base': 'Preço promocional deve ser um número',
      'number.positive': 'Preço promocional deve ser maior que zero'
    })
});

const moveCategorySchema = Joi.object({
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

const reorderProductsSchema = Joi.object({
  products: Joi.array()
    .items(
      Joi.object({
        id: Joi.number()
          .integer()
          .positive()
          .required()
          .messages({
            'number.base': 'ID do produto deve ser um número',
            'number.integer': 'ID do produto deve ser um número inteiro',
            'number.positive': 'ID do produto deve ser um número positivo',
            'any.required': 'ID do produto é obrigatório'
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
      'array.min': 'Pelo menos um produto deve ser fornecido',
      'any.required': 'Lista de produtos é obrigatória'
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

  category_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'ID da categoria deve ser um número',
      'number.integer': 'ID da categoria deve ser um número inteiro',
      'number.positive': 'ID da categoria deve ser um número positivo'
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

  is_available: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'is_available deve ser verdadeiro ou falso'
    }),

  is_on_promotion: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'is_on_promotion deve ser verdadeiro ou falso'
    }),

  min_price: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Preço mínimo deve ser um número',
      'number.positive': 'Preço mínimo deve ser maior que zero'
    }),

  max_price: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Preço máximo deve ser um número',
      'number.positive': 'Preço máximo deve ser maior que zero'
    }),

  search: Joi.string()
    .max(255)
    .optional()
    .messages({
      'string.max': 'Busca deve ter no máximo 255 caracteres'
    }),

  sort_by: Joi.string()
    .valid('name', 'current_price', 'regular_price', 'sort_order', 'created_at', 'updated_at')
    .optional()
    .default('sort_order')
    .messages({
      'any.only': 'Ordenação deve ser por: name, current_price, regular_price, sort_order, created_at ou updated_at'
    }),

  sort_order: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .default('asc')
    .messages({
      'any.only': 'Ordem deve ser: asc ou desc'
    })
});

const categoryParamsSchema = Joi.object({
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

// Validação customizada para verificar se preço promocional é menor que preço regular
const validatePromotionPrice = (value, helpers) => {
  const data = helpers.state.ancestors[0];
  
  if (!data) return value;
  
  const { regular_price, current_price, is_on_promotion } = data;
  
  if (is_on_promotion && current_price && regular_price) {
    if (parseFloat(current_price) >= parseFloat(regular_price)) {
      return helpers.error('custom.promotionPrice');
    }
  }
  
  return value;
};

// Schema com validação customizada - aplicada apenas quando necessário
const createProductWithValidationSchema = Joi.object({
  category_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID da categoria deve ser um número',
      'number.integer': 'ID da categoria deve ser um número inteiro',
      'number.positive': 'ID da categoria deve ser um número positivo',
      'any.required': 'ID da categoria é obrigatório'
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

  regular_price: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base': 'Preço regular deve ser um número',
      'number.positive': 'Preço regular deve ser maior que zero',
      'any.required': 'Preço regular é obrigatório'
    }),

  current_price: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Preço atual deve ser um número',
      'number.positive': 'Preço atual deve ser maior que zero'
    }),

  is_on_promotion: Joi.boolean()
    .optional()
    .default(false),

  image_url: Joi.string()
    .uri()
    .max(500)
    .optional()
    .allow('')
    .default('product_default.png')
    .messages({
      'string.uri': 'URL da imagem deve ter um formato válido',
      'string.max': 'URL da imagem deve ter no máximo 500 caracteres'
    }),

  is_available: Joi.boolean()
    .optional()
    .default(true),

  sort_order: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Ordem deve ser um número',
      'number.integer': 'Ordem deve ser um número inteiro',
      'number.min': 'Ordem deve ser maior ou igual a 0'
    })
}).custom((value, helpers) => {
  // Validação customizada apenas quando is_on_promotion é true
  if (value.is_on_promotion && value.current_price && value.regular_price) {
    if (parseFloat(value.current_price) >= parseFloat(value.regular_price)) {
      return helpers.error('custom.promotionPrice');
    }
  }
  return value;
}).messages({
  'custom.promotionPrice': 'Preço promocional deve ser menor que o preço regular'
});

const updateProductWithValidationSchema = Joi.object({
  category_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'ID da categoria deve ser um número',
      'number.integer': 'ID da categoria deve ser um número inteiro',
      'number.positive': 'ID da categoria deve ser um número positivo'
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

  regular_price: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Preço regular deve ser um número',
      'number.positive': 'Preço regular deve ser maior que zero'
    }),

  current_price: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Preço atual deve ser um número',
      'number.positive': 'Preço atual deve ser maior que zero'
    }),

  is_on_promotion: Joi.boolean()
    .optional(),

  image_url: Joi.string()
    .uri()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.uri': 'URL da imagem deve ter um formato válido',
      'string.max': 'URL da imagem deve ter no máximo 500 caracteres'
    }),

  is_available: Joi.boolean()
    .optional(),

  sort_order: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Ordem deve ser um número',
      'number.integer': 'Ordem deve ser um número inteiro',
      'number.min': 'Ordem deve ser maior ou igual a 0'
    })
}).custom((value, helpers) => {
  // Validação customizada apenas quando is_on_promotion é true
  if (value.is_on_promotion && value.current_price && value.regular_price) {
    if (parseFloat(value.current_price) >= parseFloat(value.regular_price)) {
      return helpers.error('custom.promotionPrice');
    }
  }
  return value;
}).messages({
  'custom.promotionPrice': 'Preço promocional deve ser menor que o preço regular'
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

/**
 * Middleware para validar se categoria existe
 */
const validateCategoryExists = async (req, res, next) => {
  try {
    const categoryId = req.body.category_id || req.params.category_id;
    
    if (!categoryId) {
      return next();
    }

    const Category = require('../models/Category');
    await Category.findById(categoryId);
    
    next();
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(422).json({
        success: false,
        message: 'Erro de validação',
        errors: [
          {
            field: 'category_id',
            message: 'Categoria não encontrada'
          }
        ],
        timestamp: new Date().toISOString()
      });
    }
    next(error);
  }
};

module.exports = {
  createProductSchema,
  updateProductSchema,
  duplicateProductSchema,
  promotionSchema,
  moveCategorySchema,
  reorderProductsSchema,
  queryParamsSchema,
  categoryParamsSchema,
  restaurantParamsSchema,
  idParamSchema,
  uuidParamSchema,
  createProductWithValidationSchema,
  updateProductWithValidationSchema,
  validate,
  validateCategoryExists,
  
  // Middlewares prontos para uso - simplificados
  validateCreate: validate(createProductWithValidationSchema),
  validateUpdate: validate(updateProductWithValidationSchema),
  validateDuplicate: validate(duplicateProductSchema),
  validatePromotion: validate(promotionSchema),
  validateMoveCategory: validate(moveCategorySchema),
  validateReorder: validate(reorderProductsSchema),
  validateQuery: validate(queryParamsSchema, 'query'),
  validateCategoryParam: validate(categoryParamsSchema, 'params'),
  validateRestaurantParam: validate(restaurantParamsSchema, 'params'),
  validateId: validate(idParamSchema, 'params'),
  validateUuid: validate(uuidParamSchema, 'params')
};