const Joi = require('joi');

const jobSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  company_id: Joi.string().required(),
  category_id: Joi.string().required(),
  job_type: Joi.string().optional(),
  experience_level: Joi.string().optional(),
  location_type: Joi.string().optional(),
  location_city: Joi.string().optional(),
  salary_min: Joi.number().optional(),
  salary_max: Joi.number().optional(),
  is_salary_visible: Joi.boolean().optional(),
  status: Joi.string().optional()
});

const validateJob = (payload) => {
  const { error, value } = jobSchema.validate(payload);
  if (error) {
    const err = new Error(error.details[0].message);
    err.statusCode = 400;
    throw err;
  }
  return value;
};

module.exports = { validateJob };