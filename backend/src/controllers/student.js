const Boom = require('@hapi/boom')
const { generateHashValue, compareHashPassword } = require('../services/auth')
const { log, checkRequiredParams, emailRegex } = require('../lib/utils/utils')
const { dataTable } = require('../constant/appConstant')
const { responseMessageObject } = require('../lib/responseMessages/message')
const { find, findOne, counts, create, update, deleted } = require('../services/student')
const { findOne: findOneStudentActivity } = require('../services/studentActivity')
const { findOne: findOneClassroom } = require('../services/classroom')

const getClass = async (list) => {
    if (list && list.length) {
        list = await Promise.all(list.map(async (oneStudent) => {
            const activity = await findOneStudentActivity({ student: oneStudent._id })
            if (activity) {
                delete activity.student
                Object.assign(oneStudent, { activity })
            } else { oneStudent.activity = {} }
           return oneStudent;
        }))
    }
    return list
}

const createUserName = async (userName) => {
    const userNameExist = await findOne({ userName })
    if (!userNameExist) return userName;
    userName = `${userName}${Math.floor(Math.random() * 99) + 1}`
    return await createUserName(userName)
}

module.exports = {
    list: async (req, res, next) => {
        try {
            let { skip, limit, classId } = req.body

            skip = skip ? Number(skip) : dataTable.skip
            limit = limit ? Number(limit) : dataTable.limit

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            const query = (classId) ? { 'teacher': decodeUser, 'classroom': classId } : { 'teacher': decodeUser }

            const count = await counts(query)
            const list = await find(query, skip, limit, { dt_added: -1 })

            if (classId) { await getClass(list) }

            return res.status(200).json({ message: (await responseMessageObject('Student list', 'fetch')).success, count, list })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    getById: async (req, res, next) => {
        try {
            const { id } = req.body
            if (!id) return next(Boom.notFound((await responseMessageObject('id')).notProvided))

            let student = await findOne({ _id: id })
            if(!student) return next(Boom.notFound((await responseMessageObject('Student')).notFoundError))

            return res.status(200).json({ message: (await responseMessageObject('Student', 'fetch')).success, student })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    create: async (req, res, next) => {
        try {
            const params = req.body
            const fieldsToRequired = ['firstName', 'lastName', 'classroom']
            await checkRequiredParams(fieldsToRequired, req.body)

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }
            params.teacher = decodeUser

            if (params.parentEmail) {
                const isValidEmail = await emailRegex(params.parentEmail)
                if (!isValidEmail) { return next(Boom.notFound((await responseMessageObject('email', null)).invalidProp)) }
                params.parentEmail = params.parentEmail.toLowerCase().trim()   
            }

            params.userName = await createUserName(`${params.firstName}.${params.lastName.charAt(0)}`)
            const existingStudent = await findOne({ $and: [{ userName: params.userName }, { classroom: params.classroom }] })
            if (existingStudent) return next(Boom.notFound((await responseMessageObject('Student')).alreadyExistError))

            if (params.password) { params.password = await generateHashValue(params.password) }

            if (req.file) { params.avatar = req.file.filename }

            const student = await create(params)
            if (!student) return next(Boom.notFound((await responseMessageObject('Student', 'created')).error))

            return res.status(200).json({ message: (await responseMessageObject('Student', 'created')).success, student })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    createList: async (req, res, next) => {
        try {
            let params = req.body
            const fieldsToRequired = ['classroom']
            await checkRequiredParams(fieldsToRequired, req.body)

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            let studentArr = []
            if (params.students && params.students.length) {
                await Promise.all(params.students.map(async (oneStudent) => {
                    const fieldsToRequired = ['firstName', 'lastName']
                    await checkRequiredParams(fieldsToRequired, oneStudent)

                    oneStudent.userName = await createUserName(`${oneStudent.firstName}.${oneStudent.lastName.charAt(0)}`)
                    const existingStudent = await findOne({ $and: [{ userName: oneStudent.userName }, { classroom: params.classroom }] })
                    if (existingStudent) return next(Boom.notFound((await responseMessageObject('Class with student list')).alreadyExistError))

                    oneStudent.classroom = params.classroom
                    oneStudent.teacher = decodeUser

                    const studentList = await create(oneStudent)
                    if (!studentList) return next(Boom.notFound((await responseMessageObject(`Class with student firstName: ${oneStudent.firstName} and lastName: ${oneStudent.lastName}`, 'created')).error))
                    studentArr.push(studentList)
                    return studentArr
                }))
            }

            let student = {}
            student.class = await findOneClassroom({_id: params.classroom}).then((e) => {return e.name } )
            student.students = (studentArr && studentArr.length >= 1) ? studentArr.length : '0'

            return res.status(200).json({ message: (await responseMessageObject('Class with student list', 'created')).success, student })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    update: async (req, res, next) => {
        try {
            const { id } = req.params
            const params = req.body

            const existingStudent = await findOne({ _id: id })
            if (!existingStudent) return next(Boom.notFound((await responseMessageObject('Student')).notExistError))

            const isExistStudent = await findOne({ $and: [{ userName: existingStudent.userName }, { classroom: params.classroom }, { _id: { $ne: id } }] })
            if (isExistStudent) return next(Boom.notFound((await responseMessageObject('Student')).alreadyExistError))

            if (params.userName) {
                const existingStudentUserName = await findOne({ $and: [{ userName: params.userName }, { _id: { $ne: id } }] })
                if (existingStudentUserName) return next(Boom.notFound((await responseMessageObject('Username')).alreadyExistError))
            }

            if (params.parentEmail) {
                const isValidEmail = await emailRegex(params.parentEmail)
                if (!isValidEmail) { return next(Boom.notFound((await responseMessageObject('email', null)).invalidProp)) }
                params.parentEmail = params.parentEmail.toLowerCase().trim()
            }

            if (params.password) {
                if (existingStudent) {
                    if (existingStudent.password) {
                        const isCorrectPassword = await compareHashPassword(params.password, existingStudent.password)
                        if (!isCorrectPassword) { params.password = await generateHashValue(params.password) }
                        else { delete params.password }
                    } else {
                        params.password = await generateHashValue(params.password)
                    }
                }
            }

            // if (params.firstName && params.lastName) { params.userName = await createUserName(`${params.firstName}.${params.lastName.charAt(0)}`) }
            // if (params.firstName && !params.lastName) { params.userName = await createUserName(`${params.firstName}.${existingStudent.lastName.charAt(0)}`) }
            // if (!params.firstName && params.lastName) { params.userName = await createUserName(`${existingStudent.firstName}.${params.lastName.charAt(0)}`) }

            params.dt_upd = new Date()
            const student = await update({ _id: id }, params)
            if (!student) return next(Boom.notFound((await responseMessageObject('Student', 'updated')).error))

            return res.status(200).json({ message: (await responseMessageObject('Student', 'updated')).success, student })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    delete: async (req, res, next) => {
        try {
            const { id } = req.params

            const isExistStudent = await findOne({ _id: id })
            if (!isExistStudent) return next(Boom.notFound((await responseMessageObject('Student')).notExistError))

            const student = await deleted({ _id: id })
            if (!student) return next(Boom.notFound((await responseMessageObject('Student', 'deleted')).error))

            return res.status(200).json({ message: (await responseMessageObject('Student', 'deleted')).success })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },
    createUserName : createUserName
}