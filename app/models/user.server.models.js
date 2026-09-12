const { run, get, all } = require('../lib/database');

const createUser = async ({ first_name, last_name, email, password, salt }) => {
    const result = await run(
        `INSERT INTO users (first_name, last_name, email, password, salt)
         VALUES (?, ?, ?, ?, ?)`,
        [first_name, last_name, email, password, salt]
    );
    return result.id;
};

const getUserByEmail = (email) => get(
    `SELECT user_id, first_name, last_name, email, password, salt, session_token
     FROM users
     WHERE email = ?`,
    [email]
);

const getUserByToken = (token) => get(
    `SELECT user_id, first_name, last_name, email
     FROM users
     WHERE session_token = ?`,
    [token]
);

const setSessionToken = (userId, token) => run(
    'UPDATE users SET session_token = ? WHERE user_id = ?',
    [token, userId]
);

const getUserById = (userId) => get(
    'SELECT user_id, first_name, last_name FROM users WHERE user_id = ?',
    [userId]
);

const itemSummarySql = `
    SELECT DISTINCT
        i.item_id,
        i.name,
        i.description,
        i.end_date,
        i.creator_id,
        u.first_name,
        u.last_name
    FROM items i
    JOIN users u ON u.user_id = i.creator_id`;

const getSellingItems = (userId, now) => all(
    `${itemSummarySql}
     WHERE i.creator_id = ? AND i.end_date > ?
     ORDER BY i.item_id ASC`,
    [userId, now]
);

const getEndedItems = (userId, now) => all(
    `${itemSummarySql}
     WHERE i.creator_id = ? AND i.end_date <= ?
     ORDER BY i.item_id ASC`,
    [userId, now]
);

const getItemsBidOn = (userId, now) => all(
    `${itemSummarySql}
     JOIN bids b ON b.item_id = i.item_id
     WHERE b.user_id = ? AND i.end_date > ?
     ORDER BY i.item_id ASC`,
    [userId, now]
);

module.exports = {
    createUser,
    getUserByEmail,
    getUserByToken,
    setSessionToken,
    getUserById,
    getSellingItems,
    getEndedItems,
    getItemsBidOn
};
