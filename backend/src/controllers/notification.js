const Boom = require('@hapi/boom')
const mongoose = require('mongoose')
const { log, checkRequiredParams } = require('../lib/utils/utils')
const { dataTable } = require('../constant/appConstant')
const { responseMessageObject } = require('../lib/responseMessages/message')
const { find, findOne, counts, create, update, deleted } = require('../services/notification')

module.exports = {
    list: async (req, res, next) => {
        try {
            let { skip, limit } = req.body

            skip = skip ? Number(skip) : dataTable.skip
            limit = limit ? Number(limit) : dataTable.limit

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            const count = await counts({added_by: mongoose.Types.ObjectId(decodeUser)})
            const list = await find({added_by: mongoose.Types.ObjectId(decodeUser)}, skip, limit, { dt_added: -1 })

            return res.status(200).json({ message: (await responseMessageObject('Notification list', 'fetch')).success, count, list })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    getById: async (req, res, next) => {
        try {
            const { id } = req.body
            if (!id) return next(Boom.notFound((await responseMessageObject('id')).notProvided))

            const nofitication = await findOne({ _id: mongoose.Types.ObjectId(id) })
            if(!nofitication) return next(Boom.notFound((await responseMessageObject('Notification')).notFoundError))

            return res.status(200).json({ message: (await responseMessageObject('Notification', 'fetch')).success, nofitication })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    create: async (req, res, next) => {
        try {
            const params = req.body
            const fieldsToRequired = ['student', 'assignment', 'submittedAssignment']
            await checkRequiredParams(fieldsToRequired, params)

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }
            params.added_by = decodeUser

            const existingNotification = await findOne({ title: params.title })
            if (existingNotification) return next(Boom.notFound((await responseMessageObject('Notification')).alreadyExistError))

            const nofitication = await create(params)
            if (!nofitication) return next(Boom.notFound((await responseMessageObject('Notification', 'created')).error))

            return res.status(200).json({ message: (await responseMessageObject('Notification', 'created')).success, nofitication })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    update: async (req, res, next) => {
        try {
            const _id = req.params.id
            const params = req.body

            const isExistNotification = await findOne({ _id })
            if (!isExistNotification) return next(Boom.notFound((await responseMessageObject('Notification')).notExistError))

            const existingNotification = await findOne({$and: [params, { _id: { $ne: _id } }]})
            if (existingNotification) return next(Boom.notFound((await responseMessageObject('Notification')).alreadyExistError))

            params.dt_upd = new Date()
            const notification = await update({ _id }, params)
            if (!notification) return next(Boom.notFound((await responseMessageObject('Notification', 'updated')).error))

            return res.status(200).json({ message: (await responseMessageObject('Notification', 'updated')).success, notification })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    delete: async (req, res, next) => {
        try {
            const _id = req.params.id

            const isExistNotification = await findOne({ _id: mongoose.Types.ObjectId(_id) })
            if (!isExistNotification) return next(Boom.notFound((await responseMessageObject('Notification')).notExistError))

            const notification = await deleted({ _id })
            if (!notification) return next(Boom.notFound((await responseMessageObject('Notification', 'deleted')).error))

            return res.status(200).json({ message: (await responseMessageObject('Notification', 'deleted')).success })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },
}