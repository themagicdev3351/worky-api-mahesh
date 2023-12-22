const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const projectConfigSchema = new Schema({
    projectName: {
        type: String,
        default: ''
    },
    projectDefaultMail: {
        type: String,
        default: ''
    },
    serverUrl: {
        type: String,
        default: ''
    }, //used emailService
    clientUrl: {
        type: String,
        default: ''
    }, //used emailService
    verifyEmailExpiryTime: {
        type: Number,
        default: 10
    }, //used userService
    dt_added: {
        type: Date,
        default: new Date()
    },
    dt_upd: {
        type: Date,
    },
}, { versionKey: false });


const ProjectConfig = mongoose.model('ProjectConfig', projectConfigSchema, 'ProjectConfig');
module.exports = ProjectConfig;