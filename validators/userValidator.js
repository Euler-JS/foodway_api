const Joi = require('joi');

/**
 * Validadores para operações de usuário
 */

const createUserSchema = Joi.object({
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

  email: Joi.string()
    .email()
    .max(255)
    .required()
    .messages({
      'string.email': 'Email deve ter um formato válido',
      'string.max': 'Email deve ter no máximo 255 caracteres',
      'any.required': 'Email é obrigatório'
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Senha deve ter pelo menos 6 caracteres',
      'string.empty': 'Senha é obrigatória',
      'any.required': 'Senha é obrigatória'
    }),

  role: Joi.string()
    .valid('super_admin', 'restaurant_user')
    .required()
    .messages({
      'any.only': 'Role deve ser: super_admin ou restaurant_user',
      'any.required': 'Role é obrigatório'
    }),

  restaurant_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .when('role', {
      is: 'restaurant_user',
      then: Joi.required(),
      otherwise: Joi.forbidden()
    })
    .messages({
      'number.base': 'ID do restaurante deve ser um número',
      'number.integer': 'ID do restaurante deve ser um número inteiro',
      'number.positive': 'ID do restaurante deve ser um número positivo',
      'any.required': 'ID do restaurante é obrigatório para usuários de restaurante',
      'any.unknown': 'Super admin não pode ter restaurante associado'
    }),

  is_active: Joi.boolean()
    .optional()
    .default(true),

  email_verified: Joi.boolean()
    .optional()
    .default(false)
});

const updateUserSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .optional()
    .messages({
      'string.empty': 'Nome não pode estar vazio',
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 255 caracteres'
    }),

  email: Joi.string()
    .email()
    .max(255)
    .optional()
    .messages({
      'string.email': 'Email deve ter um formato válido',
      'string.max': 'Email deve ter no máximo 255 caracteres'
    }),

  password: Joi.string()
    .min(6)
    .optional()
    .messages({
      'string.min': 'Senha deve ter pelo menos 6 caracteres',
      'string.empty': 'Senha não pode estar vazia'
    }),

  role: Joi.string()
    .valid('super_admin', 'restaurant_user')
    .optional()
    .messages({
      'any.only': 'Role deve ser: super_admin ou restaurant_user'
    }),

  restaurant_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .allow(null)
    .messages({
      'number.base': 'ID do restaurante deve ser um número',
      'number.integer': 'ID do restaurante deve ser um número inteiro',
      'number.positive': 'ID do restaurante deve ser um número positivo'
    }),

  is_active: Joi.boolean()
    .optional(),

  email_verified: Joi.boolean()
    .optional()
});

const updateMeSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .optional()
    .messages({
      'string.empty': 'Nome não pode estar vazio',
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 255 caracteres'
    }),

  email: Joi.string()
    .email()
    .max(255)
    .optional()
    .messages({
      'string.email': 'Email deve ter um formato válido',
      'string.max': 'Email deve ter no máximo 255 caracteres'
    }),

  password: Joi.string()
    .min(6)
    .optional()
    .messages({
      'string.min': 'Senha deve ter pelo menos 6 caracteres',
      'string.empty': 'Senha não pode estar vazia'
    })

  // Note: role, restaurant_id, is_active e email_verified são removidos no controller
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

  role: Joi.string()
    .valid('super_admin', 'restaurant_user')
    .optional()
    .messages({
      'any.only': 'Role deve ser: super_admin ou restaurant_user'
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
    .valid('name', 'email', 'role', 'created_at', 'updated_at', 'last_login')
    .optional()
    .default('created_at')
    .messages({
      'any.only': 'Ordenação deve ser por: name, email, role, created_at, updated_at ou last_login'
    }),

  sort_order: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .default('desc')
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

/**
 * Validação customizada para verificar regras de role/restaurant
 */
const validateRoleRestaurantRules = (req, res, next) => {
  const { role, restaurant_id } = req.body;

  // Se está definindo role e restaurant_id
  if (role && restaurant_id !== undefined) {
    if (role === 'super_admin' && restaurant_id !== null) {
      return res.status(422).json({
        success: false,
        message: 'Erro de validação',
        errors: [{
          field: 'restaurant_id',
          message: 'Super admin não pode ter restaurante associado'
        }],
        timestamp: new Date().toISOString()
      });
    }

    if (role === 'restaurant_user' && !restaurant_id) {
      return res.status(422).json({
        success: false,
        message: 'Erro de validação',
        errors: [{
          field: 'restaurant_id',
          message: 'Usuário de restaurante deve ter restaurante associado'
        }],
        timestamp: new Date().toISOString()
      });
    }
  }

  next();
};

module.exports = {
  createUserSchema,
  updateUserSchema,
  updateMeSchema,
  queryParamsSchema,
  restaurantParamsSchema,
  idParamSchema,
  validate,
  validateRoleRestaurantRules,
  
  // Middlewares prontos para uso
  validateCreate: [validate(createUserSchema), validateRoleRestaurantRules],
  validateUpdate: [validate(updateUserSchema), validateRoleRestaurantRules],
  validateUpdateMe: validate(updateMeSchema),
  validateQuery: validate(queryParamsSchema, 'query'),
  validateRestaurantParam: validate(restaurantParamsSchema, 'params'),
  validateId: validate(idParamSchema, 'params')
};