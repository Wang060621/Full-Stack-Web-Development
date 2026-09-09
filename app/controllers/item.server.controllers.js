const items = require('../models/item.server.models');
const validators = require('../validators/core.server.validators');
const { errorResponse, parsePositiveId } = require('../lib/http');

const createItem = async (req, res) => {
    const { error, value } = validators.validateCreateItem(req.body);
    if (error) return errorResponse(res, 400, error.details[0].message);

    const endDate = Number(value.end_date);
    if (!Number.isSafeInteger(endDate) || endDate <= Date.now()) {
        return errorResponse(res, 400, 'end_date must be an integer in the future');
    }

    try {
        const itemId = await items.createItem({
            ...value,
            end_date: endDate,
            creator_id: req.authenticatedUser.user_id
        });
        return res.status(201).json({ item_id: itemId });
    } catch (err) {
        console.error('Failed to create item:', err.message);
        return errorResponse(res, 500, 'Internal server error');
    }
};

const getItem = async (req, res) => {
    const itemId = parsePositiveId(req.params.item_id);
    if (!itemId) return res.sendStatus(404);

    try {
        const item = await items.getItemById(itemId);
        if (!item) return res.sendStatus(404);

        const currentBidHolder = item.current_bid_holder_id === null
            ? null
            : {
                user_id: item.current_bid_holder_id,
                first_name: item.current_bid_holder_first_name,
                last_name: item.current_bid_holder_last_name
            };

        return res.status(200).json({
            item_id: item.item_id,
            name: item.name,
            description: item.description,
            starting_bid: item.starting_bid,
            start_date: item.start_date,
            end_date: item.end_date,
            creator_id: item.creator_id,
            first_name: item.first_name,
            last_name: item.last_name,
            current_bid: item.current_bid === null ? item.starting_bid : item.current_bid,
            current_bid_holder: currentBidHolder
        });
    } catch (err) {
        console.error('Failed to get item:', err.message);
        return errorResponse(res, 500, 'Internal server error');
    }
};

const getBidHistory = async (req, res) => {
    const itemId = parsePositiveId(req.params.item_id);
    if (!itemId) return res.sendStatus(404);

    try {
        const item = await items.getItemById(itemId);
        if (!item) return res.sendStatus(404);

        const bids = await items.getBidHistory(itemId);
        return res.status(200).json(bids);
    } catch (err) {
        console.error('Failed to get bid history:', err.message);
        return errorResponse(res, 500, 'Internal server error');
    }
};

const addBid = async (req, res) => {
    const { error, value } = validators.validateAddBid(req.body);
    if (error) return errorResponse(res, 400, error.details[0].message);

    const itemId = parsePositiveId(req.params.item_id);
    if (!itemId) return res.sendStatus(404);

    try {
        const item = await items.getItemById(itemId);
        if (!item) return res.sendStatus(404);
        if (item.creator_id === req.authenticatedUser.user_id) return res.sendStatus(403);
        if (item.end_date <= Date.now()) {
            return errorResponse(res, 400, 'Bidding has closed for this item');
        }

        const currentBid = item.current_bid === null ? item.starting_bid : item.current_bid;
        if (value.amount <= currentBid) {
            return errorResponse(res, 400, 'Bid must be greater than the current bid');
        }

        await items.addBid(itemId, req.authenticatedUser.user_id, value.amount);
        return res.sendStatus(201);
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
            return errorResponse(res, 400, 'This bid could not be accepted');
        }
        console.error('Failed to add bid:', err.message);
        return errorResponse(res, 500, 'Internal server error');
    }
};

const search = async (req, res) => {
    const { error, value } = validators.validateSearch(req.query);
    if (error) return errorResponse(res, 400, error.details[0].message);

    let authenticatedUser = null;
    if (value.status) {
        const token = req.get('X-Authorization');
        if (!token) return errorResponse(res, 400, 'A valid session is required for status filters');

        try {
            const users = require('../models/user.server.models');
            authenticatedUser = await users.getUserByToken(token);
        } catch (err) {
            console.error('Failed to authenticate search:', err.message);
            return errorResponse(res, 500, 'Internal server error');
        }

        if (!authenticatedUser) {
            return errorResponse(res, 400, 'A valid session is required for status filters');
        }
    }

    try {
        const results = await items.searchItems({
            ...value,
            userId: authenticatedUser?.user_id,
            now: Date.now()
        });
        return res.status(200).json(results);
    } catch (err) {
        console.error('Failed to search items:', err.message);
        return errorResponse(res, 500, 'Internal server error');
    }
};

module.exports = {
    createItem,
    getItem,
    getBidHistory,
    addBid,
    search
};
