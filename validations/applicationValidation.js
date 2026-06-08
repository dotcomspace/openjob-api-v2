const Joi = require('joi');

const applicationSchema = Joi.object({
  user_id: Joi.string().required(),
  job_id: Joi.string().required(),
  status: Joi.string().optional() // Default-nya 'pending' kalau tidak diisi
});

const updateStatusSchema = Joi.object({
  status: Joi.string().required()
});

const validateApplication = (payload) => {
  const { error, value } = applicationSchema.validate(payload);
  if (error) {
    const err = new Error(error.details[0].message);
    err.statusCode = 400; throw err;
  }
  return value;
};

const validateUpdateStatus = (payload) => {
  const { error, value } = updateStatusSchema.validate(payload);
  if (error) {
    const err = new Error(error.details[0].message);
    err.statusCode = 400; throw err;
  }
  return value;
};

module.exports = { validateApplication, validateUpdateStatus };