# User Login Node API

REST API de gerenciamento de usuários construída com **Node.js**, **Express** e **SQLite**, documentada com **Scalar** e protegida com **JWT**.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| Banco de dados | SQLite via sql.js (pure JS, sem binários nativos) |
| Hash de senha | bcryptjs |
| Autenticação | JSON Web Token (jsonwebtoken) |
| Validação | Zod |
| Segurança | Helmet + CORS + Rate Limiting (express-rate-limit) |
| Cache | node-cache (in-memory) |
| Logging | Pino + pino-pretty |
| Documentação | Scalar (OpenAPI 3.1) |
| Testes | Jest + Supertest |
| Arquitetura | MVC |

---

## Estrutura do projeto

```
src/
├── cache/
│   └── cache.js                  # Singleton node-cache + helpers de invalidação
├── config/
│   └── env.js                    # Validação de variáveis de ambiente (envalid)
├── controllers/
│   ├── AuthController.js         # Login e geração de token
│   └── UserController.js         # CRUD de usuários com paginação
├── database/
│   ├── database.js               # Conexão SQLite (sql.js) + singleton
│   └── migrations.js             # Criação e evolução das tabelas
├── docs/
│   └── openapi.js                # Spec OpenAPI 3.1 completa
├── middlewares/
│   ├── auth.js                   # Validação de JWT Bearer
│   ├── logger.js                 # HTTP logger estruturado (pino)
│   ├── requestId.js              # Geração de X-Request-Id por requisição
│   └── validate.js               # Middleware genérico de validação Zod
├── models/
│   └── User.js                   # Camada de acesso a dados (soft delete + paginação)
├── routes/
│   ├── index.js                  # Agregador de rotas
│   ├── authRoutes.js             # POST /auth/login
│   └── userRoutes.js             # CRUD /users
├── schemas/
│   ├── authSchemas.js            # Schema Zod para login
│   └── userSchemas.js            # Schemas Zod para create/update
├── app.js                        # Configuração do Express
└── server.js                     # Entry point
tests/
├── __mocks__/
│   └── @scalar/express-api-reference.js
├── helpers/
│   └── setupDatabase.js          # Banco em memória para testes
├── unit/
│   ├── auth.middleware.test.js
│   ├── requestId.middleware.test.js
│   ├── validate.middleware.test.js
│   ├── user.model.test.js
│   └── user.schemas.test.js
└── integration/
    ├── auth.routes.test.js
    ├── cache.test.js
    ├── pagination.test.js
    ├── softdelete.test.js
    └── users.routes.test.js
```

---

## Instalação

```bash
npm install
```

## Configuração

```bash
cp .env.example .env
```

```env
PORT=3000

# JWT
JWT_SECRET=troque_por_um_segredo_forte_min_32_chars
JWT_EXPIRES_IN=1d

# Cache TTL em segundos
CACHE_TTL=60

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
RATE_LIMIT_LOGIN_MAX=10

# CORS — origens separadas por vírgula, ou * para todas
CORS_ORIGIN=*
```

> Se `JWT_SECRET` não estiver definido em produção, o servidor usa um valor padrão fraco. Sempre defina um secret forte.

---

## Executando

```bash
# Desenvolvimento (hot-reload com nodemon)
npm run dev

# Produção
npm start
```

O servidor sobe em `http://localhost:3000`.

---

## Documentação interativa

```
http://localhost:3000/docs
```

Spec OpenAPI em JSON:

```
http://localhost:3000/openapi.json
```

---

## Endpoints

### Autenticação

| Método | Rota | Auth | Rate limit | Descrição |
|--------|------|------|------------|-----------|
| POST | `/api/auth/login` | Não | 10 req/min | Autentica e retorna JWT |

