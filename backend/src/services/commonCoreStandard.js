const { getImageUrlList, getOneImageUrL } = require('../lib/utils/utils')

module.exports = {
    find: async (search, skip, limit, sort) => {
        let list = await commonCoreStandardModel.find(search).populate('subject', 'title').populate('grade', 'title').skip(skip).limit(limit).sort(sort).lean().exec();
        list = await getImageUrlList(list, 'commonCoreStdId')
        return list
    },

    counts: async (query) => { return await commonCoreStandardModel.count(query) },

    findOne: async (query) => {
        const result = await commonCoreStandardModel.findOne(query).populate('subject', 'title').populate('grade', 'title').lean().exec();
        if (result) { result.commonCoreStdId = result._id; result.image = await getOneImageUrL(result.image) }
        return result;
    },

    create: async (params) => {
        const user = new commonCoreStandardModel(params);
        const result = await user.save();
        return result;
    },
}