const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const NotificationSchema = new Schema({
    student: {
        type: ObjectId,
        ref: 'Student',
        required: true
    },
    assignment: {
        type: ObjectId,
        ref: 'Assignment',
        required: true
    },
    submittedAssignment: {
        type: ObjectId,
        ref: 'SubmittedAssignment',
        required: true
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

const NotificationModel = mongoose.model('Notification', NotificationSchema, 'Notifications');
module.exports = NotificationModel;
