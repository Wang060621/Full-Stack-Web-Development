const users = require('../models/user.server.models');
const passwords = require('../lib/passwords');
const validators = require('../validators/user.server.validators');

const errorResponse = (res, status, message) => res
    .status(status)
    .json({ error_message: message });

const createUser = async (req, res) => {
    const { error, value } = validators.validateCreateUser(req.body);
    if (error) return errorResponse(res, 400, error.details[0].message);

    try {
        const normalizedUser = {
            ...value,
            email: value.email.toLowerCase()
        };
        const { salt, passwordHash } = passwords.hashPassword(normalizedUser.password);
        const userId = await users.createUser({
            ...normalizedUser,
            password: passwordHash,
            salt
        });

        return res.status(201).json({ user_id: userId });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
            return errorResponse(res, 400, 'An account with this email already exists');
        }
        console.error('Failed to create user:', err.message);
        return errorResponse(res, 500, 'Internal server error');
    }
};

const login = async (req, res) => {
    const { error, value } = validators.validateLogin(req.body);
    if (error) return errorResponse(res, 400, error.details[0].message);

    try {
        const user = await users.getUserByEmail(value.email.toLowerCase());
        if (!user || !passwords.passwordMatches(value.password, user.salt, user.password)) {
            return errorResponse(res, 400, 'Invalid email or password');
        }

        const sessionToken = user.session_token || passwords.newSessionToken();
        if (!user.session_token) {
            await users.setSessionToken(user.user_id, sessionToken);
        }

        return res.status(200).json({
            user_id: user.user_id,
            session_token: sessionToken
        });
    } catch (err) {
        console.error('Failed to log in:', err.message);
        return errorResponse(res, 500, 'Internal server error');
    }
};

const logout = async (req, res) => {
    const token = req.get('X-Authorization');
    if (!token) return res.sendStatus(401);

    try {
        const user = await users.getUserByToken(token);
        if (!user) return res.sendStatus(401);

        await users.setSessionToken(user.user_id, null);
        return res.sendStatus(200);
    } catch (err) {
        console.error('Failed to log out:', err.message);
        return errorResponse(res, 500, 'Internal server error');
    }
};

const getUserProfile = async (req, res) => {
    const userId = Number(req.params.user_id);
    if (!Number.isSafeInteger(userId) || userId < 1) return res.sendStatus(404);

    try {
        const user = await users.getUserById(userId);
        if (!user) return res.sendStatus(404);

        const now = Date.now();
        const [selling, biddingOn, auctionsEnded] = await Promise.all([
            users.getSellingItems(userId, now),
            users.getItemsBidOn(userId, now),
            users.getEndedItems(userId, now)
        ]);

        return res.status(200).json({
            user_id: user.user_id,
            first_name: user.first_name,
            last_name: user.last_name,
            selling,
            bidding_on: biddingOn,
            auctions_ended: auctionsEnded
        });
    } catch (err) {
        console.error('Failed to get user profile:', err.message);
        return errorResponse(res, 500, 'Internal server error');
    }
};

module.exports = {
    createUser,
    login,
    logout,
    getUserProfile
};
