const Joi = require('joi');

/**
 * Validadores para operações de autenticação
 */

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email deve ter um formato válido',
      'any.required': 'Email é obrigatório'
    }),

  password: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Senha é obrigatória',
      'any.required': 'Senha é obrigatória'
    })
});

const refreshSchema = Joi.object({
  refresh_token: Joi.string()
    .required()
    .messages({
      'string.empty': 'Refresh token é obrigatório',
      'any.required': 'Refresh token é obrigatório'
    })
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email deve ter um formato válido',
      'any.required': 'Email é obrigatório'
    })
});

const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'string.empty': 'Token é obrigatório',
      'any.required': 'Token é obrigatório'
    }),

  new_password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Nova senha deve ter pelo menos 6 caracteres',
      'string.empty': 'Nova senha é obrigatória',
      'any.required': 'Nova senha é obrigatória'
    })
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Senha atual é obrigatória',
      'any.required': 'Senha atual é obrigatória'
    }),

  new_password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Nova senha deve ter pelo menos 6 caracteres',
      'string.empty': 'Nova senha é obrigatória',
      'any.required': 'Nova senha é obrigatória'
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
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  validate,
  
  // Middlewares prontos para uso
  validateLogin: validate(loginSchema),
  validateRefresh: validate(refreshSchema),
  validateForgotPassword: validate(forgotPasswordSchema),
  validateResetPassword: validate(resetPasswordSchema),
  validateChangePassword: validate(changePasswordSchema)
};