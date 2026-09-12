const { run, get, all } = require('../lib/database');

const createQuestion = async (itemId, userId, questionText) => {
    const result = await run(
        `INSERT INTO questions (question, answer, asked_by, item_id)
         VALUES (?, NULL, ?, ?)`,
        [questionText, userId, itemId]
    );
    return result.id;
};

const getQuestionById = (questionId) => get(
    `SELECT q.question_id, q.question, q.answer, q.asked_by, q.item_id,
            i.creator_id
     FROM questions q
     JOIN items i ON i.item_id = q.item_id
     WHERE q.question_id = ?`,
    [questionId]
);

const answerQuestion = (questionId, answerText) => run(
    'UPDATE questions SET answer = ? WHERE question_id = ?',
    [answerText, questionId]
);

const getQuestionsForItem = (itemId) => all(
    `SELECT
        question_id,
        question AS question_text,
        answer AS answer_text
     FROM questions
     WHERE item_id = ?
     ORDER BY question_id DESC`,
    [itemId]
);

module.exports = {
    createQuestion,
    getQuestionById,
    answerQuestion,
    getQuestionsForItem
};
