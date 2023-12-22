const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const ClassroomSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    grade: {
        type: ObjectId,
        ref: 'Grade',
        required: true
    },
    added_by: {
        type: ObjectId,
        ref: 'User',
        required: true
    },
    // assignment: {
    //     type: ObjectId,
    //     ref: 'Assignment',
    //     required: true
    // },
    dt_added: {
        type: Date,
        default: new Date()
    },
    dt_upd: {
        type: Date,
    },
}, { versionKey: false });

const ClassroomModel = mongoose.model('Classroom', ClassroomSchema, 'Classrooms');
module.exports = ClassroomModel;
