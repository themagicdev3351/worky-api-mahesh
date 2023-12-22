const Boom = require('@hapi/boom')
const mongoose = require('mongoose')
const { log, checkRequiredParams, getSearchRegexp, getCustomTime } = require('../lib/utils/utils')
const { dataTable, awsContentImageUrl } = require('../constant/appConstant')
const { responseMessageObject } = require('../lib/responseMessages/message')
const { find, findOne, optionList, counts, create, getContentThumbnailAndLike } = require('../services/content')
const { populateList: findSubmittedAssignment } = require('../services/submittedAssignment')
const { find: findCollection } = require('../services/collection')

const searchAggregate = async (search) => {
    let content = await contentModel.aggregate([
        {
            "$match": {
                $or: [
                    { "title": await getSearchRegexp(search) },
                    { "keyw": await getSearchRegexp(search) },
                    { "topic": await getSearchRegexp(search) },
                    { "stds_topic": await getSearchRegexp(search) },
                    { "stds.title": await getSearchRegexp(search) },
                    { "stds.tree.title": await getSearchRegexp(search) },
                    { "stds.tree.topics.title": await getSearchRegexp(search) },
                    { "stds.tree.topics.topics.id": await getSearchRegexp(search) },
                    { "subject.title": await getSearchRegexp(search) },
                    { "subject.topics.title": await getSearchRegexp(search) },
                    { "subject.topics.topics.title": await getSearchRegexp(search) },
                    { "subject.topics.topics.topics.title": await getSearchRegexp(search) },
                ],
            }
        },
        {
            $project: {
                _id: 1,
                grades: 1,
                type: 1,
                stds_topic: 1,
                title: 1,
                worky_id: 1,
                pages: 1,
                slug: 1,
                descrpt: 1,
                target_grade: 1,
                status: 1,
                printable: 1,
                bw_available: 1,
                studentView: 1,
                act_type: 1,
                author: 1,
                illust: 1,
                subject: 1,
                topic: 1,
                keyw: 1,
                ver: 1,
                thumbnail: 1,
                likes:1,
                stds: {
                    $map: {
                    input: "$stds",
                    as: "stdsObj",
                    in: {
                        $convert: {
                        input: "$$stdsObj",
                        to: "objectId"
                        }
                    }
                    }
                },
                // document: "$$ROOT"
            }
        },
        {
            $lookup: {
                from: "CommonCoreStandards",
                localField: "stds",
                foreignField: "_id",
                as: "stdsObj",
                "pipeline" : [{ "$project" : { "tree.id": 1, "tree.title": 1 } }],
            }
        },
        {
            $project: {
                _id: 1,
                grades: 1,
                type: 1,
                stds_topic: 1,
                title: 1,
                worky_id: 1,
                pages: 1,
                slug: 1,
                descrpt: 1,
                target_grade: 1,
                status: 1,
                printable: 1,
                bw_available: 1,
                studentView: 1,
                act_type: 1,
                author: 1,
                illust: 1,
                stds: 1,
                stdsObj: 1,
                topic: 1,
                keyw: 1,
                ver: 1,
                thumbnail: 1,
                likes:1,
                subject: {
                    $map: {
                    input: "$subject",
                    as: "subjectObj",
                    in: {
                        $convert: {
                        input: "$$subjectObj",
                        to: "objectId"
                        }
                    }
                    }
                },
                // document: "$$ROOT"
            }
        },
        {
            $lookup: {
                from: "Subjects",
                localField: "subject",
                foreignField: "_id",
                as: "subjectObj",
                "pipeline" : [{ "$project" : { "topics": 1 } }],
            }
        },
    ])

    await gradeModel.populate(content, {path: "grades", select: { title: 1 }})

    content = await Promise.all(content.map(async (oneContent) => {
        oneContent.contentId = oneContent._id
        // Subject
        if (oneContent && oneContent.subjectObj && oneContent.subjectObj.length) {
            await Promise.all(oneContent.subjectObj.map(async(e) => {
                await e.topics.map(async (e1) => {
                    if (e1.title.toUpperCase().includes(search.toUpperCase())) {
                        oneContent.subjectObj = []
                        return oneContent.subjectObj.push(e1)
                    }
                    if (e1.topics && e1.topics.length) {
                        await e1.topics.map(async (e2) => {
                            if (e2.title.toUpperCase().includes(search.toUpperCase())) {
                                oneContent.subjectObj = []
                                return oneContent.subjectObj.push(e2)
                            }
                            if (e2.topics && e2.topics.length) {
                                await e2.topics.map(async (e3) => {
                                    if (e3.title.toUpperCase().includes(search.toUpperCase())) {
                                        oneContent.subjectObj = []
                                        return oneContent.subjectObj.push(e3)
                                    }
                                })
                            }
                        })
                    }
                })
            }))
        }

        // Common Core Std.
        if (oneContent && oneContent.stdsObj && oneContent.stdsObj.length) {
            await Promise.all(oneContent.stdsObj.map(async(e) => {
                await e.tree.map(async(e1) => {
                    if (e1.id.includes(search) || e1.title.includes(search)) { oneContent.stdsObj = []; return oneContent.stdsObj.push(e1) }
                })
            }))
        }
        return oneContent
    }))

    return content
}

