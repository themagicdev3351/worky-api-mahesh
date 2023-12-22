const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const CollectionSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    favorite: {
        type: Boolean,
        default: false
    },
    content: {
        type: [{
            type: ObjectId,
            ref: 'Content',
            required: false
        }],
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

const CollectionModel = mongoose.model('Collection', CollectionSchema, 'Collections');
module.exports = CollectionModel;
