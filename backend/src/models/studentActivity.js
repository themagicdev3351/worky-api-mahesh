const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const StudentActivitySchema = new Schema({
    student: {
        type: ObjectId,
        ref: 'Student',
        required: true
    },
    content: {
        type: ObjectId,
        ref: 'Content',
        required: true
    },
    activities: {
        type: Number,
        default: 0,
        required: true
    },
    timePlayed: {
        type: String,
        required: true
    },
    added_by: {
        type: ObjectId,
        ref: 'User',
        required: true
    },
    dt_added: {
        type: Date,
        default: new Date()
    },
    dt_upd: {
        type: Date,
    },
}, { versionKey: false });

const StudentActivityModel = mongoose.model('StudentActivity', StudentActivitySchema, 'StudentActivities');
module.exports = StudentActivityModel;
