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

const categoryColumns = `
        (SELECT GROUP_CONCAT(c.category_id || ':' || c.name, '||')
         FROM item_categories ic
         JOIN categories c ON c.category_id = ic.category_id
         WHERE ic.item_id = i.item_id) AS categories_data`;

const attachCategories = (row) => {
    if (!row) return row;
    const categories = row.categories_data
        ? row.categories_data.split('||').map((entry) => {
            const separator = entry.indexOf(':');
            return {
                category_id: Number(entry.slice(0, separator)),
                name: entry.slice(separator + 1)
            };
        })
        : [];
    const { categories_data, ...result } = row;
    return { ...result, categories };
};

const itemSummarySql = `
    SELECT DISTINCT
        i.item_id,
        i.name,
        i.description,
        i.starting_bid,
        i.end_date,
        i.creator_id,
        u.first_name,
        u.last_name,
        COALESCE((SELECT MAX(b.amount) FROM bids b WHERE b.item_id = i.item_id), i.starting_bid) AS current_bid,
        (SELECT COUNT(*) FROM bids b WHERE b.item_id = i.item_id) AS bid_count,
        ${categoryColumns}
    FROM items i
    JOIN users u ON u.user_id = i.creator_id`;

const getSellingItems = (userId, now) => all(
    `${itemSummarySql}
     WHERE i.creator_id = ? AND i.end_date > ?
     ORDER BY i.item_id ASC`,
    [userId, now]
).then((rows) => rows.map(attachCategories));

const getEndedItems = (userId, now) => all(
    `${itemSummarySql}
     WHERE i.creator_id = ? AND i.end_date <= ?
     ORDER BY i.item_id ASC`,
    [userId, now]
).then((rows) => rows.map(attachCategories));

const getItemsBidOn = (userId, now) => all(
    `${itemSummarySql}
     JOIN bids b ON b.item_id = i.item_id
     WHERE b.user_id = ? AND i.end_date > ?
     ORDER BY i.item_id ASC`,
    [userId, now]
).then((rows) => rows.map(attachCategories));

const getUserBidHistory = (userId) => all(
    `SELECT
        b.rowid AS bid_id,
        b.item_id,
        b.amount,
        b.timestamp,
        i.name,
        i.description,
        i.starting_bid,
        i.end_date,
        i.creator_id,
        seller.first_name,
        seller.last_name,
        COALESCE((SELECT MAX(all_bids.amount) FROM bids all_bids WHERE all_bids.item_id = i.item_id), i.starting_bid) AS current_bid,
        (SELECT COUNT(*) FROM bids all_bids WHERE all_bids.item_id = i.item_id) AS bid_count,
        (SELECT highest.user_id
         FROM bids highest
         WHERE highest.item_id = i.item_id
         ORDER BY highest.amount DESC, highest.timestamp DESC, highest.rowid DESC
         LIMIT 1) AS current_bid_holder_id,
        ${categoryColumns}
     FROM bids b
     JOIN items i ON i.item_id = b.item_id
     JOIN users seller ON seller.user_id = i.creator_id
     WHERE b.user_id = ?
     ORDER BY b.timestamp DESC, b.rowid DESC`,
    [userId]
).then((rows) => rows.map(attachCategories));

module.exports = {
    createUser,
    getUserByEmail,
    getUserByToken,
    setSessionToken,
    getUserById,
    getSellingItems,
    getEndedItems,
    getItemsBidOn,
    getUserBidHistory
};
