module.exports = {
    find: async (search, skip, limit, sort) => {
        let list = await studentModel.find(search).populate('classroom', 'name').populate('teacher', 'firstName lastName').skip(skip).limit(limit).sort(sort).lean().exec();
        if (list && list.length) { list = await Promise.all(list.map((oneStudent) => {
            if (oneStudent) {
                let fullName
                if (oneStudent.firstName) { fullName = oneStudent.firstName }
                if (oneStudent.lastName) { fullName += ' ' + oneStudent.lastName }
                oneStudent.fullName = fullName
            }
            return oneStudent;
        })) }
        return list
    },

    counts: async (query) => { return await studentModel.count(query) },

    findOne: async (query) => {
        const result = await studentModel.findOne(query).populate('classroom', 'name').populate('teacher', 'firstName lastName').lean().exec();
        if (result) { 
            let fullName
            if (result.firstName) { fullName = result.firstName }
            if (result.lastName) { fullName += ' ' + result.lastName }
            result.fullName = fullName
        }
        return result;
    },

    optionList: async (query, select) => {
        let result = await studentModel.find(query).select(select).sort({ 'dt_added': -1 });
        return result
    },

    create: async (params) => {
        const student = new studentModel(params);
        const result = await student.save();
        return result;
    },

    update: async (_id, body) => {
        const result = await studentModel.findByIdAndUpdate(_id, body, { new: true }).exec();
        return result;
    },

    deleted: async (_id) => {
        const result = await studentModel.findOneAndDelete(_id);  
        return result;
    }
}