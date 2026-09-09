const items = require('../models/item.server.models');
const questions = require('../models/question.server.models');
const validators = require('../validators/question.server.validators');
const { errorResponse, parsePositiveId } = require('../lib/http');

const askQuestion = async (req, res) => {
    const { error, value } = validators.validateQuestion(req.body);
    if (error) return errorResponse(res, 400, error.details[0].message);

    const itemId = parsePositiveId(req.params.item_id);
    if (!itemId) return res.sendStatus(404);

    try {
        const item = await items.getItemById(itemId);
        if (!item) return res.sendStatus(404);
        if (item.creator_id === req.authenticatedUser.user_id) return res.sendStatus(403);

        await questions.createQuestion(
            itemId,
            req.authenticatedUser.user_id,
            value.question_text
        );
        return res.sendStatus(200);
    } catch (err) {
        console.error('Failed to ask question:', err.message);
        return errorResponse(res, 500, 'Internal server error');
    }
};

const answerQuestion = async (req, res) => {
    const { error, value } = validators.validateAnswer(req.body);
    if (error) return errorResponse(res, 400, error.details[0].message);

    const questionId = parsePositiveId(req.params.question_id);
    if (!questionId) return res.sendStatus(404);

    try {
        const question = await questions.getQuestionById(questionId);
        if (!question) return res.sendStatus(404);
        if (question.creator_id !== req.authenticatedUser.user_id) return res.sendStatus(403);

        await questions.answerQuestion(questionId, value.answer_text);
        return res.sendStatus(200);
    } catch (err) {
        console.error('Failed to answer question:', err.message);
        return errorResponse(res, 500, 'Internal server error');
    }
};

const getQuestions = async (req, res) => {
    const itemId = parsePositiveId(req.params.item_id);
    if (!itemId) return res.sendStatus(404);

    try {
        const item = await items.getItemById(itemId);
        if (!item) return res.sendStatus(404);

        const result = await questions.getQuestionsForItem(itemId);
        return res.status(200).json(result);
    } catch (err) {
        console.error('Failed to get questions:', err.message);
        return errorResponse(res, 500, 'Internal server error');
    }
};

module.exports = {
    askQuestion,
    answerQuestion,
    getQuestions
};
