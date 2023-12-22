const mongoose = require('mongoose')
const Boom = require('@hapi/boom')
const { log, checkRequiredParams, formatDate } = require('../lib/utils/utils')
const { dataTable } = require('../constant/appConstant')
const { responseMessageObject } = require('../lib/responseMessages/message')
const { getClassAndStudnetList, getStudentForSpecificClass } = require('../lib/config/googleOAuth')
const { find, findOne, counts, optionList, create, createImportedList, update, deleted } = require('../services/classroom')
const  csv = require('csvtojson');
const { generateHashValue } = require('../services/auth')
const { create: createStudent, findOne: studentFindOne } = require('../services/student')
const { create: createGrade, findOne: findOneGrade } = require('../services/grade')
const studentController = require("../controllers/student");

const createStudentObject = async (studentObj,decodeUser, classId) => {
    delete studentObj['id'];
    studentObj['password']  = await generateHashValue(studentObj['password'])
    studentObj['userName'] = await studentController.createUserName(`${studentObj['firstName']}.${studentObj['lastName'][0]}`)
    studentObj['teacher'] = decodeUser
    studentObj['classroom'] = classId
    return await createStudent(studentObj)
}

module.exports = {
    list: async (req, res, next) => {
        try {
            let { skip, limit } = req.body

            skip = skip ? Number(skip) : dataTable.skip
            limit = limit ? Number(limit) : dataTable.limit

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            const count = await counts({ "added_by": decodeUser })
            const list = await find({ "added_by": decodeUser }, skip, limit, { dt_added: -1 })

            return res.status(200).json({ message: (await responseMessageObject('Class list', 'fetch')).success, count, list })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    getById: async (req, res, next) => {
        try {
            const { id } = req.body
            if (!id) return next(Boom.notFound((await responseMessageObject('id')).notProvided))

            if (req.user && req.user.id) { Object.assign({ _id: id }, {added_by: req.user.id}) }
            
            let classroom = await findOne({ _id: id })
            if(!classroom) return next(Boom.notFound((await responseMessageObject('Class')).notExistError))

            return res.status(200).json({ message: (await responseMessageObject('Class', 'fetch')).success, classroom })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    optionList: async (req, res, next) => {
        try {
            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            const collection = await optionList({ "added_by": decodeUser }, 'name')
            return res.status(200).json({ message: (await responseMessageObject('Classroom optionList', 'fetch')).success, collection })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    create: async (req, res, next) => {
        try {
            const params = req.body
            const fieldsToRequired = ['name', 'grade']
            await checkRequiredParams(fieldsToRequired, params)

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }
            params.added_by = decodeUser

            const existingClass = await findOne({ $and: [{name: params.name}, { added_by: params.added_by },  { grade: params.grade }] })
            if (existingClass) return next(Boom.notFound((await responseMessageObject('Class')).alreadyExistError))

            params.dt_added = await formatDate()
            const classroom = await create(params)
            if (!classroom) return next(Boom.notFound((await responseMessageObject('Class', 'created')).error))

            return res.status(200).json({ message: (await responseMessageObject('Class', 'created')).success, classroom })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    update: async (req, res, next) => {
        try {
            const { id } = req.params
            const params = req.body

            if (!mongoose.Types.ObjectId.isValid(id)) return next(Boom.notFound((await responseMessageObject('id')).addProperProperty))
            if (!req.user || !req.user.id) return next(Boom.notFound((await responseMessageObject('token')).invalidProp))

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }
            params.added_by = decodeUser

            const isExistClass = await findOne({ _id:  id })
            if (!isExistClass) return next(Boom.notFound((await responseMessageObject('Class')).notExistError))

            const existingClass = await findOne({$and: [{ name: params.name }, { added_by: params.added_by }, { _id: { $ne: id } }]})
            if (existingClass) return next(Boom.notFound((await responseMessageObject('Class')).alreadyExistError))

            params.dt_upd = new Date()
            const classroom = await update({ _id: id, added_by: req.user.id }, params)
            if (!classroom) return next(Boom.notFound((await responseMessageObject('Class', 'updated')).error))

            return res.status(200).json({ message: (await responseMessageObject('Class', 'updated')).success, classroom })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    delete:async (req, res, next) => {
        try {
            const { id } = req.params
            
            if (!mongoose.Types.ObjectId.isValid(id)) return next(Boom.notFound((await responseMessageObject('id')).addProperProperty))
            if (!req.user || !req.user.id) return next(Boom.notFound((await responseMessageObject('token')).invalidProp))

            const isExistClass = await findOne({ _id:  id })
            if (!isExistClass) return next(Boom.notFound((await responseMessageObject('Class')).notExistError))

            const classroom = await deleted({ _id: id, added_by: req.user.id })
            if (!classroom) return next(Boom.notFound((await responseMessageObject('Class', 'deleted')).error))

            return res.status(200).json({ message: (await responseMessageObject('Class', 'deleted')).success })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    importStudent: async(req, res, next) => {
        const { classId, duplicateImport, duplicateStudentRecords } = req.body

        if (!classId) return next(Boom.notFound((await responseMessageObject('classId')).notProvided))

        let decodeUser = null
        if (req.user.id) { decodeUser = req.user.id }

        if(classId && duplicateImport) {
            const existingClass = await findOne({_id: mongoose.Types.ObjectId(classId)})
            let importedCount = 0
            let classroomName
            for(var i = 0;i<duplicateStudentRecords.length;i++){
                    const createdStudent = await createStudentObject(duplicateStudentRecords[i], decodeUser, classId)
                    if(createdStudent)
                        importedCount++
            }
            classroomName=existingClass.name
            
            return res.status(200).json({ message: (await responseMessageObject('Students', 'imported')).success, importedCount,classroomName})
        } else {
            const existingClass = await findOne({_id: mongoose.Types.ObjectId(classId)})
            let duplicateRecords = [], importedCount = 0
            let classroomName
            await csv()
            .fromFile(req.file.path)
            .then(async (jsonObj)=>{
                for(var i = 0;i<jsonObj.length;i++){
                    const studentExist = await studentFindOne({ firstName : jsonObj[i]['firstName'], lastName : jsonObj[i]['lastName'], classroom :  classId})
                    if(!studentExist) {
                        const createdStudent = await await createStudentObject(jsonObj[i], decodeUser, classId)
                        if(createdStudent) importedCount++
                    } else{
                        duplicateRecords.push(jsonObj[i])
                    }
                }
                classroomName=existingClass.name
                return res.status(200).json({ message: (await responseMessageObject('Students', 'imported')).success, duplicateRecords, importedCount,classroomName})
            }).catch((error) => {
                log(error)
                return next(Boom.notAcceptable(error.message))
            })
        }
    },

    importClassroom: async(req, res, next) => {
        try {
            const params = req.body
            if (!params?.classrooms?.length) return next(Boom.notFound((await responseMessageObject('Classrooms list')).notProvided))

            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }

            let classroom = await createImportedList(params.classrooms, decodeUser)
            if (!classroom?.length) { classroom = [] }

            return res.status(200).json({ message: (await responseMessageObject('Class list', 'Created')).success, classroom })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    googleClassroom: async(req, res, next) => {
        try {
            const { access_token } = req.body
            if (!access_token) return next(Boom.notFound((await responseMessageObject('access_token')).notProvided))

            let classroom = await getClassAndStudnetList(access_token)
            classroom = (classroom && classroom.courses && classroom.courses.length) ? classroom.courses : []

            return res.status(200).send({ message: (await responseMessageObject('Google classroom Summary', 'fetch')).success, classroom })
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    },

    importGoogleClassroom: async(req, res, next) => {
        try {
            const { access_token } = req.body
            if (!access_token) return next(Boom.notFound((await responseMessageObject('access_token')).notProvided))

            const importClassData = req.body.importClass
            let gradeID, classId
            var importedStudentCount = 0, importedClassCount = 0
            let decodeUser = null
            if (req.user.id) { decodeUser = req.user.id }
            
            for(i=0; i<importClassData?.length; i++) {
                const geadeExist = await findOneGrade({ title: importClassData[i].grade } )
                gradeID = (geadeExist) ? geadeExist.gradeId : null
                if(!gradeID) {
                    const createdGrade = await createGrade({ title: importClassData[i].grade } )
                    gradeID = createdGrade._id
                }
                const existingClass = await findOne({ $and: [{name: importClassData[i].name}, { added_by: decodeUser },  { grade: gradeID }] })
                classId = (existingClass) ? existingClass.classId : null
                if(!classId) {
                    const createdClassroom = await create({name : importClassData[i].name, grade: gradeID, added_by: decodeUser})
                    classId = createdClassroom._id
                    importedClassCount++
                }
                if(classId) {
                    let googleClassStudents = await getStudentForSpecificClass(access_token, importClassData[i].classId)
                    if(googleClassStudents.length > 0) {
                        for(j=0; j < googleClassStudents.length; j++) {
                            let studentObj = {
                                'firstName' : googleClassStudents[j].profile.name.givenName,
                                'lastName' : googleClassStudents[j].profile.name.familyName,
                                'password' : 'password'
                            }
                            let createdStudent = await createStudentObject(studentObj, decodeUser, classId)
                            if(createdStudent) 
                                importedStudentCount++
                        }
                    }
                }
            }
            return res.status(200).json({ message: (await responseMessageObject('Students', 'imported')).success, importedStudentCount, importedClassCount})
        } catch (error) {
            log(error)
            return next(Boom.notAcceptable(error.message))
        }
    }
}