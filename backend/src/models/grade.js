const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GradeSchema = new Schema({
    title: {
        type: String,
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

const GradeModel = mongoose.model('Grade', GradeSchema, 'Grades');
module.exports = GradeModel;
