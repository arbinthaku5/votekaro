function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: 'Validation error', details: error.details });
    req.validated = value;
    next();
  };
}

module.exports = { validate };
