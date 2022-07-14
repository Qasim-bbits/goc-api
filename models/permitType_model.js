const mongoose = require('mongoose');

const PermitType = mongoose.model(
    'PermitType',
    new mongoose.Schema({
        name : {
            type : String,
            required : false,
            minlength : 0
        },
        type : {
            type : String,
            required : false,
            minlength : 0
        },
        days : {
            type : Number,
            required : false,
            minlength : 0
        },
        months : {
            type : Number,
            required : false,
            minlength : 0
        },
    })
)
exports.PermitType = PermitType;