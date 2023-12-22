const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const AssignmentSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: [{
            type: ObjectId,
            ref: 'Content',
            required: true
        }],
    },
    assignmentType: {
        type: String,
        // required: true
    },
    startDate: {
        type: Date,
        // required: true
    },
    endDate: {
        type: Date,
        // required: true
    },
    points: {
        type: Number,
        // required: true
    },
    assignedTo: {
        type: String,
        enum: ['Student', 'Classroom'],
        // default: 'Student',
        // required: true,
    },
    assignedStudents: {
        type: [{
            type: ObjectId,
            ref: 'Student'
        }]
    },
    assignedClass: {
        type: [{
            type: ObjectId,
            ref: 'Classroom',
            // required: true
        }]
    },
    archive: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
    },
    dt_added: {
        type: Date,
        default: new Date()
    },
    dt_upd: {
        type: Date,
    },
    added_by: {
        type: ObjectId,
        ref: 'User',
        required: true
    },
}, { versionKey: false });

const AssignmentModel = mongoose.model('Assignment', AssignmentSchema, 'Assignments');
module.exports = AssignmentModel;
