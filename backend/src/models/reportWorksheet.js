const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const ReportWorksheetSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    content: {
        type: ObjectId,
        ref: 'Content',
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

const ReportWorksheetModel = mongoose.model('ReportWorksheet', ReportWorksheetSchema, 'ReportWorksheets');
module.exports = ReportWorksheetModel;
