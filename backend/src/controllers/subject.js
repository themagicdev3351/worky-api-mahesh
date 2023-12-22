const mongoose = require('mongoose')
const Boom = require('@hapi/boom')
const { log, checkRequiredParams, getImageUrlList } = require('../lib/utils/utils')
const { dataTable, awsContentImageUrl, aWSBucket, NODE_ENV } = require('../constant/appConstant')
const { responseMessageObject } = require('../lib/responseMessages/message')
const { find, findOne, counts, create } = require('../services/subject')

// const NODE_ENV = NODE_ENV
// const awsBucket = {
//     region: aWSBucket.region,
//     bucketName: aWSBucket[NODE_ENV].bucketName,
//     documentDirectory: ``,
// }

module.exports = {
    list: async (req, res, next) => {
        try {
            let { skip, limit } = req.body

            skip = skip ? Number(skip) : dataTable.skip
            limit = limit ? Number(limit) : dataTable.limit

            const count = await counts({})
            const list = await find({}, skip, limit, { dt_added: -1 })

            return res.status(200).json({ message: (await responseMessageObject('Subject list', 'fetch')).success, count, list })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    getBySubject: async (req, res, next) => {
        try {
            let { subject } = req.body
            if (!subject) return next(Boom.notFound((await responseMessageObject('subject id')).notProvided))

            subject = subject.toString().split(',').map(e => mongoose.Types.ObjectId(e))
            subject = await find({_id: {'$in': subject}}, null, null, { dt_added: -1 })

            return res.status(200).json({ message: (await responseMessageObject('Subject list', 'fetch')).success, subject })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    getByIdAndGrade: async (req, res, next) => {
        try {
            const { id, grade } = req.body

            let subject = await subjectModel.aggregate([
                {
                    "$lookup": {
                        "from": "Grades",
                        "localField": "grade",
                        "foreignField": "_id",
                        "as": "grade",
                        "pipeline" : [{ "$project" : { "_id": 1, "title": 1 } }],
                    }
                }, {
                    "$match": {
                        $and: [
                            { "_id": mongoose.Types.ObjectId(id) },
                            { 'grade._id': mongoose.Types.ObjectId(grade) }
                        ],
                    }
                },
            ])

            subject = await getImageUrlList(subject, 'subjectId')
            return res.status(200).json({ message: (await responseMessageObject('Subject', 'fetch')).success, subject })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    getContentBySubjectTopic: async (req, res, next) => {
        try {
            const { id, topic } = req.body

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            const subject = await findOne({_id: id})
            if(!subject) return next(Boom.notFound((await responseMessageObject('Subject')).notFoundError))

            var content = []
            await Promise.all(subject.topics.map(async (firstStep) => {
                // *** FirstStep ***
                if (firstStep.title.search(new RegExp(topic, "i")) == 0) {
                    content.push(firstStep.title)
                    if (firstStep.topics && firstStep.topics.length) {
                        await Promise.all(firstStep.topics.map(async (secondStep) => {
                            if (secondStep.title || (secondStep.title.search(new RegExp(topic, "i")) == 0)) { content.push(secondStep.title) }
                            
                            if (secondStep && secondStep.topics && secondStep.topics.length) {
                                await Promise.all(secondStep.topics.map(async (thirdStep) => {
                                    if (thirdStep.title || (thirdStep.title.search(new RegExp(topic, "i")) == 0)) { content.push(thirdStep.title) }
                                }))
                            }
                        }))
                    }
                }

                // *** SecondStep ***
                if (firstStep.topics && firstStep.topics.length) {
                    await Promise.all(firstStep.topics.map(async (secondStep) => {
                        if (secondStep.title.search(new RegExp(topic, "i")) == 0) {
                            content.push(secondStep.title)
                            if (secondStep && secondStep.topics && secondStep.topics.length) {
                                await Promise.all(secondStep.topics.map(async (thirdStep) => {
                                    if (thirdStep.title || (thirdStep.title.search(new RegExp(topic, "i")) == 0)) { content.push(thirdStep.title) }
                                }))
                            }
                        }

                        // *** ThirdStep ***
                        if (secondStep.topics && secondStep.topics.length) {
                            await Promise.all(secondStep.topics.map(async (thirdStep) => {
                                if (thirdStep.title.search(new RegExp(topic, "i")) == 0) { content.push(thirdStep.title) }
                            }))
                        }
                    }))
                }
            }))

            content = [...new Set(content)].map((e) => new RegExp(e, "i"))
            content = await contentModel.find({ topic: { '$in': content } }).populate('grades', 'title').populate('subject', 'title').populate('stds', 'title').lean().exec()
            if (content && content.length) {
                content = await Promise.all(content.map(async (oneContent) => {
                    // ContentId
                    oneContent.contentId = oneContent._id
                    
                    // Thumbnail
                    if (oneContent.worky_id) { oneContent.thumbnail = awsContentImageUrl + oneContent.worky_id + '_1.jpg' }

                    // Like
                    if (oneContent.likes && oneContent.likes.detail && oneContent.likes.detail.length) {
                        const isObjExist = await oneContent.likes.detail.find(oneLikeObj => oneLikeObj.by.toString() === decodeUser && decodeUser.toString());
                        oneContent.likes = (isObjExist) ? { count: oneContent.likes.count, isLike: true } : { count: oneContent.likes.count, isLike: false }
                        return oneContent
                    } else { oneContent.likes = { count: 0, isLike: false } }

                    return oneContent
                }))
            }

            return res.status(200).json({ message: (await responseMessageObject('Subject', 'fetch')).success, searchText: topic, content })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    create: async (req, res, next) => {
        try {
            const params = req.body;
            const fieldsToRequired = ['title']
            await checkRequiredParams(fieldsToRequired, params)

            const existingSubject = await findOne({ title: params.title })
            if (existingSubject) return next(Boom.notFound((await responseMessageObject('Subject')).alreadyExistError))

            if (req.file) { params.image = req.file.filename }

            const subject = await create(params)
            if (!subject) return next(Boom.notFound((await responseMessageObject('Subject', 'created')).error))

            return res.status(200).json({ message: (await responseMessageObject('Standard', 'created')).success, subject })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },
}
