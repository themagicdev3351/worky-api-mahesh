const Boom = require('@hapi/boom')
const mongoose = require('mongoose')
const { log, checkRequiredParams } = require('../lib/utils/utils')
const { dataTable } = require('../constant/appConstant')
const { responseMessageObject } = require('../lib/responseMessages/message')
const { find, findOne, counts, create, update, deleted } = require('../services/grade')

module.exports = {
    list: async (req, res, next) => {
        try {
            let { skip, limit } = req.body

            skip = skip ? Number(skip) : dataTable.skip
            limit = limit ? Number(limit) : dataTable.limit

            const count = await counts({})
            let list = await find({}, skip, limit, {})

            list = await Promise.all(list.filter((oneGrade) => {
                const title = oneGrade?.title
                if (title && (title === 'Pre-K' || title === 'K' || title === '1' || title === '2' || title === '3' || title === '5' || title === '5')) {
                    return oneGrade
                }
            }))
            return res.status(200).json({ message: (await responseMessageObject('Grade list', 'fetch')).success, count, list })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    getById: async (req, res, next) => {
        try {
            const { id } = req.body
            if (!id) return next(Boom.notFound((await responseMessageObject('id')).notProvided))

            const grade = await findOne({ _id: id })
            if(!grade) return next(Boom.notFound((await responseMessageObject('Grade')).notFoundError))

            return res.status(200).json({ message: (await responseMessageObject('Grade', 'fetch')).success, grade })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    getByGrade: async (req, res, next) => {
        try {
            let { grade } = req.body
            if(!grade || (grade && !grade.length)) return next(Boom.notFound((await responseMessageObject('Grade data')).notProvided))
            grade = grade.toString().split(',').map(e => mongoose.Types.ObjectId(e))

            const gradeList = await find({_id: {'$in': grade}}, null, null, { dt_added: -1 })

            return res.status(200).json({ message: (await responseMessageObject('Grade list', 'fetch')).success, grade: gradeList })
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

            const existingGrade = await findOne({ title: params.title })
            if (existingGrade) return next(Boom.notFound((await responseMessageObject('Grade')).alreadyExistError))

            const grade = await create(params)
            if (!grade) return next(Boom.notFound((await responseMessageObject('Grade', 'created')).error))

            return res.status(200).json({ message: (await responseMessageObject('Grade', 'created')).success, grade })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    update: async (req, res, next) => {
        try {
            const _id = req.params.id
            const params = req.body

            const isExistGrade = await findOne({ _id })
            if (!isExistGrade) return next(Boom.notFound((await responseMessageObject('Grade')).notExistError))

            const existingGrade = await findOne({$and: [params, { _id: { $ne: _id } }]})
            if (existingGrade) return next(Boom.notFound((await responseMessageObject('Grade')).alreadyExistError))

            params.dt_upd = new Date()
            const grade = await update({ _id }, params)
            if (!grade) return next(Boom.notFound((await responseMessageObject('Grade', 'updated')).error))

            return res.status(200).json({ message: (await responseMessageObject('Grade', 'updated')).success, grade })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    delete: async (req, res, next) => {
        try {
            const _id = req.params.id

            const isExistGrade = await findOne({ _id })
            if (!isExistGrade) return next(Boom.notFound((await responseMessageObject('Grade')).notExistError))

            const grade = await deleted({ _id })
            if (!grade) return next(Boom.notFound((await responseMessageObject('Grade', 'deleted')).error))

            return res.status(200).json({ message: (await responseMessageObject('Grade', 'deleted')).success })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },
}