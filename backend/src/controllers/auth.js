const Boom = require('@hapi/boom')
const { log, checkRequiredParams, emailRegex, addTime, getCurrentDateTime, isDatePast } = require('../lib/utils/utils')
const { sendForgotPasswordEmail, sendVerifyingUserEmail } = require('../lib/mailer')
const { googleLogin, googleBearerToken } = require('../lib/config/googleOAuth')
const { createToken } = require('../lib/passport/passport')
const { adminFrontendUrl, USER } = require('../constant/appConstant')
const { findOne, create, update } = require('../services/user')
const { responseMessageObject, staticResponseMessageObject } = require('../lib/responseMessages/message')
const { generateHashValue, compareHashPassword } = require('../services/auth')

const login = async (params) => {
    try {
        const fieldsToRequired = ['email', 'password']
        await checkRequiredParams(fieldsToRequired, params)

        const isValidEmail = await emailRegex(params.email)
        if (!isValidEmail) throw { error: (await responseMessageObject('email')).invalidProp }

        const user = await findOne({ type: USER.TYPE.TEACHER, email: params.email })
        if (!user) throw { error: (await responseMessageObject('credentials')).invalidProp }

        if (user.verification && !user.verification.isVerified) throw staticResponseMessageObject.emailNotVerified

        const isMatch = await compareHashPassword(params.password, user.password)
        if (!isMatch) throw staticResponseMessageObject.wrongPassword

        const verification = await createToken(user)

        const updatedUser = await update({ _id: user._id }, { verification })
        if (!updatedUser) throw { error: (await responseMessageObject('User', 'Updated')).error }

        const fullName = updatedUser.firstName + " " + updatedUser.lastName

        const payload = { verification, _id: updatedUser._id, email: updatedUser.email, type: updatedUser.type, fullName: fullName }
        return payload
    } catch (error) {
        return error
    }
}

