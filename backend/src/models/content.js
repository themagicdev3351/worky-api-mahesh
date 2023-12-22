const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const ContentSchema = new Schema({
    worky_id: {
        type: String,
        required: true
    },
    type: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    slug: {
        type: String
    },
    descrpt: {
        type: String,
    },
    keyw: {
        type: [String]
    },
    ver: {
        type: Number,
        default: 1
    },
    pages: {
        type: Number
    },
    target_grade: {
        type: Number
    },
    grades: [{
        type: ObjectId,
        ref: 'Grade',
        required: true
    }],
    status: {
        type: Number
    },
    stds: [{
        type: ObjectId,
        ref: 'CommonCoreStandard',
        required: true
    }],
    stds_topic: [{
        type: String,
        ref: 'CommonCoreStandard'
    }],
    pub: {
        type: String,
    },
    illust: {
        type: String,
    },
    author: {
        type: String,
    },
    premium: {
        type: Number
    },
    dt_added: {
        type: Date,
        default: new Date()
    },
    dt_upd: {
        type: Date,
    },
    printable: {
        type: Boolean,
        default: true
    },
    territories: {
        type: [String],
    },
    bw_available: {
        type: Boolean,
        default: true
    },
    student_view: {
        type: Boolean,
        default: true
    },
    subject: [{
        type: ObjectId,
        ref: 'Subject',
        required: true
    }],
    topic: [{
        type: String,
        ref: 'Subject',
    }],
    lexile: {
        type: [String],
    },
    act_type: {
        type: String,
    },
    pub_draft: {
        type: Object,
    },
    pub_test: {
        type: Object,
    },
    pub_prod: {
        type: Object,
    },
    thumbnail: {
        type: String,
    },
    likes: {
        count: {
            type: Number,
            default: 0
        },
        isLike: {
            type: Boolean,
            default: true
        },
        detail: [{
            by: {
                type: ObjectId,
                ref: 'User',
            },
            isLike: {
                type: Boolean,
                default: false
            },
        }],
    },
}, { versionKey: false });

const ContentModel = mongoose.model('Content', ContentSchema, 'Contents');
module.exports = ContentModel;
