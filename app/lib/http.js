const errorResponse = (res, status, message) => res
    .status(status)
    .json({ error_message: message });

const successResponse = (res, status, payload) => payload === undefined
    ? res.sendStatus(status)
    : res.status(status).json(payload);

const parsePositiveId = (value) => {
    if (!/^[1-9]\d*$/.test(String(value))) return null;

    const id = Number(value);
    return Number.isSafeInteger(id) ? id : null;
};

module.exports = {
    errorResponse,
    successResponse,
    parsePositiveId
};
