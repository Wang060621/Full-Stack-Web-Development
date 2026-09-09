const errorResponse = (res, status, message) => res
    .status(status)
    .json({ error_message: message });

const parsePositiveId = (value) => {
    if (!/^[1-9]\d*$/.test(String(value))) return null;

    const id = Number(value);
    return Number.isSafeInteger(id) ? id : null;
};

module.exports = {
    errorResponse,
    parsePositiveId
};
