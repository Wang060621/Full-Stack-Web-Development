const chai = require('chai');
const chaiHttp = require('chai-http');
const goodUsers = require('./data/good_user_data.json');

chai.use(chaiHttp);
const { expect } = chai;
const SERVER_URL = 'http://localhost:3333';

let sellerToken;
let buyerToken;
let categoryIds;
let itemId;
let questionId;

describe('Week 5 extensions', () => {
    before(async () => {
        const [seller, buyer] = await Promise.all([
            chai.request(SERVER_URL).post('/login').send({
                email: goodUsers[0].email,
                password: goodUsers[0].password
            }),
            chai.request(SERVER_URL).post('/login').send({
                email: goodUsers[1].email,
                password: goodUsers[1].password
            })
        ]);
        sellerToken = seller.body.session_token;
        buyerToken = buyer.body.session_token;
    });

    it('returns the seeded category catalogue', async () => {
        const res = await chai.request(SERVER_URL).get('/categories');
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array').with.length.of.at.least(7);
        expect(res.body[0]).to.have.all.keys('category_id', 'name');
        categoryIds = res.body.slice(0, 2).map((category) => category.category_id);
    });

    it('rejects sensitive content in a new auction', async () => {
        const res = await chai.request(SERVER_URL)
            .post('/item')
            .set('X-Authorization', sellerToken)
            .send({
                name: 'A sh!t record',
                description: 'This should be rejected.',
                starting_bid: 10,
                end_date: Date.now() + 86400000,
                category_ids: []
            });
        expect(res).to.have.status(400);
        expect(res.body.error_message).to.match(/not allowed/i);
    });

    it('rejects categories that do not exist', async () => {
        const res = await chai.request(SERVER_URL)
            .post('/item')
            .set('X-Authorization', sellerToken)
            .send({
                name: 'Unknown category record',
                description: 'Valid text but an invalid category reference.',
                starting_bid: 10,
                end_date: Date.now() + 86400000,
                category_ids: [999999]
            });
        expect(res).to.have.status(400);
    });

    it('creates one auction with multiple categories', async () => {
        const res = await chai.request(SERVER_URL)
            .post('/item')
            .set('X-Authorization', sellerToken)
            .send({
                name: 'Rare crossover pressing',
                description: 'A clean demonstration lot for category searching.',
                starting_bid: 25,
                end_date: Date.now() + 86400000,
                category_ids: categoryIds
            });
        expect(res).to.have.status(201);
        itemId = res.body.item_id;

        const detail = await chai.request(SERVER_URL).get(`/item/${itemId}`);
        expect(detail).to.have.status(200);
        expect(detail.body.categories.map((category) => category.category_id)).to.have.members(categoryIds);
    });

    it('filters auction search by category', async () => {
        const res = await chai.request(SERVER_URL).get(`/search?category_id=${categoryIds[0]}`);
        expect(res).to.have.status(200);
        expect(res.body.some((item) => item.item_id === itemId)).to.equal(true);
        expect(res.body.every((item) => item.categories.some(
            (category) => category.category_id === categoryIds[0]
        ))).to.equal(true);
    });

    it('rejects sensitive content in questions', async () => {
        const res = await chai.request(SERVER_URL)
            .post(`/item/${itemId}/question`)
            .set('X-Authorization', buyerToken)
            .send({ question_text: 'Is this record sh!t?' });
        expect(res).to.have.status(400);
        expect(res.body.error_message).to.match(/not allowed/i);
    });

    it('rejects sensitive content in answers', async () => {
        await chai.request(SERVER_URL)
            .post(`/item/${itemId}/question`)
            .set('X-Authorization', buyerToken)
            .send({ question_text: 'Does the sleeve have marks?' });

        const questions = await chai.request(SERVER_URL).get(`/item/${itemId}/question`);
        questionId = questions.body[0].question_id;

        const res = await chai.request(SERVER_URL)
            .post(`/question/${questionId}`)
            .set('X-Authorization', sellerToken)
            .send({ answer_text: 'It looks like sh!t.' });
        expect(res).to.have.status(400);
        expect(res.body.error_message).to.match(/not allowed/i);
    });
});
