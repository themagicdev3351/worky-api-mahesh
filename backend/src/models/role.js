const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PermissionSchema = new Schema({
    module: {
        type: String,
        required: true,
    },
    create: {
        type: Boolean,
        default: false
    },
    edit: {
        type: Boolean,
        default: false
    },
    delete: {
        type: Boolean,
        default: false
    },
    list: {
        type: Boolean,
        default: false
    }
});


const RoleSchema = new Schema({
    name: {
        type: String,
        required: true,
        default: ''
    },
    type: {
        type: Number,
        required: true,
    },
    permissions: {
        type: [PermissionSchema],
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

// const Permission = mongoose.model('Permission', PermissionSchema, 'Permissions');
const Role = mongoose.model('Role', RoleSchema, 'Roles');
// module.exports = { Role, Permission, PermissionSchema };
module.exports = Role;