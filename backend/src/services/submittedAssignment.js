const mongoose = require('mongoose')
const moment = require('moment')
const { awsContentImageUrl } = require('../constant/appConstant')
const { findOne: findOneAssignmentGrade } = require('./assignmentGrade')
const { staticResponseMessageObject } = require('../lib/responseMessages/message')

module.exports = {
    find: async (search, skip, limit, sort) => {
        const list = await submittedAssignmentModel.aggregate([
            { $match: search },
            {
                "$lookup": {
                    "from": "Students",
                    "localField": "student",
                    "foreignField": "_id",
                    "as": "student",
                    "pipeline" : [{ "$project" : { "_id": 1, "userName": 1 } }],
                }
            },
            {
                "$lookup": {
                    "from": "Assignments",
                    "localField": "assignment",
                    "foreignField": "_id",
                    "as": "assignment",
                    "pipeline" : [{ "$project" : { "_id": 1, "title": 1 } }],
                }
            },
            {
                "$lookup": {
                    "from": "AssignmentGrades",
                    "localField": "assignmentGrade",
                    "foreignField": "_id",
                    "as": "assignmentGrade",
                    "pipeline" : [{ "$project" : { "_id": 1, "title": 1, "color": 1 } }],
                }
            },
            {
                $set: {
                   currectAnswer: { $sum: "$contentScore.currectAnswer" },
                   wrongAnswer: { $sum: "$contentScore.wrongAnswer" },
                   blankAnswer: { $sum: "$contentScore.blankAnswer" }
                }
            },
            { $set: { score: { $avg: "$contentScore.score" } } },
            { $set: { submittedAssignmentId: "$_id" } },
            {
                "$lookup": {
                    "from": "Contents",
                    "localField": "contentScore.content",
                    "foreignField": "_id",
                    "as": "contentScore.content"
                }
            },
            { $skip : skip },
            { $limit : limit },
            { $sort : sort },
        ])
        return list
    },

    findAssignmentsByStudentId: async (studentId, classId, skip, limit, sort) => {
        let list = await assignmentModel.aggregate([
            { $match: { $and: [
                {assignedStudents: { $in: [mongoose.Types.ObjectId(studentId)] },
                assignedClass: { $in: [mongoose.Types.ObjectId(classId)] },}
         ] } },
            {
                "$lookup": {
                    "from": "SubmittedAssignments",
                    "localField": "_id",
                    "foreignField": "assignment",
                    "as": "SubmittedAssignments",
                }
            },
            { "$unwind": { path: '$SubmittedAssignments', preserveNullAndEmptyArrays: true } },
            {
                "$lookup": {
                    "from": "AssignmentGrades",
                    "localField": "SubmittedAssignments.assignmentGrade",
                    "foreignField": "_id",
                    "as": "assignmentGrade",
                    "pipeline" : [{ "$project" : { "_id": 1, "title": 1, "color": 1 } }],
                }
            },
            {
                "$lookup": {
                    "from": "Students",
                    "localField": "assignedStudents",
                    "foreignField": "_id",
                    "as": "student",
                }
            },
            {
                $set: {
                   currectAnswer: { $sum: "$SubmittedAssignments.contentScore.currectAnswer" },
                   wrongAnswer: { $sum: "$SubmittedAssignments.contentScore.wrongAnswer" },
                   blankAnswer: { $sum: "$SubmittedAssignments.contentScore.blankAnswer" },
                   submittedDate: "$SubmittedAssignments.dt_added",
                   time: "$SubmittedAssignments.contentScore.time"
                }
            },
            { $set: { score: { $avg: "$SubmittedAssignments.contentScore.score" } } },
            {
                "$lookup": {
                    "from": "Contents",
                    "localField": "SubmittedAssignments.contentScore.content",
                    "foreignField": "_id",
                    "as": "SubmittedAssignments.contentScore.content"
                }
            },
            { $skip : skip },
            { $limit : limit },
            { $sort : sort },
        ])

        list = list.filter((a, i) => list.findIndex((s) => a.title === s.title) === i)
        .map((e) => {
            if (e) {
                if (e.time && e.time.length) {
                    const totalDurations = e.time.slice(1).reduce((prev, cur) => moment.duration(cur).add(prev),
                    moment.duration(e.time[0]))
                    e.time = moment.utc(totalDurations.asMilliseconds()).format("HH:mm:ss")
                } else {
                    e.time = null
                }
                if (!e.submittedDate) { e.submittedDate = null }
            }
            return e
        })
        return list
    },

    populateList: async (search) => {
        const list = await submittedAssignmentModel.aggregate([
            {
                "$lookup": {
                    "from": "Students",
                    "localField": "student",
                    "foreignField": "_id",
                    "as": "student",
                    "pipeline" : [{ "$project" : { "_id": 1, "userName": 1 } }],
                }
            },
            {
                "$lookup": {
                    "from": "Assignments",
                    "localField": "assignment",
                    "foreignField": "_id",
                    "as": "assignment",
                    "pipeline" : [{ "$project" : { "_id": 1, "title": 1 } }],
                }
            },
            {
                "$lookup": {
                    "from": "AssignmentGrades",
                    "localField": "assignmentGrade",
                    "foreignField": "_id",
                    "as": "assignmentGrade",
                    "pipeline" : [{ "$project" : { "_id": 1, "title": 1, "color": 1 } }],
                }
            },
            {
                $set: {
                   currectAnswer: { $sum: "$contentScore.currectAnswer" },
                   wrongAnswer: { $sum: "$contentScore.wrongAnswer" },
                   blankAnswer: { $sum: "$contentScore.blankAnswer" }
                }
            },
            { $set: { score: { $avg: "$contentScore.score" } } },
            { $set: { submittedAssignmentId: "$_id" } },
            {
                "$lookup": {
                    "from": "Contents",
                    "localField": "contentScore.content",
                    "foreignField": "_id",
                    "as": "contentScore.content"
                }
            },
            { "$unwind": { path: '$contentScore.content', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: { contentId: '$contentScore.content.ver' },
                    content: { $addToSet:"$contentScore.content"},
                    totalPopulateContentCount: {$sum:1}
                }
            },
            { $match: { 'content.grades': mongoose.Types.ObjectId(search) } },
            {
                $project: {
                    content: '$content',
                    totalPopulateContentCount: '$totalPopulateContentCount',
                    _id: 0
                }
            },
            { "$unwind": { path: '$content', preserveNullAndEmptyArrays: true } },
            { $sort : {'totalPopulateContentCount': -1} },
        ])
        return list
    },

    counts: async (query) => { return await submittedAssignmentModel.count(query) },

    findOne: async (query) => {
        const result = await submittedAssignmentModel.findOne(query).populate('student', 'userName').populate('assignment', 'title').populate('assignmentGrade', 'title color').populate('contentScore.content').lean().exec();
        if (result) { result.submittedAssignmentId = result._id }
        return result;
    },

    getOneRecordWithoutPopulate: async (query) => {
        const result = await submittedAssignmentModel.findOne(query).lean().exec();
        if (result) { result.submittedAssignmentId = result._id }
        return result;
    },

    getByProperty: async (query, select) => {
        const assignment = await submittedAssignmentModel.find(query).populate('contentScore.content').populate('assignmentGrade', 'title color').select(select).lean().exec();
        let time = []
        if (assignment && assignment.length) {
            await assignment.map((oneAssignment) => {
                oneAssignment.assignmentId = oneAssignment._id;
                oneAssignment.contentScore.map(async (oneContentScore) => {
                    // ContentId
                    oneContentScore.content.contentId = oneContentScore.content._id;
    
                    // ThumbnailList
                    if (oneContentScore.content.worky_id) {
                        oneContentScore.content.thumbnail = awsContentImageUrl + oneContentScore.content.worky_id + '_1.jpg'
                    }

                    if (oneContentScore.time) { time.push(oneContentScore.time) }
                });

                if (time?.length) {
                    const totalDurations = time.slice(1).reduce((prev, cur) => moment.duration(cur).add(prev),
                    moment.duration(time[0]))
                    time = moment.utc(totalDurations.asMilliseconds()).format("HH:mm:ss")
                }

                oneAssignment.totalScore = oneAssignment.contentScore.reduce((a, b) => { return {
                    totalCorrectAnswer: a.currectAnswer + b.currectAnswer,
                    totalWrongAnswer: a.wrongAnswer + b.wrongAnswer,
                    totalBlankAnswer: a.blankAnswer + b.blankAnswer,
                    averagePercentage: (a.score + b.score) / oneAssignment.contentScore.length,
                    time,
                    submittedDate: oneAssignment.dt_added,
                    assignmentGrade: oneAssignment.assignmentGrade
                } })

                // delete oneAssignment.assignmentGrade
            })
        }
        return assignment;
    },

    create: async (params) => {
        const assignmentSubmitted = new submittedAssignmentModel(params);
        let result = await assignmentSubmitted.save();

        // Assignment Grade
        const gradeList = await submittedAssignmentModel.aggregate([
            { $match: {_id: result._id} },
            {
              $project: {
                  "assignmentGrade" : {
                    $switch: {
                        branches: [
                            { case: { $gte: [ { $avg : "$contentScore.score" }, 90 ] }, then: "A" },
                            { case: { $gte: [ { $avg : "$contentScore.score" }, 80 ] }, then: "B" },
                            { case: { $gte: [ { $avg : "$contentScore.score" }, 70 ] }, then: "C" },
                            { case: { $gte: [ { $avg : "$contentScore.score" }, 60 ] }, then: "D" },
                        ],
                        default: "F"
                    } }
                }
            }
        ])

        const getAssignmentGrade = await findOneAssignmentGrade({ title: gradeList[0].assignmentGrade })
        if (!getAssignmentGrade) throw staticResponseMessageObject.somethingWentToWrong

        result = await submittedAssignmentModel.findByIdAndUpdate({ _id : gradeList[0]._id }, { assignmentGrade: getAssignmentGrade._id }, { new: true }).exec();
        return result;
    },

    update: async (_id, body) => {
        const result = await submittedAssignmentModel.findByIdAndUpdate(_id, body, { new: true }).exec();    
        return result;
    },

    updateAll: async (list) => {
        const result = await Promise.all(list.map(async (oneSubAmnt) => {
            oneSubAmnt.dt_upd = new Date()
            const updated = await submittedAssignmentModel.findOneAndUpdate(
                { student: oneSubAmnt.studentId, assignment: oneSubAmnt.assignmentId },
                { $set: oneSubAmnt }, { new: true }
            )
            return updated
        }))
        return result;
    },
}