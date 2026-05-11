const { z } = require('zod');

const createUserSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be at most 100 characters')
    .trim(),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(72, 'Password must be at most 72 characters'),
});

const updateUserSchema = z
  .object({
    name: z.string().min(1, 'Name cannot be empty').max(100).trim().optional(),
    email: z.string().email('Invalid email format').toLowerCase().optional(),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(72)
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field (name, email, password) must be provided',
  });

module.exports = { createUserSchema, updateUserSchema };
