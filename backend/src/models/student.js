const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const { USER } = require('../constant/appConstant')

const StudentSchema = new Schema({
    userName: {
        type: String,
        required: true,
    },
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    nickName: {
        type: String,
    },
    parentEmail: {
        type: String,
    },
    classroom: {
        type: ObjectId,
        ref: 'Classroom',
        required: true
    },
    password: {
        type: String,
    },
    type: {
        type: Number,
        default: USER.TYPE.STUDENT
    },
    dt_added: {
        type: Date,
        default: new Date()
    },
    dt_upd: {
        type: Date,
    },
    teacher: {
        type: ObjectId,
        ref: 'User',
        required: true
    },
    avatar: {
        type: String,
    },
}, { versionKey: false });

const StudentModel = mongoose.model('Student', StudentSchema, 'Students');
module.exports = StudentModel;
