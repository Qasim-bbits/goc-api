const mongoose = require('mongoose');

const Users = mongoose.model(
    'Users',
    new mongoose.Schema({
        fname : {
            type : String,
            required : false,
            minlength : 0
        },
        lname : {
            type : String,
            required : false,
            minlength : 0
        },
        address : {
            type : String,
            required : false,
            minlength : 0
        },
        mobile_no : {
            type : String,
            required : false,
            minlength : 0
        },
        email : {
            type : String,
            required : false,
            minlength : 0
        },
        password : {
            type : String,
            required : false,
            minlength : 0
        },
        language : {
            type : String,
            required : false,
            minlength : 0
        },
        role : {
            type : String,
            required : false,
            minlength : 0
        },
        email_verified : {
            type : Boolean,
            required : false,
            minlength : 0
        },
        token : {
            type : String,
            required : false,
            minlength : 0
        },
        forget_password : {
            type : Boolean,
            required : false,
            minlength : 0
        }
    },
    { timestamps: { created_at: 'created_at' } }
    )
)
exports.Users = Users;