### Usuários

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/users` | Não | Lista usuários ativos (paginado) |
| GET | `/api/users/:id` | Não | Busca usuário ativo por ID |
| POST | `/api/users` | Não | Cria novo usuário |
| PUT | `/api/users/:id` | Não | Atualiza usuário |
| DELETE | `/api/users/:id` | **Sim (JWT)** | Soft-delete do usuário |

### Utilitários

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Health check |

---

## Paginação

O endpoint `GET /api/users` suporta paginação via query params:

```
GET /api/users?page=1&limit=20
```

Resposta:
```json
{
  "success": true,
  "data": [...],
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3,
  "fromCache": false
}
```

| Param | Padrão | Máximo |
|-------|--------|--------|
| `page` | 1 | — |
| `limit` | 20 | 100 |

---

## Autenticação JWT

Apenas `DELETE /api/users/:id` exige autenticação.

**Fluxo:**
1. Crie um usuário via `POST /api/users`
2. Faça login via `POST /api/auth/login` e copie o `token`
3. Envie o token no header:

```
Authorization: Bearer <token>
```

---

## Soft Delete

O `DELETE /api/users/:id` não remove o registro do banco — define `deleted_at` com o timestamp atual. Usuários deletados:

- Não aparecem em `GET /api/users`
- Retornam 404 em `GET /api/users/:id`
- Não conseguem fazer login
- Não são contabilizados no `total` da paginação

---

## Segurança

| Recurso | Implementação |
|---------|---------------|
| Headers HTTP seguros | `helmet` |
| CORS configurável | `cors` com whitelist de origens |
| Rate limiting geral | 100 req/min por IP |
| Rate limiting no login | 10 req/min por IP (anti brute-force) |
| Validação de entrada | Zod em todas as rotas de escrita |
| Hash de senha | bcrypt com salt 10 |
| JWT | HS256, expira em 1 dia por padrão |
| Request ID | UUID por requisição, propagado nos logs e headers |

---

## Logging

Em desenvolvimento, os logs são exibidos de forma legível no terminal (pino-pretty):

```
[10:30:00] INFO: request completed
  method: "POST"
  url: "/api/users"
  status: 201
  durationMs: 12
  requestId: "a1b2c3d4-..."
```

Em produção (`NODE_ENV=production`), os logs são emitidos em JSON para integração com agregadores de log.

---

## Cache

`GET /users` e `GET /users/:id` são cacheados em memória. As respostas incluem `fromCache: true/false`.

Operações de escrita invalidam o cache automaticamente:

| Operação | Invalida |
|----------|----------|
| POST /users | Todo o cache |
| PUT /users/:id | Cache do usuário + lista |
| DELETE /users/:id | Cache do usuário + lista |

TTL configurável via `CACHE_TTL` no `.env` (padrão: 60 segundos).

---

## Schema do usuário

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Gerado automaticamente |
| `name` | string | Nome completo (obrigatório, max 100 chars) |
| `email` | string | E-mail único (obrigatório) |
| `password` | string | Hash bcrypt (obrigatório, min 6 chars) |
| `created_at` | datetime | Preenchido automaticamente |
| `updated_at` | datetime | Atualizado automaticamente |
| `deleted_at` | datetime | Preenchido no soft delete (null = ativo) |

> `password` e `deleted_at` **nunca** são retornados nas respostas da API.

---

## Exemplos com curl

### Criar usuário

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"John Doe\", \"email\": \"john@example.com\", \"password\": \"secret123\"}"
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"john@example.com\", \"password\": \"secret123\"}"
```

### Listar com paginação

```bash
curl "http://localhost:3000/api/users?page=1&limit=10"
```

### Buscar por ID

```bash
curl http://localhost:3000/api/users/<id>
```

### Atualizar

```bash
curl -X PUT http://localhost:3000/api/users/<id> \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"John Updated\"}"
```

### Deletar (requer token)

```bash
curl -X DELETE http://localhost:3000/api/users/<id> \
  -H "Authorization: Bearer <token>"
```

---

## Testes

```bash
# Rodar todos os testes
npm test

# Com relatório de cobertura
npm run test:coverage
```

| Suite | Tipo | O que cobre |
|-------|------|-------------|
| `auth.middleware.test.js` | Unitário | Token válido, ausente, expirado, inválido, secret errado |
| `requestId.middleware.test.js` | Unitário | Geração de UUID, reuso de header, propagação |
| `validate.middleware.test.js` | Unitário | Validação Zod, erros múltiplos, transformações |
| `user.model.test.js` | Unitário | create, findAll (paginado), findById, findByEmail, update, delete |
| `user.schemas.test.js` | Unitário | Schemas Zod de create e update |
| `auth.routes.test.js` | Integração | Login, campos faltando, credenciais inválidas, fluxo completo |
| `cache.test.js` | Integração | Hit/miss de cache, invalidação por escrita |
| `pagination.test.js` | Integração | Metadados de paginação, page/limit, cap de 100 |
| `softdelete.test.js` | Integração | Usuário deletado invisível, login bloqueado, contagem correta |
| `users.routes.test.js` | Integração | CRUD completo, validações, 404, 409, proteção JWT |

> Os testes usam banco SQLite **em memória** — nenhum arquivo é criado ou modificado.

---

## Licença

MIT
