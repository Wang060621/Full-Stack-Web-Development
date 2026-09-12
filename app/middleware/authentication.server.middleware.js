const users = require('../models/user.server.models');
const { errorResponse } = require('../lib/http');

const requireAuthentication = async (req, res, next) => {
    const token = req.get('X-Authorization');
    if (!token) return errorResponse(res, 401, 'Authentication required');

    try {
        const user = await users.getUserByToken(token);
        if (!user) return errorResponse(res, 401, 'Invalid session');

        req.authenticatedUser = user;
        return next();
    } catch (err) {
        console.error('Failed to authenticate request:', err.message);
        return errorResponse(res, 500, 'Internal server error');
    }
};

module.exports = {
    requireAuthentication
};
