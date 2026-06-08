const Joi = require('joi');

const userRegisterSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(), // Tambahkan .min(6) di sini
  role: Joi.string().optional()
});

// Fungsi bantuan untuk menjalankan validasi
const validateUserRegistration = (payload) => {
  const { error, value } = userRegisterSchema.validate(payload);
  if (error) {
    // Melempar error agar ditangkap oleh error handler
    const validationError = new Error(error.details[0].message);
    validationError.statusCode = 400; // 400 Bad Request
    throw validationError;
  }
  return value;
};

module.exports = { validateUserRegistration };