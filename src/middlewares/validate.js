const { ZodError } = require('zod');

/**
 * Generic Zod validation middleware factory.
 * Usage: router.post('/', validate(mySchema), controller)
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate req.body against
 * @returns Express middleware
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = {};
      result.error.errors.forEach((err) => {
        const field = err.path.join('.');
        errors[field] = err.message;
      });

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    // Replace req.body with the parsed (and coerced) data
    req.body = result.data;
    next();
  };
}

module.exports = { validate };
