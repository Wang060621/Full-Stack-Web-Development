const { run, get, all } = require('../lib/database');

const createItem = async ({ name, description, starting_bid, end_date, creator_id, category_ids = [] }) => {
    await run('BEGIN IMMEDIATE TRANSACTION');
    try {
        const result = await run(
            `INSERT INTO items
                (name, description, starting_bid, start_date, end_date, creator_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, description, starting_bid, Date.now(), end_date, creator_id]
        );
        for (const categoryId of category_ids) {
            await run(
                'INSERT INTO item_categories (item_id, category_id) VALUES (?, ?)',
                [result.id, categoryId]
            );
        }
        await run('COMMIT');
        return result.id;
    } catch (err) {
        await run('ROLLBACK');
        throw err;
    }
};

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
    const { categories_data, ...item } = row;
    return { ...item, categories };
};

const getItemById = (itemId) => get(
    `SELECT
        i.item_id,
        i.name,
        i.description,
        i.starting_bid,
        i.start_date,
        i.end_date,
        i.creator_id,
        seller.first_name,
        seller.last_name,
        highest.amount AS current_bid,
        bidder.user_id AS current_bid_holder_id,
        bidder.first_name AS current_bid_holder_first_name,
        bidder.last_name AS current_bid_holder_last_name,
        ${categoryColumns}
     FROM items i
     JOIN users seller ON seller.user_id = i.creator_id
     LEFT JOIN bids highest ON highest.rowid = (
        SELECT b.rowid
        FROM bids b
        WHERE b.item_id = i.item_id
        ORDER BY b.amount DESC, b.timestamp DESC, b.rowid DESC
        LIMIT 1
     )
     LEFT JOIN users bidder ON bidder.user_id = highest.user_id
     WHERE i.item_id = ?`,
    [itemId]
).then(attachCategories);

const getBidHistory = (itemId) => all(
    `SELECT
        b.item_id,
        b.amount,
        b.timestamp,
        b.user_id,
        u.first_name,
        u.last_name
     FROM bids b
     JOIN users u ON u.user_id = b.user_id
     WHERE b.item_id = ?
     ORDER BY b.amount DESC, b.timestamp DESC, b.rowid DESC`,
    [itemId]
);

const addBidIfHighest = (itemId, userId, amount) => run(
    `INSERT INTO bids (item_id, user_id, amount, timestamp)
     SELECT ?, ?, ?, ?
     WHERE ? > COALESCE(
        (SELECT MAX(b.amount) FROM bids b WHERE b.item_id = ?),
        (SELECT i.starting_bid FROM items i WHERE i.item_id = ?)
     )`,
    [itemId, userId, amount, Date.now(), amount, itemId, itemId]
);

const itemSummarySql = `
    SELECT DISTINCT
        i.item_id,
        i.name,
        i.description,
        i.end_date,
        i.creator_id,
        u.first_name,
        u.last_name,
        ${categoryColumns}
    FROM items i
    JOIN users u ON u.user_id = i.creator_id`;

const searchItems = ({ q, status, category_id, limit, offset, userId, now }) => {
    const joins = [];
    const conditions = [];
    const params = [];

    if (status === 'BID') {
        joins.push('JOIN bids search_bid ON search_bid.item_id = i.item_id');
        conditions.push('search_bid.user_id = ?');
        params.push(userId);
    } else if (status === 'OPEN') {
        conditions.push('i.creator_id = ?', 'i.end_date > ?');
        params.push(userId, now);
    } else if (status === 'ARCHIVE') {
        conditions.push('i.creator_id = ?', 'i.end_date <= ?');
        params.push(userId, now);
    }

    if (q !== undefined) {
        conditions.push("(i.name LIKE ? ESCAPE '\\' OR i.description LIKE ? ESCAPE '\\')");
        const escapedQuery = q.replace(/[\\%_]/g, '\\$&');
        params.push(`%${escapedQuery}%`, `%${escapedQuery}%`);
    }

    if (category_id !== undefined) {
        conditions.push(`EXISTS (
            SELECT 1 FROM item_categories category_filter
            WHERE category_filter.item_id = i.item_id
              AND category_filter.category_id = ?
        )`);
        params.push(category_id);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    return all(
        `${itemSummarySql}
         ${joins.join('\n')}
         ${where}
         ORDER BY i.item_id ASC
         LIMIT ? OFFSET ?`,
        params
    ).then((rows) => rows.map(attachCategories));
};

module.exports = {
    createItem,
    getItemById,
    getBidHistory,
    addBidIfHighest,
    searchItems
};
