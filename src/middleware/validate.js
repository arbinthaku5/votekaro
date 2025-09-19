// function validate(schema) {
//   return (req, res, next) => {
//     const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
//     if (error) return res.status(400).json({ message: 'Validation error', details: error.details });
//     req.validated = value;
//     next();
//   };
// }

// module.exports = { validate };


const { ZodError } = require("zod");

function validate(schema) {
  return (req, res, next) => {
    try {
      const result = schema.parse(req.body);
      req.validated = result;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: err.errors.map(e => ({
            field: e.path.join("."),
            message: e.message
          }))
        });
      }
      next(err);
    }
  };
}

module.exports = { validate };

