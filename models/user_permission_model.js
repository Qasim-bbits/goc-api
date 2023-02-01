const mongoose = require('mongoose');

const User_Permissions = mongoose.model(
    'User_Permissions',
    new mongoose.Schema({
        module : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Modules',
            required : false,
            minlength : 0
        },
        org : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organizations',
            required : false,
            minlength : 0
        },
        user : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required : false,
            minlength : 0
        },
        can_add : {
            type : Boolean,
            required : false,
            minlength : 0
        },
        can_edit : {
            type : Boolean,
            required : false,
            minlength : 0
        },
        can_delete : {
            type : Boolean,
            required : false,
            minlength : 0
        },
        can_view : {
            type : Boolean,
            required : false,
            minlength : 0
        }
    })
)
exports.User_Permissions = User_Permissions;