const { awsContentImageUrl } = require('../constant/appConstant');

module.exports = {
    find: async (search, skip, limit, sort, decodeUser) => {
        let list = await collectionModel.find(search).populate('content').populate('added_by', 'firstName lastName').skip(skip).limit(limit).sort(sort).lean().exec();
        if (list && list.length) {
            list = await Promise.all(list.map(async (oneCollection) => {
                let thumbnailList = []
                oneCollection.collectionId = oneCollection._id;
                await oneCollection.content.map(async (oneContent) => {
                    // ContentId
                    oneContent.contentId = oneContent._id;

                    if (oneContent.worky_id) { oneContent.thumbnail = awsContentImageUrl + oneContent.worky_id + '_1.jpg' }

                    // ThumbnailList
                    if (oneContent.worky_id) { thumbnailList.push(awsContentImageUrl + oneContent.worky_id + '_1.jpg') }

                    // Like
                    if (oneContent.likes && oneContent.likes.detail && oneContent.likes.detail.length) {
                        const isObjExist = await oneContent.likes.detail.find(oneLikeObj => oneLikeObj.by.toString() === decodeUser && decodeUser.toString());
                        oneContent.likes = (isObjExist) ? { count: oneContent.likes.count, isLike: true } : { count: oneContent.likes.count, isLike: false }
                        return oneContent
                    } else { oneContent.likes = { count: 0, isLike: false } }
                });
                oneCollection.thumbnailList = thumbnailList;
                return oneCollection;
            }));
        }
        return list
    },

    optionList: async (query, select) => {
        let result = await collectionModel.find(query).select(select).sort({ 'dt_added': -1 });
        return result
    },

    counts: async (query) => { return await collectionModel.count(query) },

    findOne: async (query, decodeUser) => {
        const collection = await collectionModel.findOne(query).populate('content').populate('added_by', 'firstName lastName').lean().exec();
        if (collection) {
            collection.collectionId = collection._id;

            let thumbnailList = []
            if (collection?.content?.length) {
                await Promise.all(collection.content.map(async (oneContent) => {
                    // ContentId
                    oneContent.contentId = oneContent._id;
    
                    if (oneContent.worky_id) { oneContent.thumbnail = awsContentImageUrl + oneContent.worky_id + '_1.jpg' }
    
                    // ThumbnailList
                    if (oneContent.worky_id) { thumbnailList.push(awsContentImageUrl + oneContent.worky_id + '_1.jpg') }
    
                    // Like
                    if (oneContent.likes && oneContent.likes.detail && oneContent.likes.detail.length) {
                        const isObjExist = await oneContent.likes.detail.find(oneLikeObj => oneLikeObj.by.toString() === decodeUser && decodeUser.toString());
                        oneContent.likes = (isObjExist) ? { count: oneContent.likes.count, isLike: true } : { count: oneContent.likes.count, isLike: false }
                        return oneContent
                    } else { oneContent.likes = { count: 0, isLike: false } }
                }));   
            }

            collection.thumbnailList = thumbnailList;
        }
        return collection;
    },

    create: async (params) => {
        const user = new collectionModel(params);
        const result = await user.save();
        return result;
    },

    update: async (_id, body) => {
        const result = await collectionModel.findByIdAndUpdate(_id, body, { new: true }).exec();    
        return result;
    },

    deleted: async (_id) => {
        const result = await collectionModel.findOneAndDelete(_id);  
        return result;
    }
}