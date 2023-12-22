const Boom = require('@hapi/boom')
const { log, checkRequiredParams, sumOfTime } = require('../lib/utils/utils')
const { responseMessageObject } = require('../lib/responseMessages/message')
const { findOne, create, update } = require('../services/studentActivity')

module.exports = {
    create: async (req, res, next) => {
        try {
            const params = req.body
            const fieldsToRequired = ['student', 'content', 'activities', 'timePlayed']
            await checkRequiredParams(fieldsToRequired, params)

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }
            params.added_by = decodeUser

            const isExistStudentActivity = await findOne({ student: params.student, content: params.content });
            let studentActivity
            if (isExistStudentActivity) {
                const durations = [ isExistStudentActivity.timePlayed, params.timePlayed ]
                params.timePlayed = await sumOfTime(durations)
                studentActivity = await update({ _id: isExistStudentActivity._id }, params)
            } else { studentActivity = await create(params); }

            if (!studentActivity) return next(Boom.notFound((await responseMessageObject('Student activity', 'created')).error))

            return res.status(200).json({ message: (await responseMessageObject('Student activity', 'created')).success, studentActivity })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },
}