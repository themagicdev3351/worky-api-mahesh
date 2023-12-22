const { getImageUrlList, getOneImageUrL } = require('../lib/utils/utils')

module.exports = {
    find: async (search, skip, limit, sort) => {
        let list = await subjectModel.find(search).populate('grade', 'title').skip(skip).limit(limit).sort(sort).lean().exec();
        list = await getImageUrlList(list, 'subjectId')
        return list
    },

    counts: async (query) => { return await subjectModel.count(query) },

    findOne: async (query) => {
        const result = await subjectModel.findOne(query).populate('grade', 'title').lean().exec();
        if (result) { result.subjectId = result._id; result.image = await getOneImageUrL(result.image) }
        return result;
    },

    create: async (params) => {
        const user = new subjectModel(params);
        const result = await user.save();
        return result;
    },
}