const splitParams = async (grade, subject, commonCoreStandards, stds_topic) => {
    let gradeList = []
    if (grade && grade.length) { grade = grade.toString(); gradeList = grade.split(',').map(e => mongoose.Types.ObjectId(e)) }

    let subjectList = []
    if (subject && subject.length) { subject = subject.toString(); subjectList = subject.split(',').map(e => mongoose.Types.ObjectId(e)) }

    let commonCoreStandardsList = []
    if (commonCoreStandards && commonCoreStandards.length) { commonCoreStandards = commonCoreStandards.toString(); commonCoreStandardsList = commonCoreStandards.split(',').map(e => mongoose.Types.ObjectId(e)) }
    
    let stds_topicList = []
    if (stds_topic && stds_topic.length) { stds_topic = stds_topic.toString(); stds_topicList = stds_topic.split(',') }

    return { gradeList, subjectList, commonCoreStandardsList, stds_topicList }
}

const contentSearch = async (grade, subject, commonCoreStandards, stds_topic) => {
    const { gradeList, subjectList, commonCoreStandardsList, stds_topicList } = await splitParams(grade, subject, commonCoreStandards, stds_topic)

    const query = {}
    if (gradeList && gradeList.length) { Object.assign(query, { grades: { '$in': gradeList } }) }
    if (subjectList && subjectList.length) { Object.assign(query, {subject: { '$in': subjectList }} ) }
    if (commonCoreStandardsList && commonCoreStandardsList.length) { Object.assign(query, { stds: { '$in': commonCoreStandardsList } }) }
    if (stds_topicList && stds_topicList.length) { Object.assign(query, { stds_topic: { '$in': stds_topicList } }) }

    const filterResList = await contentModel.find(query).populate('grades', 'title').populate('stds', 'title').populate('subject', 'title')
    return filterResList
}

const recentList = async (decodeUser, contentId) => {
    let recentContent = await recentContentModel.findOne({ "url.by": decodeUser }).exec()
    if (!recentContent) {
        let contentList = []
        contentList.push({ content: contentId, createdAt: await getCustomTime()  })
        const recentContentObj = { url: { by: decodeUser, contentList } }
        const createRecentContent = new recentContentModel(recentContentObj)
        await createRecentContent.save()
    }
    if (recentContent && recentContent.url && recentContent.url.contentList && recentContent.url.contentList.length) {
        recentContent.url.contentList = recentContent.url.contentList.sort((a, b) => b.createdAt - a.createdAt)
        let newContent = await recentContentModel.find({ $and: [{ "url.contentList.content": { "$in": contentId } }, { "url.by": decodeUser }] })
        if (!newContent.length) {
            if (recentContent.url.contentList.length === 10) {
                recentContent.url.contentList.pop()
                recentContent = await recentContentModel.findOneAndUpdate({ "url.by": decodeUser }, recentContent, { new: true })
            }
            recentContent.url.contentList.push({ content: contentId, createdAt: await getCustomTime() })
            await recentContentModel.findOneAndUpdate({ "url.by": decodeUser }, recentContent, { new: true })
        } else {
            const indexOfObject = newContent[0].url.contentList.findIndex(object => { return object.content.toString() === contentId.toString() })
            newContent[0].url.contentList.splice(indexOfObject, 1)
            newContent[0].url.contentList.push({ content: contentId, createdAt: await getCustomTime() })
            await recentContentModel.findOneAndUpdate({ "url.by": decodeUser }, newContent[0], { new: true })
        }
    }
}

