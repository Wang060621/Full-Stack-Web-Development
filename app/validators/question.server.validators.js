const Joi = require('joi');

const question = Joi.object({
    question_text: Joi.string().trim().min(1).max(500).required()
}).unknown(false);

const answer = Joi.object({
    answer_text: Joi.string().trim().min(1).max(1000).required()
}).unknown(false);

const validate = (schema, value) => schema.validate(value, {
    abortEarly: true,
    convert: false
});

module.exports = {
    validateQuestion: (value) => validate(question, value),
    validateAnswer: (value) => validate(answer, value)
};
