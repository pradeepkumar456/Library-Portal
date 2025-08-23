const Joi = require("joi");

// ----------------- Admin Registration -----------------
const adminRegisterSchema = Joi.object({
  name: Joi.string().min(3).max(50).required()
    .messages({
      "string.empty": "Name is required",
      "string.min": "Name must be at least 3 characters",
      "string.max": "Name cannot exceed 50 characters"
    }),
  email: Joi.string().email().required()
    .messages({
      "string.empty": "Email is required",
      "string.email": "Enter a valid email address"
    }),
  password: Joi.string().min(6).required()
    .messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 6 characters"
    }),
  location: Joi.string().allow("").max(100)
    .messages({
      "string.max": "Location cannot exceed 100 characters"
    })
  // image will be handled via multer/cloudinary separately
});


// ----------------- Admin Login -----------------
const adminLoginSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({
      "string.empty": "Email is required",
      "string.email": "Enter a valid email"
    }),
  password: Joi.string().required()
    .messages({
      "string.empty": "Password is required"
    })
});


// ----------------- Admin Profile Update -----------------
const adminUpdateSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  location: Joi.string().allow("").max(100)
});

module.exports = {
  adminRegisterSchema,
  adminLoginSchema,
  adminUpdateSchema
};