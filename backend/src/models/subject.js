const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const subjectSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    image: {
        type: String
    },
    grade: {
        type: ObjectId,
        ref: 'Grade',
        required: true
    },
    topics: [{
        title: {
            type: String,
            unique: true,
        },
        topics: [{
            title: {
                type: String,
            },
            topics: [{
                type: Object,
            }],
        }],
    }],
    dt_added: {
        type: Date,
        default: new Date()
    },
    dt_upd: {
        type: Date,
    },
}, { versionKey: false });

const subjectModel = mongoose.model('Subject', subjectSchema, 'Subjects');
module.exports = subjectModel;
