const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const TopicSchema = new Schema({
    subject: {
        type: ObjectId,
        ref: 'Subject',
        required: true
    },
    grade: {
        type: ObjectId,
        ref: 'Grade',
        required: true
    },
    topics: {
        type: [{
            header: {
                type: String,
                default: ""
            },
            list: {
                type: [String],
                default: []
            }
        }],
    },
    dt_added: {
        type: Date,
        default: new Date()
    },
    dt_upd: {
        type: Date,
    },
}, { versionKey: false });

const TopicModel = mongoose.model('Topic', TopicSchema, 'Topics');
module.exports = TopicModel;
