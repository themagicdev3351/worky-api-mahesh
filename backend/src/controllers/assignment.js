const Boom = require('@hapi/boom')
const { Parser } = require('json2csv')
const { log, checkRequiredParams, formatDate, getSearchRegexp } = require('../lib/utils/utils')
const { dataTable } = require('../constant/appConstant')
const { responseMessageObject } = require('../lib/responseMessages/message')
const { find, counts, findOne, getByProperty, findAllDetailsByAssignmentId, create, update, deleted, exportAssignmentGrades } = require('../services/assignment')
const { optionList: studentOptionList } = require('../services/student')
const { find: collectionFind } = require('../services/collection')

module.exports = {
    list: async (req, res, next) => {
        try {
            let params = req.body
            // if (!params.classId) return res.status(200).json({ message: (await responseMessageObject('Assignment list', 'fetch')).success, count: 0, list: [] })

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            const skip = params.skip ? Number(params.skip) : dataTable.skip
            const limit = params.limit ? Number(params.limit) : dataTable.limit

            let searchFilter = {}
            if (params.search) {
                searchFilter = {
                    $or: [
                        { 'title': await getSearchRegexp(params.search) },
                        { 'assignmentType': await getSearchRegexp(params.search) },
                    ],
                }
            }

            const sorting = []
            switch (Number(params.column)) {
                case 0:
                    sorting.push(['title', params.order || 'ASC'])
                    break
                case 1:
                    sorting.push(['assignmentType', params.order || 'ASC'])
                    break
                default:
                    sorting.push(['dt_added', 'DESC'])
                    break
            }
            
            if (params.classId) { Object.assign(searchFilter, { assignedClass: { "$in": params.classId } }) }
            Object.assign(searchFilter, { added_by: decodeUser })
            
            const count = await counts(searchFilter);
            const list = await find(searchFilter, skip, limit, sorting, decodeUser);

            return res.status(200).json({ message: (await responseMessageObject('Assignment list', 'fetch')).success, count, list })
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

            const assignment = await findOne({ $and: [{_id: id, added_by: decodeUser}] }, decodeUser)
            if(!assignment) return next(Boom.notFound((await responseMessageObject('Assignment')).notFoundError))

            return res.status(200).json({ message: (await responseMessageObject('Assignment', 'fetch')).success, assignment })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    getByStudent: async (req, res, next) => {
        try {
            const { studentId } = req.body
            if (!studentId) return next(Boom.notFound((await responseMessageObject('studentId')).notProvided))

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            const assignment = await getByProperty({ $and: [{assignedStudents: {$in: studentId }, added_by: decodeUser}] }, 'title')

            return res.status(200).json({ message: (await responseMessageObject('Assignment Based on Student', 'fetch')).success, assignment })
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

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            const existingAssignment = await findOne({ title: params.title })
            if (existingAssignment) return next(Boom.notFound((await responseMessageObject('Assignment')).alreadyExistError))

            if (params.startDate) { params.startDate = new Date(await formatDate(params.startDate)) }
            if (params.endDate) { params.endDate = new Date(await formatDate(params.endDate)) }

            if (params.assignedClass && params.assignedClass.length) { params.assignedClass = (params.assignedClass.length > 1) ? params.assignedClass.toString().split(',').map((e) => e.trim()): params.assignedClass }
            if (params.assignedStudents && params.assignedStudents.length) { params.assignedStudents = (params.assignedStudents.length> 1) ? params.assignedStudents.toString().split(',').map((e) => e.trim()): params.assignedStudents }

            if (params.assignedTo) { params.assignedTo = params.assignedTo.charAt(0).toUpperCase() + params.assignedTo.slice(1) }

            if (params.assignedTo && params.assignedTo === 'Classroom' && params.assignedClass.length && !params?.assignedStudents?.length) {
                let studentIdList = []
                const classId = params.assignedClass[0]
                const studentListBasedOnClass = await studentOptionList({ classroom: classId }, '_id')
                if (studentListBasedOnClass && studentListBasedOnClass.length) { await studentListBasedOnClass.map((e) => { studentIdList.push(String(e['_id'])) }) }
                params.assignedStudents = (studentIdList && studentIdList.length> 1) ? studentIdList.toString().split(',').map((e) => e.trim()): studentIdList
            }

            // Multiple Assignment with content
            if (params?.collection?.length && !params?.content?.length) {
                let list = null
                let contentList = []
                list = await collectionFind({ "_id": {$in: params?.collection} }, null, null, null, decodeUser)
                list = await Promise.all(list.map(async (oneCollection) => {
                   await oneCollection.content.map((e) => { return contentList.push(e._id) })
                   return contentList
                }))
               params.content = [... new Set(contentList)]
            }
            if (!params?.collection?.length && params?.content?.length) { params.content = params.content.toString().split(',').map((e) => e.trim()) }

            params.added_by = decodeUser
            params.dt_added = await formatDate()
            const assignment = await create(params)
            if (!assignment) return next(Boom.notFound((await responseMessageObject('Assignment', 'created')).error))

            return res.status(200).json({ message: (await responseMessageObject('Assignment', 'created')).success, assignment })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    getListByStatus: async (req, res, next) => {
        try {
            const { status, classId } = req.body
            if (!status) return next(Boom.notFound((await responseMessageObject('status')).notProvided))
            // if (!classId) return next(Boom.notFound((await responseMessageObject('classId')).notProvided))

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            let searchFilter = {}
            Object.assign(searchFilter, { added_by: decodeUser })

            if (classId) { Object.assign(searchFilter, { assignedClass: { "$in": classId } }) }
            const assignment = await find(searchFilter, null, null, { dt_added: -1 }, decodeUser, status);

            return res.status(200).json({ message: (await responseMessageObject('Assignment', 'fetch')).success, assignment })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    update: async (req, res, next) => {
        try {
            const { id } = req.params
            const params = req.body

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            const isExistAssignment = await findOne({ _id:  id })
            if (!isExistAssignment) return next(Boom.notFound((await responseMessageObject('Assignment')).notExistError))

            const existingAssignment = await findOne({$and: [{ title: params.title }, { _id: { $ne: id } }]})
            if (existingAssignment) return next(Boom.notFound((await responseMessageObject('Assignment')).alreadyExistError))

            if (params.startDate) { params.startDate = new Date(params.startDate) }
            if (params.endDate) { params.endDate = new Date(params.endDate) }
            if (params.assignedTo) { params.assignedTo = params.assignedTo.charAt(0).toUpperCase() + params.assignedTo.slice(1) }

            if (params.assignedClass && params.assignedClass.length) { params.assignedClass = (params.assignedClass.length > 1) ? params.assignedClass.toString().split(',').map((e) => e.trim()): params.assignedClass }
            if (params.assignedStudents && params.assignedStudents.length) { params.assignedStudents = (params.assignedStudents.length> 1) ? params.assignedStudents.toString().split(',').map((e) => e.trim()): params.assignedStudents }

            if (params.assignedTo && params.assignedTo === 'Classroom' && params.assignedClass.length && !params?.assignedStudents?.length) {
                let studentIdList = []
                const studentListBasedOnClass = await studentOptionList({ classroom: params.assignedClass[0] }, '_id')
                if (studentListBasedOnClass && studentListBasedOnClass.length) { await studentListBasedOnClass.map((e) => { studentIdList.push(String(e['_id'])) }) }
                params.assignedStudents = (studentIdList && studentIdList.length> 1) ? studentIdList.toString().split(',').map((e) => e.trim()): studentIdList
            }

            // Multiple Assignment with content
            if (params?.collection?.length && !params?.content?.length) {
                let list = null
                let contentList = []
                list = await collectionFind({ "_id": {$in: params?.collection} }, null, null, null, decodeUser)
                list = await Promise.all(list.map(async (oneCollection) => {
                   await oneCollection.content.map((e) => { return contentList.push(e._id) })
                   return contentList
                }))
               params.content = [... new Set(contentList)]
            }

            const assignmentObj = await findOne({ _id: id })
            if (params?.content?.length) {
                if (assignmentObj?.content?.length) {
                    const filteredArr = params.content.filter((objOne) => {
                        return !assignmentObj.content.some((objTwo) => {
                            return objOne.toString() === objTwo._id.toString()
                        })
                    })
                    if (filteredArr && filteredArr.length) { filteredArr.toString().split(',').map((e) => assignmentObj.content.push(e.trim())) }
                } else {
                    assignmentObj.content = params.content.toString().split(',').map((e) => e.trim())
                }
                params.content = assignmentObj.content
            }


            params.dt_upd = new Date()
            const assignment = await update({ _id: id }, params);
            if (!assignment) return next(Boom.notFound((await responseMessageObject('Assignment', 'updated')).error))

            return res.status(200).json({ message: (await responseMessageObject('Assignment', 'updated')).success, assignment })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    delete: async (req, res, next) => {
        try {
            const _id = req.params.id

            const isExistAssignment = await findOne({ _id })
            if (!isExistAssignment) return next(Boom.notFound((await responseMessageObject('Assignment')).notExistError))

            const assignment = await deleted({ _id: req.params.id });
            if (!assignment) return next(Boom.notFound((await responseMessageObject('Assignment', 'deleted')).error))

            return res.status(200).json({ message: (await responseMessageObject('Assignment', 'deleted')).success })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    getStudentsAssignmentDetails: async(req, res, next) => {
        try {
            const { assignmentId, classId } = req.body
            let { column, order, limit, skip } = req.query

            skip = skip ? Number(skip) : dataTable.skip
            limit = limit ? Number(limit) : dataTable.limit

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            const sorting = {}
            switch (Number(column)) {
                case 0:
                    Object.assign(sorting, {'student_name': Number(order)})
                    break
                case 1:
                    Object.assign(sorting, {'assignmentGrades.title': Number(order)})
                    break
                case 2:
                    Object.assign(sorting, {'submittedDate': Number(order)})
                    break
                default:
                    Object.assign(sorting, {'submittedDate': Number(-1)})
                    break
            }

            let studentsAssignmentData = await findAllDetailsByAssignmentId(assignmentId, decodeUser, classId, sorting, skip, limit)
            if(!studentsAssignmentData) { studentsAssignmentData = {} }

            return res.status(200).json({ message: (await responseMessageObject('Student Assignment List', 'fetch')).success, studentsAssignmentData})
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    exportStudentAssignmentGrades: async(req, res, next) => {
        try {
            const assignmentId = req.params.id
            if (!assignmentId) return next(Boom.notFound((await responseMessageObject('assignment id')).notProvided))

            const studentsAssignmentData = await exportAssignmentGrades(assignmentId)
            if(!studentsAssignmentData.length) return next(Boom.notFound((await responseMessageObject('Assignment')).notFoundError))

            const fields = [
                { label: 'Student Name', value: 'studentName' },
                { label: 'Assignment Name', value: 'assignmentName' },
                { label: 'Assignment Type', value: 'assignmentType' },
                { label: 'Percentage', value: 'percentage' },
                { label: 'Grade', value: 'assignmentGrade' },
            ];

            const json2csvParser = new Parser({ fields });
            const csv = json2csvParser.parse(studentsAssignmentData);

            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", "attachment; filename=students_grade.csv");
            res.status(200).end((await responseMessageObject('File', 'Downloaded')).success);
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    }
}