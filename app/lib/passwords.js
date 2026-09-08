const crypto = require('crypto');

const KEY_LENGTH = 64;
const ITERATIONS = 120000;
const DIGEST = 'sha512';

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => ({
    salt,
    passwordHash: crypto
        .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST)
        .toString('hex')
});

const passwordMatches = (password, salt, expectedHash) => {
    const actualHash = hashPassword(password, salt).passwordHash;
    const actualBuffer = Buffer.from(actualHash, 'hex');
    const expectedBuffer = Buffer.from(expectedHash, 'hex');

    return actualBuffer.length === expectedBuffer.length
        && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
};

const newSessionToken = () => crypto.randomBytes(16).toString('hex');

module.exports = {
    hashPassword,
    passwordMatches,
    newSessionToken
};
