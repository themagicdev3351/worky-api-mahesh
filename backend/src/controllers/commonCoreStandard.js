const mongoose = require('mongoose')
const Boom = require('@hapi/boom')
const { log, checkRequiredParams, getImageUrlList } = require('../lib/utils/utils')
const { dataTable, awsContentImageUrl } = require('../constant/appConstant')
const { responseMessageObject } = require('../lib/responseMessages/message')
const { find, findOne, counts, create } = require('../services/commonCoreStandard')

module.exports = {
    list: async (req, res, next) => {
        try {
            let { limit, skip } = req.body

            skip = skip ? Number(skip) : dataTable.skip
            limit = limit ? Number(limit) : dataTable.limit

            const count = await counts({})
            const list = await find({}, skip, limit, { dt_added: -1 })

            return res.status(200).json({ message: (await responseMessageObject('Standard list', 'fetch')).success, count, list })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    getByIdAndGrade: async (req, res, next) => {
        try {
            const { id, grade } = req.body

            let commonCoreStd = await commonCoreStandardModel.aggregate([
                {
                    "$lookup": {
                        "from": "Grades",
                        "localField": "grade",
                        "foreignField": "_id",
                        "as": "grade",
                        "pipeline" : [{ "$project" : { "_id": 1, "title": 1 } }],
                    }
                },
                {
                    "$match": {
                        $and: [
                            { "_id": mongoose.Types.ObjectId(id) },
                            { 'grade._id': mongoose.Types.ObjectId(grade) }
                        ],
                    }
                },
            ])

            await subjectModel.populate(commonCoreStd, { path: "subject", select: { title: 1 } })

            commonCoreStd = await getImageUrlList(commonCoreStd, 'commonCoreStdId')

            return res.status(200).json({ message: (await responseMessageObject('Standard', 'fetch')).success, commonCoreStd })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    getContentByCCSTopic: async (req, res, next) => {
        try {
            const { id, topic } = req.body

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            const ccs = await findOne({_id: id})
            if(!ccs) return next(Boom.notFound((await responseMessageObject('Standard')).notFoundError))
    
            var content = []
            await Promise.all(ccs.tree.map(async (firstStep) => {
                // *** FirstStep ***
                if (firstStep.id === topic) {
                    content.push(firstStep.id)
                    if (firstStep.topics && firstStep.topics.length) {
                        await Promise.all(firstStep.topics.map(async (secondStep) => {
                            if (secondStep.id || (secondStep.id === topic)) { content.push(secondStep.id) }
                            
                            if (secondStep && secondStep.topics && secondStep.topics.length) {
                                await Promise.all(secondStep.topics.map(async (thirdStep) => {
                                    if (thirdStep.id || (thirdStep.id === topic)) { content.push(thirdStep.id) }

                                    if (thirdStep && thirdStep.topics && thirdStep.topics.length) {
                                        await Promise.all(thirdStep.topics.map(async (ForthStep) => {
                                            if (ForthStep.id || (ForthStep.id === topic)) { content.push(ForthStep.id) }
                                        }))
                                    }
                                }))
                            }
                        }))
                    }
                }

                // *** SecondStep ***
                if (firstStep.topics && firstStep.topics.length) {
                    await Promise.all(firstStep.topics.map(async (secondStep) => {
                        if (secondStep.id === topic) {
                            content.push(secondStep.id)
                            if (secondStep && secondStep.topics && secondStep.topics.length) {
                                await Promise.all(secondStep.topics.map(async (thirdStep) => {
                                    if (thirdStep.id || (thirdStep.id === topic)) { content.push(thirdStep.id) }
    
                                    if (thirdStep && thirdStep.topics && thirdStep.topics.length) {
                                        await Promise.all(thirdStep.topics.map(async (ForthStep) => {
                                            if (ForthStep.id || (ForthStep.id === topic)) { content.push(ForthStep.id) }
                                        }))
                                    }
                                }))
                            }
                        }

                        // *** ThirdStep ***
                        if (secondStep.topics && secondStep.topics.length) {
                            await Promise.all(secondStep.topics.map(async (thirdStep) => {
                                if (thirdStep.id && thirdStep.id === topic) {
                                    content.push(thirdStep.id)
                                    if (thirdStep && thirdStep.topics && thirdStep.topics.length) {
                                        await Promise.all(thirdStep.topics.map(async (ForthStep) => {
                                            if (ForthStep.id || (ForthStep.id === topic)) { content.push(ForthStep.id) }
                                        }))
                                    }
                                }

                                // *** ForthStep ***
                                if (thirdStep && thirdStep.topics && thirdStep.topics.length) {
                                    await Promise.all(thirdStep.topics.map(async (ForthStep) => {
                                        if (ForthStep.id && (ForthStep.id === topic)) { content.push(ForthStep.id) }
                                    }))
                                }
                            }))
                        }
                    }))
                }
            }))

            content = [...new Set(content)]
            content = await contentModel.find( { stds_topic: { $in: content } }).populate('grades', 'title').populate('subject', 'title').populate('stds', 'title')
            if (content && content.length) {
                content = await Promise.all(content.map(async (oneContent) => {
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

                    return oneContent
                }))
            }

            return res.status(200).json({ message: (await responseMessageObject('Standard', 'fetch')).success, searchText: topic, content })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    create: async (req, res, next) => {
        try {
            const params = req.body
            const fieldsToRequired = ['title']
            await checkRequiredParams(fieldsToRequired, req.body)

            const existingCoreStd = await findOne({ title: params.title })
            if (existingCoreStd) return next(Boom.notFound((await responseMessageObject('Standard')).alreadyExistError))

            if (req.file) { params.image = req.file.filename }

            const commonCoreStd = await create(params)
            if (!commonCoreStd) return next(Boom.notFound((await responseMessageObject('Standard', 'created')).error))

            return res.status(200).json({ message: (await responseMessageObject('Standard', 'created')).success, commonCoreStd })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },
}
