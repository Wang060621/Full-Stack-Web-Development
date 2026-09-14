const Joi = require('joi');

const integerOrIntegerString = Joi.alternatives().try(
    Joi.number().integer(),
    Joi.string().pattern(/^\d+$/)
);

const createItem = Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    description: Joi.string().trim().min(1).max(2000).required(),
    starting_bid: Joi.number().integer().min(0).required(),
    end_date: integerOrIntegerString.required(),
    category_ids: Joi.array()
        .items(Joi.number().integer().positive())
        .unique()
        .max(3)
        .default([])
}).unknown(false);

const addBid = Joi.object({
    amount: Joi.number().integer().min(0).required()
}).unknown(false);

const search = Joi.object({
    q: Joi.string().trim().min(1).max(100),
    status: Joi.string().valid('BID', 'OPEN', 'ARCHIVE'),
    category_id: Joi.number().integer().positive(),
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).default(0)
}).unknown(false);

const validateStrict = (schema, value) => schema.validate(value, {
    abortEarly: true,
    convert: false
});

module.exports = {
    validateCreateItem: (value) => validateStrict(createItem, value),
    validateAddBid: (value) => validateStrict(addBid, value),
    validateSearch: (value) => search.validate(value, {
        abortEarly: true,
        convert: true
    })
};
