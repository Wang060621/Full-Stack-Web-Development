const controller = require('../controllers/user.server.controllers');
const auth = require('../middleware/authentication.server.middleware');

module.exports = (app) => {
    app.post('/users', controller.createUser);
    app.post('/login', controller.login);
    app.post('/logout', controller.logout);
    app.get('/users/:user_id/bids', auth.requireAuthentication, controller.getUserBidHistory);
    app.get('/users/:user_id', controller.getUserProfile);
};
