const controller = require('../controllers/question.server.controllers');
const auth = require('../middleware/authentication.server.middleware');

module.exports = (app) => {
    app.get('/item/:item_id/question', controller.getQuestions);
    app.post('/item/:item_id/question', auth.requireAuthentication, controller.askQuestion);
    app.post('/question/:question_id', auth.requireAuthentication, controller.answerQuestion);
};