module.exports = {
    login: async (req, res, next) => {
        try {
            const payload = await login(req.body)
            if (payload?.error) return next(Boom.notFound(payload.error))
            if (payload?.message) return next(Boom.notFound(payload.message))

            return res.status(200).json({ message: (await responseMessageObject('User', 'login')).success, payload })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    googleLogin: async (req, res, next) => {
        try {
            const params = req.body
            const payload = await googleLogin()
            return res.status(200).json({ message: (await responseMessageObject('Google login link', 'fetch')).success, payload })

            // if(!profile.email_verified) return next(Boom.badRequest(staticResponseMessageObject.googleLoginFailed))
            // const user = await findOne({ type: USER.TYPE.TEACHER, 'email': profile.email })

            // if (!user) {
            //     let googleUser = {
            //         'email': profile.email,
            //         'firstName': profile.given_name,
            //         'lastName': profile.family_name,
            //         'schoolName': params.schoolName,
            //         'state': params.state,
            //         'city': params.city,
            //         'password':'test123',
            //         "verification": {
            //             "isVerified": true,
            //             "token": "",
            //             "expireTime": null
            //         },
            //         "googleAuthId": params.tokenId,
            //         "registerType": 'GOOGLE'
            //     }

            //     googleUser.type = USER.TYPE.TEACHER
            //     const newUser = await create(googleUser)
            //     if (!newUser) throw staticResponseMessageObject.userRegisterFailed

            //     const payload = await login(newUser)
            // if (payload?.message) return next(Boom.notFound(payload.message))
            //     return res.status(200).json({ message: (await responseMessageObject('User', 'registered')).success, payload })
            // }
            // const payload = await login(params)
            // if (payload?.message) return next(Boom.notFound(payload.message))
            // return res.status(200).json({ message: (await responseMessageObject('User', 'login')).success, payload })
        }
        catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    googleBearerToken: async (req, res, next) => {
        try {
            const { url } = req.body
            if (!url) return next(Boom.notFound((await responseMessageObject('url')).notProvided))

            const payload = await googleBearerToken(url)
            return res.status(200).json({ message: (await responseMessageObject('Google bearer token', 'fetch')).success, payload })
        }
        catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    register: async (req, res, next) => {
        try {
            const params = req.body

            const fieldsToRequired = ['email', 'firstName', 'lastName', 'password']
            await checkRequiredParams(fieldsToRequired, params)

            const isValidEmail = await emailRegex(params.email)
            if (!isValidEmail) { return next(Boom.notFound((await responseMessageObject('email', null)).invalidProp)) }

            const user = await findOne({ type: USER.TYPE.TEACHER, email: params.email })
            if (user) { return next(Boom.notFound((await responseMessageObject('email', null)).alreadyExistError)) }

            params.type = USER.TYPE.TEACHER
            const newUser = await create(params)
            if (!newUser) throw staticResponseMessageObject.userRegisterFailed

            const token = await createToken(newUser)
            const link = `${adminFrontendUrl}/verify-email?${token.token}`
            const fullName = newUser.firstName + " " + newUser.lastName
            console.log('lllll')

            await sendVerifyingUserEmail(newUser.email, fullName, link)

            return res.status(200).json(staticResponseMessageObject.userRegisteredSendVerifiedMail)
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    registerWithGoogle: async (req, res, next) => {
        try {
            const params = req.body
            params.password = 'test123',
                params.verification = {
                    "isVerified": true,
                    "token": "",
                    "expireTime": null
                }

            const fieldsToRequired = ['email', 'firstName', 'lastName', 'password']
            await checkRequiredParams(fieldsToRequired, params)

            const user = await findOne({ type: USER.TYPE.TEACHER, email: params.email })
            if (user) { return next(Boom.notFound((await responseMessageObject('email', null)).alreadyExistError)) }

            params.type = USER.TYPE.GOOGLE
            const newUser = await create(params)
            if (!newUser) throw staticResponseMessageObject.userRegisterFailed

            const verification = await createToken(newUser)
            const updatedUser = await update({ _id: newUser._id }, { verification })

            const payload = { verification, _id: updatedUser._id, email: updatedUser.email, type: updatedUser.type }
            return res.status(200).json({ message: (await responseMessageObject('User', 'registered')).success, payload })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error))
        }
    },

    loginWithGoogle: async (req, res, next) => {
        try {
            const params = req.body
            const fieldsToRequired = ['email']
            await checkRequiredParams(fieldsToRequired, params)

            const isValidEmail = await emailRegex(params.email)
            if (!isValidEmail) throw { error: (await responseMessageObject('email')).invalidProp }

            const user = await findOne({ type: USER.TYPE.GOOGLE, email: params.email })
            if (!user) throw { error: (await responseMessageObject('credentials')).invalidProp }

            if (user.verification && !user.verification.isVerified) throw staticResponseMessageObject.emailNotVerified

            const verification = await createToken(user)

            const updatedUser = await update({ _id: user._id }, { verification })
            if (!updatedUser) throw { error: (await responseMessageObject('User', 'Updated')).error }
            const payload = { verification, _id: updatedUser._id, email: updatedUser.email, type: updatedUser.type }
            return res.status(200).json({ message: (await responseMessageObject('User', 'registered')).success, payload })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.error))
        }
    },

    verifyEmail: async (req, res, next) => {
        try {
            const user = await findOne({ "verification.token": req.headers.authorization })
            if (user && user.verification && user.verification.isVerified) throw staticResponseMessageObject.emailAlreadyVerified

            if (user && user.verification && user.verification.expireTime) {
                const isTokenValid = isDatePast(getCurrentDateTime(), user.verification.expireTime)
                if (!isTokenValid) throw staticResponseMessageObject.verificationTokenExpired
            }

            const verification = { token: req.headers.authorization, expireTime: addTime(1, getCurrentDateTime(), 'hours'), isVerified: true }
            const payload = await update({ _id: req.user.id }, { verification })
            if (!payload) throw staticResponseMessageObject.verificationDataNotUpdated

            return res.status(200).json({ message: (await responseMessageObject('User', 'authenticated')).success, payload })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    resendVerificationEmail: async (req, res, next) => {
        try {
            const { email } = req.body

            const fields = ['email']
            await checkRequiredParams(fields, { email })

            const user = await findOne({ email: email.toLowerCase() })
            if (!user) { return next(Boom.notFound((await responseMessageObject('User', null)).notFoundError)) }
            if (user && user.verification && user.verification.isVerified) throw staticResponseMessageObject.emailAlreadyVerified

            const token = await createToken(user)
            const link = `${adminFrontendUrl}/verify-email/${token.token}`
            const fullName = user.firstName + " " + user.lastName
            await sendVerifyingUserEmail(user.email, fullName, link)

            return res.status(200).json({ message: (await responseMessageObject('Verification mail', 'sent')).success })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    forgotPassword: async (req, res, next) => {
        try {
            const { email } = req.body
            if (!email) { return next(Boom.notFound((await responseMessageObject('email', null)).invalidProp)) }

            const isExistUser = await findOne({ email })
            if (!isExistUser) { return next(Boom.notFound((await responseMessageObject('email', null)).notExistError)) }

            const token = await createToken(isExistUser)
            const link = `${adminFrontendUrl}/reset-password/${token.token}`
            const fullName = isExistUser.firstName + " " + isExistUser.lastName

            await sendForgotPasswordEmail(email, fullName, link)

            return res.status(200).json({ message: (await responseMessageObject('Verification mail', 'sent')).success })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    resetPassword: async (req, res, next) => {
        try {
            const { newPassword } = req.body
            if (!newPassword && req.user && req.user.id) { return next(Boom.notFound((await responseMessageObject('data')).invalidProp)) }

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            const user = await findOne({ _id: decodeUser })
            if (!user) { return next(Boom.notFound((await responseMessageObject('User', null)).notFoundError)) }

            const password = await generateHashValue(newPassword)
            const payload = await update({ _id: decodeUser }, { password })
            if (!payload) { return next(Boom.notFound((await responseMessageObject('User', 'updated')).error)) }

            return res.status(200).json({ message: (await responseMessageObject('Password', 'changed')).success, payload })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    changePassword: async (req, res, next) => {
        try {
            const { currentPassword, newPassword } = req.body
            if (!newPassword && currentPassword && req.user && req.user.id) throw next(Boom.notFound((await responseMessageObject('data')).invalidProp))

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