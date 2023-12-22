const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const SubmittedAssignmentSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    student: {
        type: ObjectId,
        ref: 'Student',
        required: true
    },
    score: {
        type: Number,
        default: 0
    },
    assignmentGrade: {
        type: ObjectId,
        ref: 'AssignmentGrade',
        // required: true
    },
    assignment: {
        type: ObjectId,
        ref: 'Assignment',
        required: true
    },
    contentScore: [{
        content: {
            type: ObjectId,
            ref: 'Content',
        },
        time: {
            type: Date,
        },
        currectAnswer: {
            type: Number,
            default: 0
        },
        wrongAnswer: {
            type: Number,
            default: 0
        },
        blankAnswer: {
            type: Number,
            default: 0
        },
        grade: {
            type: String,
        },
        score: {
            type: Number,
            default: 0
        }
    }],
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

const SubmittedAssignmentModel = mongoose.model('SubmittedAssignment', SubmittedAssignmentSchema, 'SubmittedAssignments');
module.exports = SubmittedAssignmentModel;
