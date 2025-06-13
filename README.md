# Restaurant Menu API 🍽️

API RESTful para gestão de menus de restaurantes, construída com Node.js, Express e Supabase.

## 🚀 Características

- ✅ CRUD completo para restaurantes
- ✅ Validação robusta de dados
- ✅ Paginação e filtros
- ✅ Soft delete (inativação)
- ✅ Rate limiting
- ✅ Tratamento de erros padronizado
- ✅ Logs estruturados
- ✅ Segurança com Helmet
- ✅ CORS configurado

## 📋 Pré-requisitos

- Node.js 16+
- Conta no Supabase
- npm ou yarn

## 🛠️ Instalação

1. **Clone o repositório**
```bash
git clone <seu-repositorio>
cd restaurant-menu-api
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:
```env
PORT=3000
NODE_ENV=development

SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

API_VERSION=v1
CORS_ORIGIN=*
```

4. **Configure o banco de dados**

Execute o script SQL no editor do Supabase (disponível em `sql/schema.sql`):

```sql
-- Ver arquivo de estrutura do projeto para o script completo
```

5. **Inicie o servidor**
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 📚 Documentação da API

### Base URL
```
http://localhost:3000/api/v1
```

### Endpoints de Restaurantes

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/restaurants` | Listar restaurantes |
| GET | `/restaurants/:id` | Buscar por ID |
| GET | `/restaurants/uuid/:uuid` | Buscar por UUID |
| GET | `/restaurants/search?q=termo` | Buscar por nome/descrição |
| GET | `/restaurants/city/:city` | Buscar por cidade |
| GET | `/restaurants/stats` | Estatísticas |
| POST | `/restaurants` | Criar restaurante |
| PUT | `/restaurants/:id` | Atualizar restaurante |
| DELETE | `/restaurants/:id` | Inativar restaurante |
| PATCH | `/restaurants/:id/reactivate` | Reativar restaurante |
| DELETE | `/restaurants/:id/hard` | Deletar permanentemente |

### Exemplo de Requisição

```bash
# Criar restaurante
curl -X POST http://localhost:3000/api/v1/restaurants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Casa das Pizzas",
    "address": "Estorilhos - Beira",
    "city": "Beira",
    "phone": "879123456",
    "email": "contato@casadaspizzas.mz",
    "description": "A melhor pizza da cidade!"
  }'
```

### Resposta de Sucesso

```json
{
  "success": true,
  "message": "Restaurante criado com sucesso",
  "data": {
    "id": 1,
    "uuid": "38ed6e58-12bf-43e8-b8d3-f30a6aa2a961",
    "name": "Casa das Pizzas",
    "logo": "logo_default.png",
    "address": "Estorilhos - Beira",
    "city": "Beira",
    "phone": "879123456",
    "email": "contato@casadaspizzas.mz",
    "description": "A melhor pizza da cidade!",
    "is_active": true,
    "created_at": "2024-01-01T12:00:00.000Z",
    "updated_at": "2024-01-01T12:00:00.000Z"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🧪 Testes

```bash
# Health check
curl http://localhost:3000/health

# Listar restaurantes
curl http://localhost:3000/api/v1/restaurants

# Com paginação
curl "http://localhost:3000/api/v1/restaurants?page=1&limit=5"
```

## 📁 Estrutura do Projeto

```
restaurant-menu-api/
├── config/
│   └── supabase.js          # Configuração do Supabase
├── controllers/
│   └── restaurantController.js
├── middleware/
│   └── errorHandler.js      # Tratamento de erros
├── models/
│   └── Restaurant.js        # Model do restaurante
├── routes/
│   └── restaurants.js       # Rotas dos restaurantes
├── utils/
│   ├── response.js          # Utilitários de resposta
│   └── errors.js            # Classes de erro customizadas
├── validators/
│   └── restaurantValidator.js # Validações com Joi
├── .env.example             # Template de variáveis
├── package.json
├── server.js                # Servidor principal
└── README.md
```

## 🔒 Segurança

- **Rate Limiting**: 100 requests por 15 minutos por IP
- **Helmet**: Headers de segurança automáticos
- **CORS**: Configurado para origens específicas
- **Validação**: Dados validados com Joi
- **Sanitização**: Dados limpos antes do armazenamento

## 🛡️ Tratamento de Erros

A API retorna erros padronizados:

```json
{
  "success": false,
  "message": "Erro de validação",
  "errors": [
    {
      "field": "name",
      "message": "Nome é obrigatório"
    }
  ],
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 📊 Status Codes

| Code | Descrição |
|------|-----------|
| 200 | Sucesso |
| 201 | Criado |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 404 | Não encontrado |
| 409 | Conflito |
| 422 | Erro de validação |
| 429 | Muitas requisições |
| 500 | Erro interno |

## 🚀 Próximos Passos

- [ ] Implementar categorias
- [ ] Implementar produtos
- [ ] Implementar menu completo
- [ ] Autenticação e autorização
- [ ] Upload de imagens
- [ ] Testes automatizados
- [ ] Docker
- [ ] CI/CD

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no repositório.

## 📄 Licença

MIT License