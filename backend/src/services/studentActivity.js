module.exports = {
    create: async (params) => {
        const studentActivity = new studentActivityModel(params);
        const result = await studentActivity.save();
        return result; 
    },

    findOne: async (query) => {
        const studentActivity = await studentActivityModel.findOne(query).populate('student').populate('added_by', 'firstName lastName').populate('content').lean().exec();
        if (studentActivity) { studentActivity.studentActivityId = studentActivity._id }
        return studentActivity;
    },

    update: async (_id, body) => {
        const result = await studentActivityModel.findByIdAndUpdate(_id, body, { new: true }).exec();
        return result;
    },
}