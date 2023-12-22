const Boom = require('@hapi/boom')
const { log, checkRequiredParams, emailRegex } = require('../../lib/utils/utils')
const { createToken } = require('../../lib/passport/passport')
const { USER } = require('../../constant/appConstant')
const { findOne, update } = require('../../services/user')
const { responseMessageObject, staticResponseMessageObject } = require('../../lib/responseMessages/message')
const { compareHashPassword, generateHashValue } = require('../../services/auth')

module.exports = {
    login: async (req, res, next) => {
        try {
            const params = req.body
            const fieldsToRequired = ['email', 'password']
            await checkRequiredParams(fieldsToRequired, params)

            const isValidEmail = await emailRegex(params.email)
            if (!isValidEmail) return next(Boom.notFound((await responseMessageObject('email')).invalidProp))

            const user = await findOne({ type: USER.TYPE.ADMIN, email: params.email })            
            if (!user) return next(Boom.notFound((await responseMessageObject('credentials')).invalidProp))

            if (user.verification && !user.verification.isVerified) throw staticResponseMessageObject.emailNotVerified

            const isMatch = await compareHashPassword(params.password, user.password)
            if (!isMatch) throw staticResponseMessageObject.wrongPassword

            const verification = await createToken(user)

            const payload = { verification, _id: user._id, email: user.email, type: user.type }
            return res.status(200).json({ message: (await responseMessageObject('User', 'login')).success, payload })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    changePassword: async (req, res, next) => {
        try {
            const { currentPassword, newPassword } = req.body
            if(!newPassword && currentPassword && req.user && req.user.id) throw next(Boom.notFound((await responseMessageObject('data')).invalidProp))

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            const user = await findOne({ _id: decodeUser })
            if (!user) { return next(Boom.notFound((await responseMessageObject('User')).notFoundError)) }

            const isCorrectPassword = await compareHashPassword(currentPassword, user.password)
            if (!isCorrectPassword) throw staticResponseMessageObject.wrongPassword

            const password = await generateHashValue(newPassword)
            const payload = await update({ _id: decodeUser }, { password })
            if (!payload) { return next(Boom.notFound((await responseMessageObject('User', 'updated')).error)) }

            return res.status(200).json({ message: (await responseMessageObject('Password', 'changed')).success, payload })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },
}