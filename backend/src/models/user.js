const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { USER } = require('../constant/appConstant')

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    verification: {
        token: {
            type: String,
            default: ''
        },
        expireTime: {
            type: Date,
            default: null
        },
        isVerified: {
            type: Boolean,
            default: false
        }
    },
    salutation: {
        type: String,
        default: ""
    },
    firstName: {
        type: String,
        default: ""
    },
    lastName: {
        type: String,
        default: ""
    },
    schoolName: {
        type: String,
        default: ""
    },
    state: {
        type: String,
        default: ""
    },
    city: {
        type: String,
        default: ""
    },
    avatar: {
        type: String,
        default: ""
    },
    password: {
        type: String,
        required: true
    },
    googleAuthId: {
        type: String,
    },
    registerType: {
        type: String,
    },
    type: {
        type: Number,
        enum: [USER.TYPE.TEACHER,USER.TYPE.GOOGLE],
        default: USER.TYPE.TEACHER
    },
    dt_added: {
        type: Date,
        default: new Date()
    },
    dt_upd: {
        type: Date,
    },
}, { versionKey: false });

const UserModel = mongoose.model('User', UserSchema, 'Users');
module.exports = UserModel;
