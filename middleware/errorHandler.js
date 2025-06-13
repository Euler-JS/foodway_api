const { AppError } = require('../utils/errors');

/**
 * Middleware global de tratamento de erros
 * @param {Error} err - Erro capturado
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log do erro (em produção você pode usar um logger como Winston)
  console.error('Error caught by error handler:');
  console.error('Stack:', err.stack);
  console.error('Request URL:', req.originalUrl);
  console.error('Request Method:', req.method);
  console.error('Request Body:', req.body);
  console.error('Request Params:', req.params);
  console.error('Request Query:', req.query);

  // Se é um erro conhecido da aplicação
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || null,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        type: err.constructor.name 
      })
    });
  }

  // Erro de sintaxe JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'JSON inválido na requisição',
      timestamp: new Date().toISOString()
    });
  }

  // Erro de validação do Express (ex: campos muito grandes)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'Arquivo muito grande',
      timestamp: new Date().toISOString()
    });
  }

  // Erro de timeout
  if (err.code === 'ETIMEDOUT') {
    return res.status(408).json({
      success: false,
      message: 'Tempo limite da requisição excedido',
      timestamp: new Date().toISOString()
    });
  }

  // Erro de conexão com banco de dados
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      success: false,
      message: 'Serviço temporariamente indisponível',
      timestamp: new Date().toISOString()
    });
  }

  // Erro genérico não tratado
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : err.message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      originalError: err 
    })
  });
};

/**
 * Middleware para capturar erros assíncronos
 * @param {Function} fn - Função async a ser executada
 * @returns {Function} - Middleware do Express
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware para rotas não encontradas
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Rota ${req.originalUrl} não encontrada`,
    404
  );
  next(error);
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler
};