module.exports = {
    list: async (req, res, next) => {
        try {
            let { limit, skip, gradeId } = req.body

            skip = skip ? Number(skip) : dataTable.skip
            limit = limit ? Number(limit) : dataTable.limit

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }
        
            let searchFilter = {}
            if (gradeId) { Object.assign(searchFilter, { grades: { "$in": gradeId } }) }

            const count = await counts(searchFilter)
            const list = await find(searchFilter, skip, limit, { dt_added: -1 }, decodeUser)

            return res.status(200).json({ message: (await responseMessageObject('ContentList', 'fetch')).success, count, list })
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

            const content = await findOne({ _id: id }, decodeUser)
            if(!content) return next(Boom.notFound((await responseMessageObject('Content')).notFoundError))

            await recentList(decodeUser, content._id)

            return res.status(200).json({ message: (await responseMessageObject('Content', 'fetch')).success, content })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    create: async (req, res, next) => {
        try {
            const params = req.body
            
            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            const fieldsToRequired = ['title']
            await checkRequiredParams(fieldsToRequired, params)

            const existingContent = await findOne({ title: params.title }, decodeUser)
            if (existingContent) return next(Boom.notFound((await responseMessageObject('Content')).alreadyExistError))

            if (req.file) { params.image = req.file.filename }

            params.subject = (params.subject && params.subject.length) ? params.subject.split(',').map((e) => e.trim()): params.subject
            params.topic = (params.topic && params.topic.length) ? params.topic.split(',').map((e) => e.trim()): params.topic
            params.stds = (params.stds && params.stds.length) ? params.stds.split(',').map((e) => e.trim()): params.stds
            params.stds_topic = (params.stds_topic && params.stds_topic.length) ? params.stds_topic.split(',').map((e) => e.trim()): params.stds_topic
            params.keyw = (params.keyw && params.keyw.length) ? params.keyw.split(',').map((e) => e.trim()): params.keyw
            params.grades = (params.grades && params.grades.length) ? params.grades.split(',').map((e) => e.trim()): params.grades

            const lastVersionIndex = await optionList({}, { dt_added: -1 }, 'ver')
            params.ver = (lastVersionIndex) ? (Number(lastVersionIndex.ver) + 1) : 1

            const content = create(params)
            if (!content) return next(Boom.notFound((await responseMessageObject('Content', 'created')).error))

            return res.status(200).json({ message: (await responseMessageObject('Content', 'created')).success, content })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    search: async (req, res, next) => {
        try {
            const { search, grade, subject, commonCoreStandards, stds_topic } = req.body

            let { limit, skip } = req.query

            skip = skip ? Number(skip) : dataTable.skip
            limit = limit ? Number(limit) : dataTable.limit

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            const and = ((subject && subject.length) && (grade && grade.length) && (commonCoreStandards && commonCoreStandards.length) && (stds_topic && stds_topic.length))
            const or = ((subject && subject.length) || (grade && grade.length) || (commonCoreStandards && commonCoreStandards.length) && (stds_topic && stds_topic.length))

            let content
            // IF --> When only search
            // ELSE --> only subject, grade or commonCoreStandards
            content = (search) ? await searchAggregate(search) : await contentSearch(grade, subject, commonCoreStandards, stds_topic)

            // When only search with subject, grade or commonCoreStandards
            if (search && (or || and)) {
                content = await searchAggregate(search)
                const filterResList = await contentSearch(grade, subject, commonCoreStandards, stds_topic)
                content = filterResList.filter(({ title: n1 }) => content.some(({ title: n2 }) => n2.toString() === n1.toString()))
            }

            // Without search and when available subject, grade or commonCoreStandards
            if (!search && (or || and)) { content = await contentSearch(grade, subject, commonCoreStandards, stds_topic) }

            // When not exist any params
            if (!search && (!subject || (subject && !subject.length)) && (!grade || (grade && !grade.length)) 
            && (!commonCoreStandards || (commonCoreStandards && !commonCoreStandards.length))) {
                content = await contentModel.find().populate('grades', 'title').populate('stds', 'title').populate('subject', 'title').skip(skip).limit(limit).sort({ dt_added: -1 }).lean()
            }

            let collection = []
            if (content && content.length) {
                content = await getContentThumbnailAndLike(content, decodeUser)

                // Collection
                const collectionList = await Promise.all(content.map(async (oneContent) => {
                    const query = { 'content': { $in: mongoose.Types.ObjectId(oneContent._id) }, added_by: decodeUser }
                    return await findCollection(query, null, null, { dt_added: -1 }, decodeUser)
                }))
                if (collectionList?.length) {
                    const mergeStdTopicList = [].concat(...collectionList)
                    const ids = mergeStdTopicList.map(o => o._id.toString())
                    collection = mergeStdTopicList.filter(({_id}, index) => !ids.includes(_id.toString(), index + 1))
                }
            }
            const searchText = (search) ? search : ''

            return res.status(200).json({ message: (await responseMessageObject('Content', 'fetch')).success, searchText, content, collection })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    getSuggestionSearch: async (req, res, next) => {
        try {
            const { search } = req.body
            if (!search) return next(Boom.notFound((await responseMessageObject('search data')).notProvided))

            let result = []
            if (search) {
                // Keyword
                const searchKeyword = { $in: [{ 'keyw': await getSearchRegexp(search) }] }
                const keyWordList = await contentModel.find(searchKeyword).select('keyw -_id').lean().exec()
                if (keyWordList && keyWordList.length) { await keyWordList.map((e) => {
                    if (e.keyw && e.keyw.length) {
                        e.keyw.map((e1) => { if (e1.toLowerCase().includes(search.toLowerCase())) { result.push(e1) } })
                    }
                }) }

                // Common core standard
                let ccsList = await commonCoreStandardModel.find()
                await ccsList.map(async (oneCcs) => {
                    if (oneCcs.id.toLowerCase().includes(search.toLowerCase())) { result.push(oneCcs.id) }
                    await oneCcs.tree.map(async (oneTree) => {
                        if (oneTree.id.toUpperCase().includes(search.toUpperCase())) {
                            result.push(oneTree.id)
                        }
                        if (oneTree && oneTree.topics && oneTree.topics.length) {
                            await oneTree.topics.map(async (firstTopic) => {
                                if (firstTopic.id.toUpperCase().includes(search.toUpperCase())) {
                                    result.push(firstTopic.id)
                                }
                                if (firstTopic && firstTopic.topics && firstTopic.topics.length) {
                                    await firstTopic.topics.map(async (secondTopic) => {
                                        if (secondTopic && secondTopic.id) {
                                            if (secondTopic.id.toUpperCase().includes(search.toUpperCase())) {
                                                result.push(secondTopic.id)
                                            }
                                        }
                                        if (secondTopic && secondTopic.topics && firstTopic.topics.length) {
                                            await secondTopic.topics.map((thirdTopic) => {
                                                if (thirdTopic.id.toUpperCase().includes(search.toUpperCase())) {
                                                    result.push(thirdTopic.id)
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    })
                })

                // Subject
                let subjectList = await subjectModel.find()
                await subjectList.map(async (oneCcs) => {
                    if (oneCcs.title.toLowerCase().includes(search.toLowerCase())) {
                        result.push(oneCcs.title)
                    }
                    await oneCcs.topics.map(async (firsTopic) => {
                        if (firsTopic.title.toUpperCase().includes(search.toUpperCase())) {
                            result.push(firsTopic.title)
                        }
                        if (firsTopic && firsTopic.topics && firsTopic.topics.length) {
                            await firsTopic.topics.map(async (secondTopic) => {
                                if (secondTopic.title.toUpperCase().includes(search.toUpperCase())) {
                                    result.push(secondTopic.title)
                                }
                                if (secondTopic && secondTopic.topics && secondTopic.topics.length) {
                                    await secondTopic.topics.map((thirdTopic) => {
                                        if (thirdTopic.title.toUpperCase().includes(search.toUpperCase())) {
                                            result.push(thirdTopic.title)
                                        }
                                    })
                                }
                            })
                        }  
                    })
                })
            }

            result = [...new Set(result)]

            return res.status(200).json({ message: (await responseMessageObject('Suggestion list', 'fetch')).success, searchText: search, result })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    updateLike: async (req, res, next) => {
        try {
            const _id = req.params.id
            let params = req.body

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            if (!_id) return next(Boom.notFound((await responseMessageObject('id')).invalidProp))

            let getLikeObj = await contentModel.findOne({ _id }).select('likes')

            if (getLikeObj && getLikeObj.likes && getLikeObj.likes.detail && getLikeObj.likes.detail.length) {
                const isUserExist = await getLikeObj.likes.detail.find(e => e.by.toString() === decodeUser.toString())
                if (params.like && !isUserExist) {
                    const count = (getLikeObj.likes.count) ? (getLikeObj.likes.count + 1) : 1
                    getLikeObj.likes.detail.push({ by: decodeUser, isLike: params.like })
                    params.likes = { count, isLike: params.like, detail: getLikeObj.likes.detail }
                } else if (!params.like && isUserExist) {
                    const count = getLikeObj.likes.count - 1
                    const spliceLikeDetailObj = getLikeObj.likes.detail.filter(item => item.by.toString() !== isUserExist.by.toString())
                    params.likes = { count, isLike: true, detail: spliceLikeDetailObj }
                }
            } else if (params.like) {
                params.likes = { count: 1, isLike: params.like, detail: { by: decodeUser, isLike: params.like } }
            }

            delete params.like
            const content = await contentModel.findOneAndUpdate({ _id }, params, { new: true })
            if (!content) return next(Boom.notFound((await responseMessageObject('Content-like', 'updated')).error))

            return res.status(200).json({ message: (await responseMessageObject('Content-like', 'updated')).success })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    getFavoriteList: async (req, res, next) => {
        try {
            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            let list = await contentModel.find({ "likes.detail.by": mongoose.Types.ObjectId(decodeUser) }).populate('grades', 'title').populate('stds', 'title').populate('subject', 'title').sort({ dt_added: -1 })
            const count = await contentModel.count({ "likes.detail.by": mongoose.Types.ObjectId(decodeUser) });
            
            if (list && list.length) {
                list = await Promise.all(list.map(async (oneContent) => {
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

            return res.status(200).json({ message: (await responseMessageObject('Favorite list', 'fetch')).success, count, list })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    getRecentContentList: async (req, res, next) => {
        try {
            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            let list = await recentContentModel.find({ "url.by": decodeUser }).select('url.contentList -_id').populate('url.contentList.content').exec()

            if (list && list.length) {
                list = list[0].url.contentList.sort((a, b) => b.createdAt - a.createdAt).map((e) => { e = e.content; return e })
                list = await Promise.all(list.map(async (oneContent) => {
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

            return res.status(200).json({ message: (await responseMessageObject('Recent content list', 'fetch')).success, count: list.length, list })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    getPopulateList: async (req, res, next) => {
        try {
            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            let searchFilter = {}
            if (req.body.gradeId) { Object.assign(searchFilter, { 'grades': { "$in": req.body.gradeId } }) }

            let list = await findSubmittedAssignment(req.body.gradeId[0]);
            if (list && list.length) {
                list = await Promise.all(list.map(async (oneContent) => {
                    if (oneContent.content) {
                        oneContent.contentId = oneContent._id

                        // Thumbnail
                        if (oneContent.content.worky_id) { oneContent.content.thumbnail = awsContentImageUrl + oneContent.content.worky_id + '_1.jpg' }

                        // Like
                        if (oneContent.content.likes && oneContent.content.likes.detail && oneContent.content.likes.detail.length) {
                            const isObjExist = await oneContent.content.likes.detail.find(oneLikeObj => oneLikeObj.by.toString() === decodeUser && decodeUser.toString());
                            oneContent.content.likes = (isObjExist) ? { count: oneContent.content.likes.count, isLike: true } : { count: oneContent.content.likes.count, isLike: false }
                            // return oneContent.content
                        } else { oneContent.content.likes = { count: 0, isLike: false } }
                    }

                    oneContent.content.totalPopulateContentCount = oneContent.totalPopulateContentCount
                    return oneContent.content
                }))
            }

            return res.status(200).json({ message: (await responseMessageObject('Populate content list', 'fetch')).success, count: list.length, list })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },
}
