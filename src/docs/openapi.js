const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'User Login API',
    version: '1.0.0',
    description:
      'REST API for user management built with Node.js, Express and SQLite. Provides full CRUD operations for users.',
    contact: {
      name: 'API Support',
      email: 'support@example.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Local development server',
    },
  ],
  tags: [
    {
      name: 'Users',
      description: 'User management endpoints',
    },
  ],
  paths: {
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List all users',
        description: 'Returns a list of all registered users. Passwords are never returned.',
        operationId: 'listUsers',
        responses: {
          200: {
            description: 'List of users returned successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    total: { type: 'integer', example: 2 },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
          },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Create a new user',
        description: 'Creates a new user. The password is stored as a bcrypt hash.',
        operationId: 'createUser',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateUser' },
              example: {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'secret123',
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/ValidationError' },
          409: { $ref: '#/components/responses/ConflictError' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get a user by ID',
        description: 'Returns a single user by their UUID.',
        operationId: 'getUserById',
        parameters: [{ $ref: '#/components/parameters/UserId' }],
        responses: {
          200: {
            description: 'User found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFoundError' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Update a user',
        description: 'Updates one or more fields of an existing user. All fields are optional.',
        operationId: 'updateUser',
        parameters: [{ $ref: '#/components/parameters/UserId' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUser' },
              example: {
                name: 'John Updated',
                email: 'john.updated@example.com',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'User updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/ValidationError' },
          404: { $ref: '#/components/responses/NotFoundError' },
          409: { $ref: '#/components/responses/ConflictError' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete a user',
        description: 'Permanently deletes a user by their UUID.',
        operationId: 'deleteUser',
        parameters: [{ $ref: '#/components/parameters/UserId' }],
        responses: {
          200: {
            description: 'User deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User deleted successfully' },
                  },
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFoundError' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          created_at: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00.000Z' },
          updated_at: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00.000Z' },
        },
      },
      CreateUser: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 1, example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          password: { type: 'string', minLength: 6, example: 'secret123' },
        },
      },
      UpdateUser: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, example: 'John Updated' },
          email: { type: 'string', format: 'email', example: 'john.updated@example.com' },
          password: { type: 'string', minLength: 6, example: 'newpassword123' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error message' },
        },
      },
    },
    parameters: {
      UserId: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'User UUID',
        schema: { type: 'string', format: 'uuid' },
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      },
    },
    responses: {
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'User not found' },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'Validation error', errors: { name: 'Name is required' } },
          },
        },
      },
      ConflictError: {
        description: 'Conflict - resource already exists',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'Email already in use' },
          },
        },
      },
      InternalError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'Internal server error' },
          },
        },
      },
    },
  },
};

module.exports = openApiSpec;
