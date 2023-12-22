module.exports = {
    find: async (search, skip, limit, sort) => {
        let list = await assignmentGradeModel.find(search).skip(skip).limit(limit).sort(sort).lean().exec();
        if (list && list.length) { list = await Promise.all(list.map((e) => { e.assignmentGradeId = e._id; return e; })) }
        return list
    },

    counts: async (query) => { return await assignmentGradeModel.count(query) },

    findOne: async (query) => {
        const result = await assignmentGradeModel.findOne(query).lean().exec();
        if (result) { result.assignmentGradeId = result._id }
        return result;
    },

    create: async (params) => {
        const assignmentGrade = new assignmentGradeModel(params);
        const result = await assignmentGrade.save();
        return result;
    },

    update: async (_id, body) => {
        const result = await assignmentGradeModel.findByIdAndUpdate(_id, body, { new: true }).exec();    
        return result;
    },

    deleted: async (_id) => {
        const result = await assignmentGradeModel.findOneAndDelete(_id);  
        return result;
    }
}