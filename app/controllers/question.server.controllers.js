const items = require('../models/item.server.models');
const questions = require('../models/question.server.models');
const validators = require('../validators/question.server.validators');
const { containsBlockedContent } = require('../lib/content-filter');
const { errorResponse, successResponse, parsePositiveId } = require('../lib/http');

const askQuestion = async (req, res) => {
    const { error, value } = validators.validateQuestion(req.body);
    if (error) return errorResponse(res, 400, error.details[0].message);
    if (containsBlockedContent(value.question_text)) {
        return errorResponse(res, 400, 'Question contains language that is not allowed');
    }

    const itemId = parsePositiveId(req.params.item_id);
    if (!itemId) return errorResponse(res, 404, 'Item not found');

    try {
        const item = await items.getItemById(itemId);
        if (!item) return errorResponse(res, 404, 'Item not found');
        if (item.creator_id === req.authenticatedUser.user_id) {
            return errorResponse(res, 403, 'You cannot question your own item');
        }

        await questions.createQuestion(
            itemId,
            req.authenticatedUser.user_id,
            value.question_text
        );
        return successResponse(res, 200);
    } catch (err) {
        console.error('Failed to ask question:', err.message);
        return errorResponse(res, 500, 'Internal server error');
    }
};

const answerQuestion = async (req, res) => {
    const { error, value } = validators.validateAnswer(req.body);
    if (error) return errorResponse(res, 400, error.details[0].message);
    if (containsBlockedContent(value.answer_text)) {
        return errorResponse(res, 400, 'Answer contains language that is not allowed');
    }

    const questionId = parsePositiveId(req.params.question_id);
    if (!questionId) return errorResponse(res, 404, 'Question not found');

    try {
        const question = await questions.getQuestionById(questionId);
        if (!question) return errorResponse(res, 404, 'Question not found');
        if (question.creator_id !== req.authenticatedUser.user_id) {
            return errorResponse(res, 403, 'Only the seller can answer this question');
        }

        await questions.answerQuestion(questionId, value.answer_text);
        return successResponse(res, 200);
    } catch (err) {
        console.error('Failed to answer question:', err.message);
        return errorResponse(res, 500, 'Internal server error');
    }
};

const getQuestions = async (req, res) => {
    const itemId = parsePositiveId(req.params.item_id);
    if (!itemId) return errorResponse(res, 404, 'Item not found');

    try {
        const item = await items.getItemById(itemId);
        if (!item) return errorResponse(res, 404, 'Item not found');

        const result = await questions.getQuestionsForItem(itemId);
        return successResponse(res, 200, result);
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
