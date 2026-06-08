const Joi = require('joi');

const categorySchema = Joi.object({
  name: Joi.string().required(),
});

const validateCategory = (payload) => {
  const { error, value } = categorySchema.validate(payload);
  if (error) {
    const err = new Error(error.details[0].message);
    err.statusCode = 400;
    throw err;
  }
  return value;
};

module.exports = { validateCategory };