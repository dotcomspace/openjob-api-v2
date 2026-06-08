const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const tokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const validateLogin = (payload) => {
  const { error, value } = loginSchema.validate(payload);
  if (error) {
    const err = new Error(error.details[0].message);
    err.statusCode = 400;
    throw err;
  }
  return value;
};

const validateToken = (payload) => {
  const { error, value } = tokenSchema.validate(payload);
  if (error) {
    const err = new Error(error.details[0].message);
    err.statusCode = 400;
    throw err;
  }
  return value;
};

module.exports = { validateLogin, validateToken };