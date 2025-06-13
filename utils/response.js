/**
 * Utilitários para padronizar respostas da API
 */

class ApiResponse {
  /**
   * Resposta de sucesso
   * @param {Object} res - Response object do Express
   * @param {*} data - Dados a serem retornados
   * @param {string} message - Mensagem opcional
   * @param {number} statusCode - Código de status HTTP
   */
  static success(res, data = null, message = 'Operação realizada com sucesso', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Resposta de erro
   * @param {Object} res - Response object do Express
   * @param {string} message - Mensagem de erro
   * @param {number} statusCode - Código de status HTTP
   * @param {*} errors - Detalhes dos erros (opcional)
   */
  static error(res, message = 'Erro interno do servidor', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Resposta de validação
   * @param {Object} res - Response object do Express
   * @param {*} errors - Erros de validação
   */
  static validationError(res, errors) {
    return res.status(422).json({
      success: false,
      message: 'Erro de validação',
      errors,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Resposta de não encontrado
   * @param {Object} res - Response object do Express
   * @param {string} message - Mensagem personalizada
   */
  static notFound(res, message = 'Recurso não encontrado') {
    return res.status(404).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Resposta de não autorizado
   * @param {Object} res - Response object do Express
   * @param {string} message - Mensagem personalizada
   */
  static unauthorized(res, message = 'Não autorizado') {
    return res.status(401).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Resposta de conflito
   * @param {Object} res - Response object do Express
   * @param {string} message - Mensagem personalizada
   */
  static conflict(res, message = 'Recurso já existe') {
    return res.status(409).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = ApiResponse;