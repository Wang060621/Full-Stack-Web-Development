const blockedEnglishTerms = new Set([
    'asshole',
    'bastard',
    'bitch',
    'bollocks',
    'cunt',
    'dick',
    'fuck',
    'fucker',
    'motherfucker',
    'piss',
    'shit',
    'slut',
    'twat',
    'wanker',
    'whore'
]);

const blockedChineseTerms = ['傻逼', '操你妈', '草泥马', '妈的', '狗屎'];

const substitutions = {
    '0': 'o',
    '1': 'i',
    '3': 'e',
    '4': 'a',
    '5': 's',
    '7': 't',
    '@': 'a',
    '$': 's',
    '!': 'i'
};

const normalizeToken = (token) => token
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[013457@$!]/g, (character) => substitutions[character])
    .replace(/[^\p{L}\p{N}]/gu, '');

const containsBlockedContent = (value) => {
    if (typeof value !== 'string') return false;

    const normalized = value.normalize('NFKC').toLowerCase();
    if (blockedChineseTerms.some((term) => normalized.includes(term))) return true;

    return normalized
        .split(/\s+/u)
        .map(normalizeToken)
        .filter(Boolean)
        .some((token) => blockedEnglishTerms.has(token));
};

const fieldsContainBlockedContent = (...values) => values.some(containsBlockedContent);

module.exports = {
    containsBlockedContent,
    fieldsContainBlockedContent
};
