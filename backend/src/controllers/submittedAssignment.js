const objectId = require('mongoose').Types.ObjectId
const Boom = require('@hapi/boom')
const { log, checkRequiredParams } = require('../lib/utils/utils')
const { dataTable } = require('../constant/appConstant')
const { responseMessageObject } = require('../lib/responseMessages/message')
const { find, findAssignmentsByStudentId, findOne, getByProperty, getOneRecordWithoutPopulate, counts, create, update, updateAll } = require('../services/submittedAssignment')
const { create: createNotification } = require('../services/notification')
const { findOne: assignmentFindOne } = require('../services/assignment')

module.exports = {
    getListByStudent: async (req, res, next) => {
        try {
            let { skip, limit, studentId, classId } = req.body

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            skip = skip ? Number(skip) : dataTable.skip
            limit = limit ? Number(limit) : dataTable.limit

            // const count = await counts({ student: mongoose.Types.ObjectId(studentId) });
            // const list = await find({student: mongoose.Types.ObjectId(studentId)}, skip, limit, { dt_added: -1 }, decodeUser);
            const list = await findAssignmentsByStudentId(studentId, classId, skip, limit, { dt_added: -1 }, decodeUser);

            return res.status(200).json({ message: (await responseMessageObject('Assignment list', 'fetch')).success, count: list.length, list })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    getByStudent: async (req, res, next) => {
        try {
            const { studentId, assignmentId } = req.body
            if (!studentId) return next(Boom.notFound((await responseMessageObject('studentId')).notProvided))
            if (!assignmentId) return next(Boom.notFound((await responseMessageObject('assignmentId')).notProvided))

            const submittedAssignment = await getByProperty({ student: objectId(studentId), assignment: objectId(assignmentId) })
            
            return res.status(200).json({ message: (await responseMessageObject('Assignment Based on Student', 'fetch')).success, submittedAssignment })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    create: async (req, res, next) => {
        try {
            const params = req.body
            const fieldsToRequired = ['name', 'student','assignment']
            await checkRequiredParams(fieldsToRequired, params)
            
            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }
            params.added_by = decodeUser

            const assignmentData = await assignmentFindOne({'_id' : params.assignment})
            if(!assignmentData || !assignmentData.assignedStudents.find(students => students._id == params.student)) {
              return next(Boom.notFound((await responseMessageObject('Assignment')).notFoundError))
            }

            const submittedAssignments = await findOne({ student: params.student, assignment: params.assignment });
            if(submittedAssignments) return next(Boom.notFound((await responseMessageObject('Assignment')).alreadySubmittedError))

            const assignmentSubmitted = await create(params);
            if (!assignmentSubmitted) return next(Boom.notFound((await responseMessageObject('Assignment', 'submitted')).error))

            const createNotify = await createNotification({
                student: assignmentSubmitted.student,
                assignment: assignmentSubmitted.assignment,
                submittedAssignment: assignmentSubmitted._id,
                added_by: decodeUser,
                dt_added: new Date()
            })
            if (!createNotify) return next(Boom.notFound((await responseMessageObject('Submitted assignment notification', 'added')).error))

            return res.status(200).json({ message: (await responseMessageObject('Assignment', 'submitted')).success, assignmentSubmitted, createNotify })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    updateGradeList: async (req, res, next) => {
        try {
            const params = req.body

            await params.map(async (oneParam) => {
                const isExistSubmAmnt = await findOne({ student: oneParam.studentId, assignment: oneParam.assignmentId })
                if (!isExistSubmAmnt) return next(Boom.notFound((await responseMessageObject('Submitted assignment')).notExistError))
            })

            const submittedAssignment = await updateAll(params)
            if (!submittedAssignment) return next(Boom.notFound((await responseMessageObject('Assignment grade', 'updated')).error))

            return res.status(200).json({ message: (await responseMessageObject('Assignment grade', 'updated')).success, submittedAssignment })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    update: async (req, res, next) => {
        try {
            const _id = req.params.id
            const params = req.body

            const isExistSmtAsmnt = await getOneRecordWithoutPopulate({ _id })
            if (!isExistSmtAsmnt) return next(Boom.notFound((await responseMessageObject('Record')).notExistError))

            if (params.student || params.assignment) {
                const existSmtAsmnt = await findOne({$and: [{ student: params.student, assignment: params.assignment }, { _id: { $ne: _id } }]})
                if (existSmtAsmnt) return next(Boom.notFound((await responseMessageObject('Record')).alreadyExistError))                
            }

            if (params.grade && !params.contentId) {
                return next(Boom.notFound((await responseMessageObject('ContentId')).notProvided))
            } else {
                params.contentScore = await Promise.all(isExistSmtAsmnt.contentScore.map((oneContentScore) => {
                    if (oneContentScore.content._id.toString() === params.contentId.toString()) {
                        oneContentScore.grade = params.grade.toUpperCase()
                    }
                    return oneContentScore
                }))
            }

            delete params.contentId
            delete params.grade

            params.dt_upd = new Date()
            const submittedAssignment = await update({ _id }, params)
            if (!submittedAssignment) return next(Boom.notFound((await responseMessageObject('Record', 'updated')).error))

            return res.status(200).json({ message: (await responseMessageObject('Record', 'updated')).success, submittedAssignment })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },
}