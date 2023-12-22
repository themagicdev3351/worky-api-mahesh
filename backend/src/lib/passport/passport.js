const jwt = require('jsonwebtoken');

// const EXPIRES_IN_SECONDS = process.env.JWT_EXPIRATION_MINUTES || 3600 * 24; // 3600 = 1 hour, 3600 * 24 = 24 hours
const EXPIRES_IN_SECONDS = 3600 * 24; // 3600 = 1 hour, 3600 * 24 = 24 hours
const SECRET_KEY = process.env.JWT_SECRET || "EtU06SiPTHr9KSQn7DMlEWddAdmSjsAVa3rVQ9VjnRDm8bji28bG0ejU79KjQER";
const ALGORITHM = "HS256";

module.exports = {
    createToken: async (user, expiresIn = EXPIRES_IN_SECONDS) => {

        const token = jwt.sign({
            user: {
                id: user._id,
                email: user.email,
                type: user.type
            }
        }, SECRET_KEY, {
            algorithm: ALGORITHM,
            expiresIn: expiresIn,
        });

        return {
            token,
            expiresIn,
            isVerified: true,
        };
    },

    verifyToken: async (token, expireTime = EXPIRES_IN_SECONDS) => {
        try {
            const payload = jwt.verify(token, SECRET_KEY, {
                algorithm: ALGORITHM,
                expiresIn: expireTime
            });
            return payload.user;
        } catch (error) {
            return error;
        }
    }
};