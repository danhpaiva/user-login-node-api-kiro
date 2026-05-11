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
| Documentação | Scalar (OpenAPI 3.1) |
| Testes | Jest + Supertest |
| Arquitetura | MVC |

---

## Estrutura do projeto

```
user-login-node-api-kiro/
├── src/
│   ├── controllers/
│   │   ├── AuthController.js     # Lógica de login e geração de token
│   │   └── UserController.js     # Handlers do CRUD de usuários
│   ├── database/
│   │   ├── database.js           # Conexão SQLite (sql.js) + singleton
│   │   └── migrations.js         # Criação das tabelas
│   ├── docs/
│   │   └── openapi.js            # Spec OpenAPI 3.1 completa
│   ├── middlewares/
│   │   └── auth.js               # Middleware de autenticação JWT
│   ├── models/
│   │   └── User.js               # Camada de acesso a dados
│   ├── routes/
│   │   ├── index.js              # Agregador de rotas
│   │   ├── authRoutes.js         # Rotas de autenticação
│   │   └── userRoutes.js         # Rotas de usuários
│   ├── app.js                    # Configuração do Express
│   └── server.js                 # Entry point
├── tests/
│   ├── __mocks__/
│   │   └── @scalar/
│   │       └── express-api-reference.js  # Mock do Scalar para o Jest
│   ├── helpers/
│   │   └── setupDatabase.js      # Banco em memória isolado para testes
│   ├── unit/
│   │   ├── auth.middleware.test.js
│   │   └── user.model.test.js
│   └── integration/
│       ├── auth.routes.test.js
│       └── users.routes.test.js
├── .env.example
└── package.json
```

---

## Instalação

```bash
npm install
```

## Configuração

Copie o arquivo de exemplo e ajuste as variáveis:

```bash
cp .env.example .env
```

```env
PORT=3000
JWT_SECRET=troque_por_um_segredo_forte
JWT_EXPIRES_IN=1d
```

> Em produção, use um `JWT_SECRET` longo e aleatório. Nunca commite o `.env`.

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

Com o servidor rodando, acesse:

```
http://localhost:3000/docs
```

A interface Scalar permite explorar e testar todos os endpoints diretamente no browser, incluindo autenticação Bearer.

Spec OpenAPI em JSON:

```
http://localhost:3000/openapi.json
```

---

## Endpoints

### Autenticação

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/auth/login` | Não | Autentica e retorna um token JWT |

### Usuários

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/users` | Não | Lista todos os usuários |
| GET | `/api/users/:id` | Não | Busca um usuário por ID |
| POST | `/api/users` | Não | Cria um novo usuário |
| PUT | `/api/users/:id` | Não | Atualiza um usuário |
| DELETE | `/api/users/:id` | **Sim (JWT)** | Remove um usuário |

### Utilitários

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Health check da API |

---

## Autenticação JWT

Apenas o endpoint `DELETE /api/users/:id` exige autenticação.

**Fluxo:**

1. Crie um usuário via `POST /api/users`
2. Faça login via `POST /api/auth/login` e copie o `token` da resposta
3. Envie o token no header de todas as requisições protegidas:

```
Authorization: Bearer <token>
```

**Erros possíveis:**

| Status | Mensagem | Causa |
|--------|----------|-------|
| 401 | Authorization header missing or malformed | Header ausente ou sem `Bearer ` |
| 401 | Invalid token | Token inválido ou assinado com secret diferente |
| 401 | Token expired | Token expirado |

---

## Schema do usuário

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Gerado automaticamente |
| `name` | string | Nome completo (obrigatório) |
| `email` | string | E-mail único (obrigatório) |
| `password` | string | Armazenado como hash bcrypt (obrigatório) |
| `created_at` | datetime | Preenchido automaticamente |
| `updated_at` | datetime | Atualizado automaticamente |

> O campo `password` **nunca** é retornado nas respostas da API.

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

Resposta:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "...", "name": "John Doe", "email": "john@example.com" }
}
```

### Listar usuários

```bash
curl http://localhost:3000/api/users
```

### Buscar por ID

```bash
curl http://localhost:3000/api/users/<id>
```

### Atualizar usuário

```bash
curl -X PUT http://localhost:3000/api/users/<id> \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"John Updated\"}"
```

### Deletar usuário (requer token)

```bash
curl -X DELETE http://localhost:3000/api/users/<id> \
  -H "Authorization: Bearer <token>"
```

---

## Testes

```bash
# Rodar todos os testes
npm test

# Rodar com relatório de cobertura
npm run test:coverage
```

**Suites e cobertura:**

| Suite | Tipo | Testes |
|-------|------|--------|
| `auth.middleware.test.js` | Unitário | Token válido, ausente, expirado, inválido, secret errado |
| `user.model.test.js` | Unitário | create, findAll, findById, findByEmail, update, delete |
| `users.routes.test.js` | Integração | CRUD completo, validações, 404, 409, proteção JWT |
| `auth.routes.test.js` | Integração | Login, campos faltando, credenciais inválidas, fluxo completo |

> Os testes usam um banco SQLite **em memória**, completamente isolado do banco de desenvolvimento. Nenhum arquivo é criado ou modificado durante os testes.

---

## Licença

MIT
