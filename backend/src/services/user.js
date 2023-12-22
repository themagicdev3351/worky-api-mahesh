const path = require('path');
const { generateHashValue } = require('./auth');

module.exports = {
    find: async (search, skip, limit, sort) => {
        let list = await userModel.find(search).skip(skip).limit(limit).sort(sort).lean().exec();
        if (list && list.length) {
            list = await Promise.all(list.map(async (oneUser) => {
                oneUser.userId = oneUser._id;
                if (oneUser.avatar) {
                    const regExp = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/;
                    if (regExp.test(oneUser.avatar)) return oneUser;

                    oneUser.avatar = (path.join(__dirname, '/../../', '/public/upload/') + oneUser.avatar).replace(/\\/g, '/');
                }
                return oneUser
            }))
        }
        return list
    },

    counts: async (query) => { return await userModel.count(query) },

    findOne: async (query = {}) => {
        const user = await userModel.findOne(query).lean().exec();
        if (user) {
            user.userId = user._id;
            if (user.avatar) {
                const regExp = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/;
                if (!regExp.test(user.avatar)) {
                    user.avatar = (path.join(__dirname, '/../../', '/public/upload/') + user.avatar).replace(/\\/g, '/');
                }
            }
        }
        return user;
    },

    create: async (params) => {
        params.password = await generateHashValue(params.password);
        const user = new userModel(params);
        const result = await user.save();

        return result;
    },

    update: async (_id, body) => {
        const result = await userModel.findByIdAndUpdate(_id, body, { new: true }).exec();    
        return result;
    },

    deleted: async (_id) => {
        const result = await userModel.findOneAndDelete(_id);  
        return result;
    }
}
