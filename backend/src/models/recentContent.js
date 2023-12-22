const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const RecentContentSchema = new Schema({
    url: {
        by: {
            type: ObjectId,
            ref: 'User',
        },
        contentList: [{
            createdAt: {
                type: Date,
                default: new Date()
            },
            content: {
                type: ObjectId,
                ref: 'Content',
                required: true,
            },
        }],
    },
    dt_added: {
        type: Date,
        default: new Date()
    },
}, { versionKey: false });

const RecentContentModel = mongoose.model('RecentContent', RecentContentSchema, 'RecentContents');
module.exports = RecentContentModel;
