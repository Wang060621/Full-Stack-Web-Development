const chai = require('chai');
const chaiHttp = require('chai-http');

const expect = chai.expect;
chai.use(chaiHttp);

const goodUserData = require('./data/good_user_data.json');

const SERVER_URL = 'http://localhost:3333';
let ownerToken = '';
let bidderToken = '';

describe('Private user bid history', () => {
    before(async () => {
        const [owner, bidder] = await Promise.all([
            chai.request(SERVER_URL).post('/login').send({
                email: goodUserData[0].email,
                password: goodUserData[0].password
            }),
            chai.request(SERVER_URL).post('/login').send({
                email: goodUserData[1].email,
                password: goodUserData[1].password
            })
        ]);
        ownerToken = owner.body.session_token;
        bidderToken = bidder.body.session_token;
    });

    it('rejects unauthenticated requests', async () => {
        const response = await chai.request(SERVER_URL).get('/users/2/bids');
        expect(response).to.have.status(401);
    });

    it('does not expose another user bid history', async () => {
        const response = await chai.request(SERVER_URL)
            .get('/users/2/bids')
            .set('X-Authorization', ownerToken);
        expect(response).to.have.status(403);
    });

    it('returns the authenticated user bid ledger with lot context', async () => {
        const response = await chai.request(SERVER_URL)
            .get('/users/2/bids')
            .set('X-Authorization', bidderToken);

        expect(response).to.have.status(200);
        expect(response.body).to.be.an('array').that.is.not.empty;
        expect(response.body[0]).to.include.all.keys(
            'bid_id',
            'item_id',
            'name',
            'amount',
            'timestamp',
            'current_bid',
            'current_bid_holder_id',
            'bid_count',
            'categories'
        );
        expect(response.body[0].categories).to.be.an('array');
    });
});
