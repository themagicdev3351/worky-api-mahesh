const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const setupConfigSchema = new Schema({
    mailAuthUser: {
        type: 'string',
        default: ''
    },
    mailAuthPass: {
        type: 'string',
        default: ''
    },
    s3ProjectThumbnailBucket: {
        type: 'string',
        default: ''
    },
    s3BaseUrl: {
        type: 'string',
        default: ''
    },
    s3AccessKey: {
        type: 'string',
        default: ''
    },
    s3SecretKey: {
        type: 'string',
        default: ''
    },
    dt_added: {
        type: Date,
        default: new Date()
    },
    dt_upd: {
        type: Date,
    },
}, { versionKey: false });

const SetupConfig = mongoose.model('SetupConfig', setupConfigSchema, 'SetupConfig');
module.exports = SetupConfig;