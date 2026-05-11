# User Login Node API

REST API for user management built with **Node.js**, **Express**, **SQLite** and documented with **Scalar**. The DELETE endpoint is protected with **JWT authentication**.

## Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** SQLite (via sql.js — pure JavaScript, no native binaries)
- **Password hashing:** bcryptjs
- **Authentication:** JSON Web Token (jsonwebtoken)
- **Documentation:** Scalar (OpenAPI 3.1)
- **Architecture:** MVC

## Project Structure

```
src/
├── controllers/
│   ├── AuthController.js     # Login handler
│   └── UserController.js     # CRUD handlers
├── database/
│   ├── database.js           # SQLite connection (sql.js)
│   └── migrations.js         # Table creation
├── docs/
│   └── openapi.js            # OpenAPI 3.1 spec
├── middlewares/
│   └── auth.js               # JWT authentication middleware
├── models/
│   └── User.js               # Data access layer
├── routes/
│   ├── index.js              # Route aggregator
│   ├── authRoutes.js         # Auth routes
│   └── userRoutes.js         # User routes
├── app.js                    # Express app setup
└── server.js                 # Entry point
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set a strong `JWT_SECRET`:

```env
PORT=3000
JWT_SECRET=change_this_to_a_strong_random_secret
JWT_EXPIRES_IN=1d
```

### 3. Start the server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server starts on `http://localhost:3000` by default.

## API Documentation

After starting the server, access the interactive Scalar docs at:

```
http://localhost:3000/docs
```

Raw OpenAPI spec (JSON):

```
http://localhost:3000/openapi.json
```

## Endpoints

| Method | Endpoint          | Auth required | Description        |
|--------|-------------------|---------------|--------------------|
| POST   | /api/auth/login   | No            | Login, get JWT     |
| GET    | /api/users        | No            | List all users     |
| GET    | /api/users/:id    | No            | Get user by ID     |
| POST   | /api/users        | No            | Create a new user  |
| PUT    | /api/users/:id    | No            | Update a user      |
| DELETE | /api/users/:id    | **Yes (JWT)** | Delete a user      |
| GET    | /health           | No            | Health check       |

## Authentication

The DELETE endpoint requires a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

### Flow

1. Create a user via `POST /api/users`
2. Login via `POST /api/auth/login` to receive a token
3. Use the token in the `Authorization` header to call `DELETE /api/users/:id`

## User Schema

| Field      | Type     | Description                        |
|------------|----------|------------------------------------|
| id         | UUID     | Auto-generated unique identifier   |
| name       | string   | User's full name (required)        |
| email      | string   | Unique email address (required)    |
| password   | string   | Stored as bcrypt hash (required)   |
| created_at | datetime | Creation timestamp (auto)          |
| updated_at | datetime | Last update timestamp (auto)       |

> Passwords are **never** returned in API responses.

## Request Examples

### Create user

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

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "...", "name": "John Doe", "email": "john@example.com" }
}
```

### Delete user (authenticated)

```bash
curl -X DELETE http://localhost:3000/api/users/<id> \
  -H "Authorization: Bearer <token>"
```

### List users

```bash
curl http://localhost:3000/api/users
```

### Get user by ID

```bash
curl http://localhost:3000/api/users/<id>
```

### Update user

```bash
curl -X PUT http://localhost:3000/api/users/<id> \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"John Updated\"}"
```

## License

MIT
