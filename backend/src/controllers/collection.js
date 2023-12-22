const Boom = require('@hapi/boom')
const { log, checkRequiredParams } = require('../lib/utils/utils')
const { dataTable } = require('../constant/appConstant')
const { responseMessageObject } = require('../lib/responseMessages/message')
const { find, findOne, optionList, counts, create, update, deleted } = require('../services/collection')

module.exports = {
    list: async (req, res, next) => {
        try {
            let { skip, limit } = req.body

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            skip = skip ? Number(skip) : dataTable.skip
            limit = limit ? Number(limit) : dataTable.limit

            const count = await counts({ "added_by": decodeUser })
            const list = await find({ "added_by": decodeUser }, skip, limit, { dt_added: -1 }, decodeUser)

            return res.status(200).json({ message: (await responseMessageObject('Collection list', 'fetch')).success, count, list })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    getById: async (req, res, next) => {
        try {
            const { id } = req.body
            if (!id) return next(Boom.notFound((await responseMessageObject('id')).notProvided))

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            const collection = await findOne({ _id: id }, decodeUser)
            if(!collection) return next(Boom.notFound((await responseMessageObject('Collection')).notFoundError))

            if (collection?.content?.length) {
                let std_topic = []
                await Promise.all(collection.content.map((oneContent) => { std_topic.push(oneContent.stds_topic) }))
                const mergeStdTopicList = [].concat(...std_topic)
                collection.std_topic = [... new Set(mergeStdTopicList)]
            }

            return res.status(200).json({ message: (await responseMessageObject('Collection', 'fetch')).success, collection })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    optionList: async (req, res, next) => {
        try {
            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            let collection = await optionList({ "added_by": decodeUser }, 'title')
            return res.status(200).json({ message: (await responseMessageObject('Collection optionList', 'fetch')).success, collection })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    getFavoriteList: async (req, res, next) => {
        try {
            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            const count = await counts({ $and: [{ "added_by": decodeUser }, { "favorite": true }] })
            const list = await find({ $and: [{ "added_by": decodeUser }, { "favorite": true }] }, null, null, { dt_added: -1 })

            return res.status(200).json({ message: (await responseMessageObject('Collection favorite list', 'fetch')).success, count, list })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    create: async (req, res, next) => {
        try {
            const params = req.body
            const fieldsToRequired = ['title']
            await checkRequiredParams(fieldsToRequired, params)

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }
            params.added_by = decodeUser

            const existingCollection = await findOne({ $and: [{ title: params.title }, { added_by: params.added_by }] }, decodeUser)
            if (existingCollection) return next(Boom.notFound((await responseMessageObject('Collection')).alreadyExistError))

            // Multiple collection with content
            if (params?.collection?.length && !params?.content?.length) {
                let list = null
                let contentList = []
                list = await find({ "_id": { $in: params?.collection } }, null, null, null, decodeUser)
                list = await Promise.all(list.map(async (oneCollection) => {
                    await oneCollection.content.map((e) => { return contentList.push(e._id) })
                    return contentList
                }))
                params.content = [... new Set(contentList)]
            }
            if (!params?.collection?.length && params?.content?.length) { params.content = params.content.toString().split(',').map((e) => e.trim()) }

            const collection = await create(params)
            if (!collection) return next(Boom.notFound((await responseMessageObject('Collection', 'created')).error))

            return res.status(200).json({ message: (await responseMessageObject('Collection', 'created')).success, collection })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    update: async (req, res, next) => {
        try {
            const _id = req.params.id
            let params = req.body

            const isExistCollection = await findOne({ _id })
            if (!isExistCollection) return next(Boom.notFound((await responseMessageObject('Collection')).notExistError))

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            const existingCollection = await findOne({ $and: [{ title: params.title }, { added_by: decodeUser }, { _id: { $ne: _id } }] }, decodeUser)
            if (existingCollection) return next(Boom.notFound((await responseMessageObject('Collection')).alreadyExistError))

            // Multiple collection with content
            if (params?.collection?.length && !params?.content?.length) {
                let list = null
                let contentList = []
                list = await find({ "_id": {$in: params?.collection} }, null, null, null, decodeUser)
                list = await Promise.all(list.map(async (oneCollection) => {
                   await oneCollection.content.map((e) => { return contentList.push(e._id) })
                   return contentList
                }))
               params.content = [... new Set(contentList)]
            }
    
            const collection = await findOne({ _id })
            if (!existingCollection && params.content && params.content.length) {
                if (collection && collection.content && collection.content.length) {
                    const filteredArr = params.content.filter((objOne) => {
                        return !collection.content.some((objTwo) => {
                            return objOne.toString() === objTwo._id.toString()
                        })
                    })
                    if (filteredArr && filteredArr.length) { filteredArr.toString().split(',').map((e) => collection.content.push(e.trim())) }
                } else {
                    collection.content = params.content.toString().split(',').map((e) => e.trim())
                }
            }

            collection.title = (params.title) ? params.title: collection.title
            collection.favorite = (params.favorite === false || params.favorite === true) ? params.favorite: collection.favorite

            collection.dt_upd = new Date()
            const updatedContent = await update({ _id }, collection)
            if (!updatedContent) return next(Boom.notFound((await responseMessageObject('Collection', 'updated')).error))

            return res.status(200).json({ message: (await responseMessageObject('Collection', 'updated')).success, collection })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    delete:async (req, res, next) => {
        try {
            const _id = req.params.id
            if (!req.user || !req.user.id) return next(Boom.notFound((await responseMessageObject('token')).invalidProp))

            const isExistCollection = await findOne({ _id })
            if (!isExistCollection) return next(Boom.notFound((await responseMessageObject('Collection')).notExistError))

            const collection = await deleted({ _id, added_by: req.user.id })
            if (!collection) return next(Boom.notFound((await responseMessageObject('Collection', 'deleted')).error))

            return res.status(200).json({ message: (await responseMessageObject('Collection', 'deleted')).success })
        } catch (error) {
            log(error)
           return next(Boom.notAcceptable(error.message))
        }
    }
}