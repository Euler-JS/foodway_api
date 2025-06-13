/**
 * Classes de erro personalizadas
 */

class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Erro de validação', errors = null) {
    super(message, 422);
    this.errors = errors;
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado') {
    super(message, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Recurso já existe') {
    super(message, 409);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Não autorizado') {
    super(message, 401);
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Erro de banco de dados', originalError = null) {
    super(message, 500);
    this.originalError = originalError;
  }
}

/**
 * Tratador de erros do Supabase
 * @param {Object} error - Erro do Supabase
 * @returns {AppError} - Erro padronizado
 */
const handleSupabaseError = (error) => {
  console.error('Supabase Error:', error);

  // Erro de violação de chave única
  if (error.code === '23505') {
    return new ConflictError('Recurso já existe com estes dados');
  }

  // Erro de chave estrangeira
  if (error.code === '23503') {
    return new ValidationError('Referência inválida - recurso relacionado não existe');
  }

  // Erro de violação de NOT NULL
  if (error.code === '23502') {
    return new ValidationError('Campo obrigatório não informado');
  }

  // Erro de sintaxe SQL
  if (error.code === '42601') {
    return new DatabaseError('Erro na consulta ao banco de dados');
  }

  // Erro de permissão
  if (error.code === '42501') {
    return new UnauthorizedError('Permissão insuficiente para esta operação');
  }

  // Erro genérico do banco
  return new DatabaseError(error.message || 'Erro no banco de dados', error);
};

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  DatabaseError,
  handleSupabaseError
};