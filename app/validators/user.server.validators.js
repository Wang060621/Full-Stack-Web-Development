const Joi = require('joi');

const password = Joi.string()
    .min(8)
    .max(32)
    .pattern(/[a-z]/, 'lowercase character')
    .pattern(/[A-Z]/, 'uppercase character')
    .pattern(/[0-9]/, 'number')
    .pattern(/[^A-Za-z0-9]/, 'special character')
    .required();

const createUser = Joi.object({
    first_name: Joi.string().trim().min(1).max(50).required(),
    last_name: Joi.string().trim().min(1).max(50).required(),
    email: Joi.string().trim().max(254).email({ tlds: { allow: false } }).required(),
    password
}).unknown(false);

const login = Joi.object({
    email: Joi.string().trim().max(254).email({ tlds: { allow: false } }).required(),
    password: Joi.string().min(1).required()
}).unknown(false);

const validate = (schema, value) => schema.validate(value, {
    abortEarly: true,
    convert: false
});

module.exports = {
    validateCreateUser: (value) => validate(createUser, value),
    validateLogin: (value) => validate(login, value)
};
