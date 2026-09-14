const categories = require('../models/category.server.models');
const { errorResponse, successResponse } = require('../lib/http');

const getCategories = async (_req, res) => {
    try {
        return successResponse(res, 200, await categories.getCategories());
    } catch (err) {
        console.error('Failed to get categories:', err.message);
        return errorResponse(res, 500, 'Internal server error');
    }
};

module.exports = { getCategories };
