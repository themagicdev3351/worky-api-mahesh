const { awsContentImageUrl } = require('../constant/appConstant');

const getContentThumbnailAndLike = async (list, decodeUser) => {
    let result;
    if (list && list.length) {
        result = await Promise.all(list.map(async (oneContent) => {
            // ContentId
            oneContent.contentId = oneContent._id;

            // Thumbnail
            if (oneContent.worky_id) { oneContent.thumbnail = awsContentImageUrl + oneContent.worky_id + '_1.jpg' }

            // Like
            if (oneContent.likes && oneContent.likes.detail && oneContent.likes.detail.length) {
                const isObjExist = await oneContent.likes.detail.find(oneLikeObj => oneLikeObj.by.toString() === decodeUser && decodeUser.toString());
                oneContent.likes = (isObjExist) ? { count: oneContent.likes.count, isLike: true } : { count: oneContent.likes.count, isLike: false }
                return oneContent
            } else { oneContent.likes = { count: 0, isLike: false } }

            return oneContent;
        }))
    }
    return result;
}

module.exports = {
    find: async (search, skip, limit, sort, decodeUser) => {
        let list = await contentModel.find(search).populate('grades', 'title').populate('stds', 'title').populate('subject', 'title').skip(skip).limit(limit).sort(sort).lean().exec();
        await getContentThumbnailAndLike(list, decodeUser)
        return list
    },

    counts: async (query) => { return await contentModel.count(query) },

    optionList: async (query, sort, select) => {
        const result = await contentModel.findOne(query).sort(sort).select(select);
        return result;
    },

    findOne: async (query, decodeUser) => {
        const content = await contentModel.findOne(query).populate('grades', 'title').populate('stds', 'title').populate('subject', 'title').lean().exec();
        if (content) {
            content.contentId = content._id;
            
            // Thumbnail
            if (content.worky_id) { content.thumbnail = awsContentImageUrl + content.worky_id + '_1.jpg' }

            // Like
            if (content.likes && content.likes.detail && content.likes.detail.length) {
                const isObjExist = await content.likes.detail.find(oneLikeObj => oneLikeObj.by.toString() === decodeUser && decodeUser.toString());
                content.likes = (isObjExist) ? { count: content.likes.count, isLike: true } : { count: content.likes.count, isLike: false }
                return content
            } else { content.likes = { count: 0, isLike: false } }

        }
        return content;
    },

    create: async (params) => {
        const user = new contentModel(params);
        const result = await user.save();
        return result;
    },
    
    getContentThumbnailAndLike,
}