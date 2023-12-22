const mongoose = require("mongoose");

module.exports = {
    find: async (search, skip, limit, sort) => {
        let list = await classroomModel.find(search).populate('grade', 'title').populate('added_by', 'firstName lastName').skip(skip).limit(limit).sort(sort).lean().exec();
        if (list && list.length) { list = await Promise.all(list.map((e) => {
            e.classId = e._id;
            e.classGrade = e.name + ((e.grade) ? e.grade.title: null)
            return e;
        })) }
        return list
    },

    counts: async (query) => { return await classroomModel.count(query) },

    findOne: async (query) => {
        const classroom = await classroomModel.findOne(query).populate('grade', 'title').populate('added_by', 'firstName lastName').lean().exec();
        if (classroom) { classroom.classId = classroom._id, classroom.classGrade = classroom.name + ((classroom.grade) ? classroom.grade.title: null) }
        return classroom;
    },

    optionList: async (query, select) => {
        let result = await classroomModel.find(query).select(select).sort({ 'dt_added': -1 });
        return result
    },

    create: async (params) => {
        const classroom = new classroomModel(params);
        const result = await classroom.save();
        return result;
    },

    createImportedList: async (params, decodeUser) => {
        let classroomList = []
        const dataArr = params.map(item=>{ return [JSON.stringify(item),item] })
        const maparr = new Map(dataArr)
        let result = [...maparr.values()]
        result = await Promise.all(result.map(async(oneClass) => {
            let body = { name: oneClass.class, grade: null, added_by: mongoose.Types.ObjectId(decodeUser) }
            const isExistGrade = await gradeModel.findOne({title: oneClass.grade}).select('title').lean().exec()
            if (isExistGrade?._id) {
                body.grade = mongoose.Types.ObjectId(isExistGrade._id)
                const classroom = await classroomModel.findOne(body).lean().exec()
                if (!classroom) { const classroom = new classroomModel(body); classroomList.push(await classroom.save()) }
            } else {
                const grade = new gradeModel({ title: oneClass.grade });
                const result = await grade.save();
                body.grade = result._id
                const classroom = new classroomModel(body)
                classroomList.push(await classroom.save())
            }
            return classroomList
        }))

        return classroomList
    },

    update: async (_id, body) => {
        const result = await classroomModel.findByIdAndUpdate(_id, body, { new: true }).exec();    
        return result;
    },

    deleted: async (_id) => {
        const result = await classroomModel.findOneAndDelete(_id);  
        return result;
    }
}