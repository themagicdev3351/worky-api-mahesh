module.exports = {
    find: async (search, skip, limit, sort) => {
        let list = await gradeModel.find(search).skip(skip).limit(limit).sort(sort).lean().exec();
        if (list && list.length) { list = await Promise.all(list.map((e) => { e.gradeId = e._id; return e; })) }
        return list
    },

    counts: async (query) => { return await gradeModel.count(query) },

    findOne: async (query) => {
        const result = await gradeModel.findOne(query).lean().exec();
        if (result) { result.gradeId = result._id }
        return result;
    },

    create: async (params) => {
        const grade = new gradeModel(params);
        const result = await grade.save();
        return result;
    },

    update: async (_id, body) => {
        const result = await gradeModel.findByIdAndUpdate(_id, body, { new: true }).exec();    
        return result;
    },

    deleted: async (_id) => {
        const result = await gradeModel.findOneAndDelete(_id);  
        return result;
    }
}