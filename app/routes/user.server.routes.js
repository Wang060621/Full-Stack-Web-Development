const controller = require('../controllers/user.server.controllers');

module.exports = (app) => {
    app.post('/users', controller.createUser);
    app.post('/login', controller.login);
    app.post('/logout', controller.logout);
    app.get('/users/:user_id', controller.getUserProfile);
};
