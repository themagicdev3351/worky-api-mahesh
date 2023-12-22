const mongoose = require('mongoose')
const moment = require('moment')
const { awsContentImageUrl } = require('../constant/appConstant')

const setStatus = async (assignment) => {
    if (assignment.archive) {
        assignment.status = 'Archived'
    } else if (!assignment.assignedTo) {
        assignment.status = 'Unassigned'
    } else if (assignment.startDate && assignment.endDate && (new Date(assignment.startDate) <= new Date() && new Date(assignment.endDate) >= new Date())) {
        assignment.status = 'Active'
    } else if (assignment.endDate && (new Date() >= new Date(assignment.endDate) )) {
        assignment.status = 'Closed'
    }
    return assignment
}

module.exports = {
    find: async (search, skip, limit, sort, decodeUser, status) => {
        let list = await assignmentModel.find(search).populate('content').populate('assignedStudents', 'firstName lastName userName').populate('assignedClass', 'name').skip(skip).limit(limit).sort(sort).lean().exec();
        if (list && list.length) {
            list = await Promise.all(list.map(async (oneAssignment) => {
                // AssignmentId
                oneAssignment.assignmentId = oneAssignment._id

                // Content Detail
                await oneAssignment.content.map(async (oneContent) => {
                    // ContentId
                    oneContent.contentId = oneContent._id;

                    // ThumbnailList
                    if (oneContent.worky_id) { oneContent.thumbnail = awsContentImageUrl + oneContent.worky_id + '_1.jpg' }

                    // Like
                    if (oneContent.likes && oneContent.likes.detail && oneContent.likes.detail.length) {
                        const isObjExist = await oneContent.likes.detail.find(oneLikeObj => oneLikeObj.by.toString() === decodeUser && decodeUser.toString());
                        oneContent.likes = (isObjExist) ? { count: oneContent.likes.count, isLike: true } : { count: oneContent.likes.count, isLike: false }
                        return oneContent
                    } else { oneContent.likes = { count: 0, isLike: false } }
                })

                // Turnout
                const submittedAssignmentList = await submittedAssignmentModel.find({ assignment: oneAssignment._id, student: { $in: oneAssignment.assignedStudents.map((e) => mongoose.Types.ObjectId(e._id) ) } })
                oneAssignment.turnout = (submittedAssignmentList && submittedAssignmentList.length) ? (100 * submittedAssignmentList.length / oneAssignment.assignedStudents.length) : 0

                // Avg_Score
                await submittedAssignmentModel.aggregate([
                    {
                        "$lookup": {
                            "from": "Assignments",
                            "localField": "assignment",
                            "foreignField": "_id",
                            "as": "assignment",
                        }
                    },
                    { "$unwind": { path: '$assignment', preserveNullAndEmptyArrays: true } },
                    { "$match":  { "assignment._id": mongoose.Types.ObjectId(oneAssignment._id) } },
                    { "$set": { "oneStudentAvgScore": { "$multiply": [{ "$divide": [ { "$avg": "$contentScore.score" }, { "$multiply": [ { "$size": "$contentScore" }, "$assignment.points" ] } ] }, 100] } } }
                ]).then(async (arr) => { oneAssignment.avg_score = await arr.reduce((n, {oneStudentAvgScore}) => n + oneStudentAvgScore, 0)  })

                // Status
                await setStatus(oneAssignment)

                if (oneAssignment.assignedStudents && oneAssignment.assignedStudents.length) {
                    oneAssignment.assignedStudents.map((oneStudent) => {
                        let fullName
                        if (oneStudent.firstName) { fullName = oneStudent.firstName }
                        if (oneStudent.lastName) { fullName += ' ' + oneStudent.lastName }
                        oneStudent.fullName = fullName
                        return oneStudent
                    })
                }
                return oneAssignment
            }))
        }

        // Status
        if (status) {
            status = status.charAt(0).toUpperCase() + status.slice(1)
            list = await Promise.all(list.filter((oneAssignment) => {
                if (oneAssignment.status === status) { return oneAssignment }
            }))
        }

        return list
    },

    counts: async (query) => { return await assignmentModel.count(query) },

    findOne: async (query, decodeUser) => {
        const assignment = await assignmentModel.findOne(query).populate('content').populate('assignedStudents', 'firstName lastName userName').populate('assignedClass', 'name').lean().exec();
        if (assignment) {
            assignment.assignmentId = assignment._id;
            
            await assignment.content.map(async (oneContent) => {
                // ContentId
                oneContent.contentId = oneContent._id;

                // ThumbnailList
                if (oneContent.worky_id) { oneContent.thumbnail = awsContentImageUrl + oneContent.worky_id + '_1.jpg' }

                // Like
                if (oneContent.likes && oneContent.likes.detail && oneContent.likes.detail.length) {
                    const isObjExist = await oneContent.likes.detail.find(oneLikeObj => oneLikeObj.by.toString() === decodeUser && decodeUser.toString());
                    oneContent.likes = (isObjExist) ? { count: oneContent.likes.count, isLike: true } : { count: oneContent.likes.count, isLike: false }
                    return oneContent
                } else { oneContent.likes = { count: 0, isLike: false } }
            });

            // Turnout
            const submittedAssignmentList = await submittedAssignmentModel.find({ assignment: assignment._id, student: { $in: assignment.assignedStudents.map((e) => mongoose.Types.ObjectId(e._id) ) } })
            assignment.turnout = (submittedAssignmentList && submittedAssignmentList.length) ? (100 * submittedAssignmentList.length / assignment.assignedStudents.length) : 0

            // Avg_Score
            await submittedAssignmentModel.aggregate([
                {
                    "$lookup": {
                        "from": "Assignments",
                        "localField": "assignment",
                        "foreignField": "_id",
                        "as": "assignment",
                    }
                },
                { "$unwind": { path: '$assignment', preserveNullAndEmptyArrays: true } },
                { "$match":  { "assignment._id": mongoose.Types.ObjectId(assignment._id) } },
                { "$set": { "oneStudentAvgScore": { "$multiply": [{ "$divide": [{ "$avg": "$contentScore.score" }, { "$multiply": [ { "$size": "$contentScore" }, "$assignment.points" ] } ] }, 100] } } }
            ]).then(async (arr) => { assignment.avg_score = await arr.reduce((n, {oneStudentAvgScore}) => n + oneStudentAvgScore, 0) })

            // Status
            await setStatus(assignment)

            if (assignment.assignedStudents && assignment.assignedStudents.length) {
                assignment.assignedStudents.map((oneStudent) => {
                    let fullName
                    if (oneStudent.firstName) { fullName = oneStudent.firstName }
                    if (oneStudent.lastName) { fullName += ' ' + oneStudent.lastName }
                    oneStudent.fullName = fullName
                    return oneStudent
                })
            }
        }
        return assignment;
    },

    getByProperty: async (query, select) => {
        const assignment = await assignmentModel.find(query).populate('content').select(select).lean().exec();
        if (assignment && assignment.length) {
            await assignment.map((oneAssignment) => {
                oneAssignment.assignmentId = oneAssignment._id;
                oneAssignment.content.map(async (oneContent) => {
                    // ContentId
                    oneContent.contentId = oneContent._id;
    
                    // ThumbnailList
                    if (oneContent.worky_id) { oneContent.thumbnail = awsContentImageUrl + oneContent.worky_id + '_1.jpg' }
                });
            })
        }
        return assignment;
    },

    create: async (params) => {
        const assignment = new assignmentModel(params);
        const result = await assignment.save();
        return result;
    },

    update: async (_id, body) => {
        const result = await assignmentModel.findByIdAndUpdate(_id, body, { new: true }).exec();    
        return result;
    },

    deleted: async (_id) => {
        const result = await assignmentModel.findOneAndDelete(_id);  
        return result;
    },

    findAllDetailsByAssignmentId: async (assignmentId, decodeUser, classId, sort, skip, limit) => {
        let assignmentList = await assignmentModel.aggregate([
            { $match: { $and: [
                {
                    _id: mongoose.Types.ObjectId(assignmentId),
                    assignedClass: { $in: [mongoose.Types.ObjectId(classId)] },
                    added_by: mongoose.Types.ObjectId(decodeUser),
                }
            ] } },
            {
                $lookup: {
                    from: "Students",
                    localField: "assignedStudents",
                    foreignField: "_id",
                    as: "studentDetails",
                },
            },
            {
                $unwind: {
                    path: '$studentDetails',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'SubmittedAssignments',
                    let: {
                        assignment: "$_id",
                        student:"$studentDetails._id",
                        submittedAssignments: "$submittedAssignments"
                    },
                    pipeline: [
                        { $match: { $expr: {$and: [{$eq: ["$assignment", "$$assignment"]},{$eq: ["$student", "$$student"]} ]} }},
                        { $project : {
                            totalCorrectAnswer: { $sum:"$contentScore.currectAnswer" },
                            totalWrongAnswer: { $sum:"$contentScore.wrongAnswer" },
                            totalBlankAnswer: { $sum:"$contentScore.blankAnswer" },
                            averagePercentage: { $avg:"$contentScore.score" },
                            'contentScore.time': 1,
                            'assignmentGrade': 1,
                            dt_added: 1,
                        }},
                        {
                            $lookup: {
                                from: "AssignmentGrades",
                                let: { grade: '$assignmentGrade'},
                                pipeline: [{$match: { $expr: {$eq: ["$_id", "$$grade"]} } }, { $project : { _id: 1, title: 1, color: 1 }} ],
                                as: "assignmentGrades",
                            },
                        },
                    ],
                    as: 'submittedAssignments',
                },
            },
            {
                $project: {
                    "_id": 0,
                    "assignment": "$_id",
                    "student" : "$studentDetails._id",
                    "student_name": { $concat: ["$studentDetails.firstName", " ", "$studentDetails.lastName"] },
                    "avatar" : "$studentDetails.avatar",
                    "totalCorrectAnswer": { $arrayElemAt: ["$submittedAssignments.totalCorrectAnswer",-1]},
                    "totalWrongAnswer": { $arrayElemAt: ["$submittedAssignments.totalWrongAnswer",-1]},
                    "totalBlankAnswer": { $arrayElemAt: ["$submittedAssignments.totalBlankAnswer",-1]},
                    "averagePercentage": { $arrayElemAt: ["$submittedAssignments.averagePercentage",-1]},
                    "time": { $arrayElemAt: ["$submittedAssignments.contentScore.time",-1]},
                    "submittedDate": { $arrayElemAt: ["$submittedAssignments.dt_added",-1]},
                    "assignmentGrades": { $arrayElemAt: ["$submittedAssignments.assignmentGrades",-1]},
                },
            },
            { $sort : sort },
            { $limit : limit },
            { $skip : skip },
            {
                $group: {
                    _id: '$assignment',
                    assignmentScore: { $push: "$$ROOT" },
                }
            },
            {
                $lookup: {
                  from: "Assignments",
                  localField: "_id",
                  foreignField: "_id",
                  as: "assignmentDetails",
                },
            },
            {
                $lookup: {
                    from: "Contents",
                    localField: "assignmentDetails.content",
                    foreignField: "_id",
                    as: "assignmentItems",
                    pipeline: [{ $project : {
                        _id: 1,
                        contentId: '$_id',
                        thumbnail: { $concat: [awsContentImageUrl, '$worky_id', '_1.jpg'] },
                    }}],
                },
            },
        ])

        if (assignmentList && assignmentList.length) {
            if (assignmentList[0]?.assignmentScore?.length) {
                assignmentList[0].assignmentScore = await assignmentList[0].assignmentScore.map((oneStd) => {
                    if (oneStd) {
                        if (oneStd.time && oneStd.time.length) {
                            const totalDurations = oneStd.time.slice(1).reduce((prev, cur) => moment.duration(cur).add(prev),
                            moment.duration(oneStd.time[0]))
                            oneStd.time = moment.utc(totalDurations.asMilliseconds()).format("HH:mm:ss")
                        }
    
                        if (!oneStd.totalCorrectAnswer) { oneStd.totalCorrectAnswer = 0 }
                        if (!oneStd.totalWrongAnswer) { oneStd.totalWrongAnswer = 0 }
                        if (!oneStd.totalBlankAnswer) { oneStd.totalBlankAnswer = 0 }
                        if (!oneStd.averagePercentage) { oneStd.averagePercentage = 0 }
                        if (!oneStd.submittedDate) { oneStd.submittedDate = null }
                        if (!oneStd.time) { oneStd.time = null }
                        if (!oneStd.assignmentGrades || !oneStd.assignmentGrades.length) { oneStd.assignmentGrades = [] }
                    }
                    return oneStd
                })
            }
            if (assignmentList[0]?.assignmentDetails?.length) { assignmentList[0].assignmentDetails = assignmentList[0].assignmentDetails[0] }
        }

        return assignmentList[0]
    },

    exportAssignmentGrades: async (assignmentId) => {
        return await submittedAssignmentModel.aggregate([
            {
                $match:{ assignment: mongoose.Types.ObjectId(assignmentId) }
            },
            {
                $unwind: {
                    path: '$contentScore',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: { student: '$student', name: '$name', assignment: '$assignment' },
                    assignment: { $addToSet:"$assignment"} ,
                    totalCorrectAnswer : { $sum:"$contentScore.currectAnswer"},
                    totalWrongAnswer : { $sum:"$contentScore.wrongAnswer"},
                    totalBlankAnswer : { $sum:"$contentScore.blankAnswer"},
                    averagePercentage: { $avg: "$contentScore.score"},
                    assignmentGrade: { $addToSet:"$assignmentGrade"} ,
                }
            },
            {
                $lookup: {
                  from: "Students",
                  localField: "_id.student",
                  foreignField: "_id",
                  as: "studentDetails",
                },
            },
            {
                $unwind: {
                    path: '$studentDetails',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    "_id":0,
                    "student" : "$studentDetails._id",
                    "student_name": { $concat: ["$studentDetails.firstName", " ", "$studentDetails.lastName"] },
                    "averagePercentage": 1,
                    "assignment":1,
                    "assignmentGrade":1
                }
            },
            {
                $unwind: {
                    path: '$assignment',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                  from: "AssignmentGrades",
                  localField: "assignmentGrade",
                  foreignField: "_id",
                  as: "AssignmentGrades",
                },
            },
            {
                $lookup: {
                  from: "Assignments",
                  localField: "assignment",
                  foreignField: "_id",
                  as: "assignmentDetails",
                },
            },
            {
                $unwind: {
                    path: '$assignmentDetails',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: '$AssignmentGrades',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    "_id":0,
                    "studentName": "$student_name",
                    "assignmentName": "$assignmentDetails.title",
                    "assignmentType": "$assignmentDetails.assignmentType",
                    "percentage" : "$averagePercentage",
                    "assignmentGrade" : "$AssignmentGrades.title"
                }
            },
        ]);
    }
}