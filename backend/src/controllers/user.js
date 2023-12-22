const Boom = require('@hapi/boom')
const { dataTable } = require('../constant/appConstant')
const { log, emailRegex, checkRequiredParams } = require('../lib/utils/utils')
const { compareHashPassword, generateHashValue } = require('../services/auth')
const { responseMessageObject, staticResponseMessageObject } = require('../lib/responseMessages/message')
const { find, counts, findOne, create, update, deleted } = require('../services/user')

module.exports = {
    list: async (req, res, next) => {
        try {
            let { skip, limit } = req.body

            skip = skip ? Number(skip) : dataTable.skip
            limit = limit ? Number(limit) : dataTable.limit

            const count = await counts({})
            const list = await find({}, skip, limit, { dt_added: -1 })

            return res.status(200).json({ message: (await responseMessageObject('User list', 'fetch')).success, count, list })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    getById: async (req, res, next) => {
        try {
            const { id } = req.body
            if (!id) return next(Boom.notFound((await responseMessageObject('id')).notProvided))

            const user = await findOne({ _id: id })
            if (!user) return next(Boom.notFound((await responseMessageObject('User')).notExistError))

            return res.status(200).json({ message: (await responseMessageObject('User', 'fetch')).success, user })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    create: async (req, res, next) => {
        try {
            const params = req.body
            const paramsToRequired = ['email', 'password']
            await checkRequiredParams(paramsToRequired, params)

            const isValidEmail = await emailRegex(params.email)
            if (!isValidEmail) { return next(Boom.notFound((await responseMessageObject('email')).invalidProp)) }

            const isUserExist = await findOne({ email: params.email })
            if (isUserExist) return next(Boom.notFound((await responseMessageObject('User')).alreadyExistError))

            params.email = params.email.toLowerCase().trim()

            if (req.file) { params.avatar = req.file.filename }

            const user = await create(params)
            if (!user) return next(Boom.notFound((await responseMessageObject('User', 'created')).error))

            return res.status(200).json({ message: (await responseMessageObject('User', 'created')).success, user })
        } catch (error) {
            return next(Boom.notAcceptable(error.message))
        }
    },

    update: async (req, res, next) => {
        try {
            const params = req.body
            const { id } = req.params
            
            const existingUser = await findOne({ _id: id })
            if (!existingUser) return next(Boom.notFound((await responseMessageObject('User')).notExistError))

            if (params.newPassword) {
                const isMatchNewPassword = await compareHashPassword(params.newPassword, existingUser.password)
                if(isMatchNewPassword) throw staticResponseMessageObject.duplicatePassword

                params.password = await generateHashValue(params.newPassword)
            }

            if (params.email) {
                const isValidEmail = await emailRegex(params.email)
                if (!isValidEmail) { return next(Boom.notFound((await responseMessageObject('email')).invalidProp)) }

                const isUserExist = await findOne({$and: [{ email: params.email}, { _id: { $ne: id } }]})
                if (isUserExist) return next(Boom.notFound((await responseMessageObject('User')).alreadyExistError))

                params.email = params.email.toLowerCase().trim()
            }

            if (req.file) { params.avatar = req.file.filename }

            if (params.newPassword) { delete params.newPassword }
            params.dt_upd = new Date()
            
            const user = await update({ _id: id }, params)
            if (!user) return next(Boom.notFound((await responseMessageObject('User', 'updated')).error))

            return res.status(200).json({ message: (await responseMessageObject('User', 'updated')).success, user })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    delete: async (req, res, next) => {
        try {
            const { id } = req.params

            const existingUser = await findOne({ _id: id })
            if (!existingUser) return next(Boom.notFound((await responseMessageObject('User')).notExistError))

            const user = await deleted({ _id: id })
            if (!user) return next(Boom.notFound((await responseMessageObject('User', 'deleted')).error))

            return res.status(200).json({ message: (await responseMessageObject('User', 'deleted')).success })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },
}