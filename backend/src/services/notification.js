module.exports = {
    find: async (search, skip, limit, sort) => {
        const list = await notificationModel.aggregate([
            { $match: search },
            {
                "$lookup": {
                    "from": "Students",
                    "localField": "student",
                    "foreignField": "_id",
                    "as": "student",
                    "pipeline" : [{ "$project" : { "_id": 1, fullName: { $concat: ["$firstName", " ", "$lastName"] }, } }],
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
                    "from": "SubmittedAssignments",
                    "localField": "submittedAssignment",
                    "foreignField": "_id",
                    "as": "submittedAssignment",
                    "pipeline" : [{ "$project" : { "_id": 1, "name": 1, "submitedDate": '$dt_added' } }],
                }
            },
            {
                "$lookup": {
                    "from": "Users",
                    "localField": "added_by",
                    "foreignField": "_id",
                    "as": "added_by",
                    "pipeline" : [{ "$project" : { "_id": 1, fullName: { $concat: ["$firstName", " ", "$lastName"] }, } }],
                }
            },
            {
                $project: {
                    "_id": 1,
                    "dt_added": 1,
                    "dt_updated": 1,
                    "notificationId": "$_id",
                    "student": { $arrayElemAt: ["$student",-1]},
                    "assignment": { $arrayElemAt: ["$assignment",-1]},
                    "submittedAssignment": { $arrayElemAt: ["$submittedAssignment",-1]},
                    "added_by": { $arrayElemAt: ["$added_by",-1]},
                },
            },
            { $skip : skip },
            { $limit : limit },
            { $sort : sort },
        ])
        return list
    },

    counts: async (query) => { return await notificationModel.count(query) },

    findOne: async (query) => {
        const result = await notificationModel.aggregate([
            { $match: query },
            {
                "$lookup": {
                    "from": "Students",
                    "localField": "student",
                    "foreignField": "_id",
                    "as": "student",
                    "pipeline" : [{ "$project" : { "_id": 1, fullName: { $concat: ["$firstName", " ", "$lastName"] }, } }],
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
                    "from": "SubmittedAssignments",
                    "localField": "submittedAssignment",
                    "foreignField": "_id",
                    "as": "submittedAssignment",
                    "pipeline" : [{ "$project" : { "_id": 1, "name": 1, "submitedDate": '$dt_added' } }],
                }
            },
            {
                "$lookup": {
                    "from": "Users",
                    "localField": "added_by",
                    "foreignField": "_id",
                    "as": "added_by",
                    "pipeline" : [{ "$project" : { "_id": 1, fullName: { $concat: ["$firstName", " ", "$lastName"] }, } }],
                }
            },
            {
                $project: {
                    "_id": 1,
                    "dt_added": 1,
                    "dt_updated": 1,
                    "notificationId": "$_id",
                    "student": { $arrayElemAt: ["$student",-1]},
                    "assignment": { $arrayElemAt: ["$assignment",-1]},
                    "submittedAssignment": { $arrayElemAt: ["$submittedAssignment",-1]},
                    "added_by": { $arrayElemAt: ["$added_by",-1]},
                },
            },
        ])
        return result[0]
    },

    create: async (params) => {
        const notification = new notificationModel(params);
        const result = await notification.save();
        return result;
    },

    update: async (_id, body) => {
        const result = await notificationModel.findByIdAndUpdate(_id, body, { new: true }).exec();    
        return result;
    },

    deleted: async (_id) => {
        const result = await notificationModel.findOneAndDelete(_id);  
        return result;
    }
}