# User Login Node API

REST API for user management built with **Node.js**, **Express**, **SQLite** and documented with **Scalar**.

## Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** SQLite (via better-sqlite3)
- **Password hashing:** bcryptjs
- **Documentation:** Scalar
- **Architecture:** MVC

## Project Structure

```
src/
├── controllers/
│   └── UserController.js   # Request handlers
├── database/
│   ├── database.js         # SQLite connection
│   └── migrations.js       # Table creation
├── docs/
│   └── openapi.js          # OpenAPI 3.1 spec
├── models/
│   └── User.js             # Data access layer
├── routes/
│   ├── index.js            # Route aggregator
│   └── userRoutes.js       # User routes
├── app.js                  # Express app setup
└── server.js               # Entry point
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment (optional)

```bash
cp .env.example .env
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

| Method | Endpoint        | Description        |
|--------|-----------------|--------------------|
| GET    | /api/users      | List all users     |
| GET    | /api/users/:id  | Get user by ID     |
| POST   | /api/users      | Create a new user  |
| PUT    | /api/users/:id  | Update a user      |
| DELETE | /api/users/:id  | Delete a user      |
| GET    | /health         | Health check       |

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
  -d '{"name": "John Doe", "email": "john@example.com", "password": "secret123"}'
```

### List users

```bash
curl http://localhost:3000/api/users
```

### Get user by ID

```bash
curl http://localhost:3000/api/users/<uuid>
```

### Update user

```bash
curl -X PUT http://localhost:3000/api/users/<uuid> \
  -H "Content-Type: application/json" \
  -d '{"name": "John Updated"}'
```

### Delete user

```bash
curl -X DELETE http://localhost:3000/api/users/<uuid>
```

## License

MIT
