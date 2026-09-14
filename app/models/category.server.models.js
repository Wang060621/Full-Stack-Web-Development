const { all, get } = require('../lib/database');

const getCategories = () => all(
    `SELECT category_id, name
     FROM categories
     ORDER BY name COLLATE NOCASE ASC`
);

const countCategoriesByIds = async (categoryIds) => {
    if (!categoryIds.length) return 0;
    const placeholders = categoryIds.map(() => '?').join(', ');
    const row = await get(
        `SELECT COUNT(*) AS count
         FROM categories
         WHERE category_id IN (${placeholders})`,
        categoryIds
    );
    return row.count;
};

module.exports = { getCategories, countCategoriesByIds };
