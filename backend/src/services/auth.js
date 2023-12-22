const { hash, compare } = require('bcrypt');

module.exports = {
    generateHashValue: async (value) => {
        value = (typeof value !== 'string') ? value.toString() : value;
        const encryptedPassword = await hash(value, 10);
        return encryptedPassword;
    },

    compareHashPassword: async (password, passwordHash) => {
        const hashPassword = await compare(password, passwordHash);
        return hashPassword;
    },
}