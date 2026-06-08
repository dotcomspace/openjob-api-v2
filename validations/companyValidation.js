const Joi = require('joi');

const companySchema = Joi.object({
  name: Joi.string().required(),
  location: Joi.string().required(),
  description: Joi.string().allow('', null).optional(),
});

const validateCompany = (payload) => {
  const { error, value } = companySchema.validate(payload);
  if (error) {
    const err = new Error(error.details[0].message);
    err.statusCode = 400;
    throw err;
  }
  return value;
};

module.exports = { validateCompany };