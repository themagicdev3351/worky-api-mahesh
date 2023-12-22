const Boom = require('@hapi/boom')
const { log, checkRequiredParams, getSearchRegexp } = require('../lib/utils/utils')
const { dataTable } = require('../constant/appConstant')
const { responseMessageObject } = require('../lib/responseMessages/message')
const { find, findOne, counts, create, update, deleted } = require('../services/assignmentGrade')

module.exports = {
    list: async (req, res, next) => {
        try {
            let { skip, limit } = req.body

            skip = skip ? Number(skip) : dataTable.skip
            limit = limit ? Number(limit) : dataTable.limit

            const count = await counts({})
            const list = await find({}, skip, limit, {})

            return res.status(200).json({ message: (await responseMessageObject('AssignmentGrade list', 'fetch')).success, count, list })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    getById: async (req, res, next) => {
        try {
            const { id } = req.body
            if (!id) return next(Boom.notFound((await responseMessageObject('id')).notProvided))

            const assignmentGrade = await findOne({ _id: id })
            if(!assignmentGrade) return next(Boom.notFound((await responseMessageObject('AssignmentGrade')).notFoundError))

            return res.status(200).json({ message: (await responseMessageObject('AssignmentGrade', 'fetch')).success, assignmentGrade })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    create: async (req, res, next) => {
        try {
            const params = req.body
            const fieldsToRequired = ['title', 'color']
            await checkRequiredParams(fieldsToRequired, params)

            const existingAssignmentGradeTitle = await findOne({ title: params.title.toUpperCase() })
            if (existingAssignmentGradeTitle) return next(Boom.notFound((await responseMessageObject('Title')).alreadyExistError))

            const existingAssignmentGradeColor = await findOne({ color: await getSearchRegexp(params.color) })
            if (existingAssignmentGradeColor) return next(Boom.notFound((await responseMessageObject('Color')).alreadyExistError))

            params.title = params.title.toUpperCase()
            params.color = params.color.charAt(0).toUpperCase() + params.color.slice(1)
            const assignmentGrade = await create(params)
            if (!assignmentGrade) return next(Boom.notFound((await responseMessageObject('AssignmentGrade', 'created')).error))

            return res.status(200).json({ message: (await responseMessageObject('AssignmentGrade', 'created')).success, assignmentGrade })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    update: async (req, res, next) => {
        try {
            const _id = req.params.id
            const params = req.body

            const isExistingAssignmentGrade = await findOne({ _id })
            if (!isExistingAssignmentGrade) return next(Boom.notFound((await responseMessageObject('AssignmentGrade')).notExistError))

            if (params.title) {
                const existingAssignmentGradeTitle = await findOne({$and: [{ title: params.title.toUpperCase() }, { _id: { $ne: _id } }] })
                if (existingAssignmentGradeTitle) return next(Boom.notFound((await responseMessageObject('Title')).alreadyExistError))

                params.title = params.title.toUpperCase()
            }

            if (params.color) {
                const existingAssignmentGradeColor = await findOne({$and: [{ color: await getSearchRegexp(params.color) }, { _id: { $ne: _id } }] })
                if (existingAssignmentGradeColor) return next(Boom.notFound((await responseMessageObject('Color')).alreadyExistError))

                params.color = params.color.charAt(0).toUpperCase() + params.color.slice(1)
            }

            params.dt_upd = new Date()
            const assignmentGrade = await update({ _id }, params)
            if (!assignmentGrade) return next(Boom.notFound((await responseMessageObject('AssignmentGrade', 'updated')).error))

            return res.status(200).json({ message: (await responseMessageObject('AssignmentGrade', 'updated')).success, assignmentGrade })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    delete: async (req, res, next) => {
        try {
            const _id = req.params.id

            const isExistGrade = await findOne({ _id })
            if (!isExistGrade) return next(Boom.notFound((await responseMessageObject('AssignmentGrade')).notExistError))

            const assignmentGrade = await deleted({ _id })
            if (!assignmentGrade) return next(Boom.notFound((await responseMessageObject('AssignmentGrade', 'deleted')).error))

            return res.status(200).json({ message: (await responseMessageObject('AssignmentGrade', 'deleted')).success })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },
}