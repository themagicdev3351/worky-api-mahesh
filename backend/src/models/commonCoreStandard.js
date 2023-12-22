const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const CommonCoreStandardSchema = new Schema({
    id: {
        type: String,
        unique: true,
    },
    title: {
        type: String,
        required: true
    },
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
            list: [{
                title: {
                    type: String,
                    default: ""
                },
                description: {
                    type: String,
                    default: ""
                },
            }]
        }],
    },
    tree: [{
        id: {
            type: String,
            unique: true,
        },
        title: {
            type: String,
            unique: true,
        },
        topics: [{
            type: Object,
        }],
    }],
    image: {
        type: String,
    },
    dt_added: {
        type: Date,
        default: new Date()
    },
    dt_upd: {
        type: Date,
    },
}, { versionKey: false });

const CommonCoreStandardModel = mongoose.model('CommonCoreStandard', CommonCoreStandardSchema, 'CommonCoreStandards');
module.exports = CommonCoreStandardModel;
