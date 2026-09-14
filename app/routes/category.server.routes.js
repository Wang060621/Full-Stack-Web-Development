const controller = require('../controllers/category.server.controllers');

module.exports = (app) => {
    app.get('/categories', controller.getCategories);
};
