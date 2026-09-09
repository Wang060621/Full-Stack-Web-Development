const controller = require('../controllers/item.server.controllers');
const auth = require('../middleware/authentication.server.middleware');

module.exports = (app) => {
    app.get('/search', controller.search);
    app.post('/item', auth.requireAuthentication, controller.createItem);
    app.get('/item/:item_id', controller.getItem);
    app.get('/item/:item_id/bid', controller.getBidHistory);
    app.post('/item/:item_id/bid', auth.requireAuthentication, controller.addBid);
};
