const mongoose = require('mongoose');

const Organizations = mongoose.model(
    'Organizations',
    new mongoose.Schema({
        name : {
            type : String,
            required : false,
            minlength : 0
        },
        email : {
            type : String,
            required : false,
            minlength : 0
        },
        address : {
            type : String,
            required : false,
            minlength : 0
        },
        ph_no : {
            type : String,
            required : false,
            minlength : 0
        },
        website : {
            type : String,
            required : false,
            minlength : 0
        },
        tax_info : {
            type : String,
            required : false,
            minlength : 0
        },
        stripe_publishable_key : {
            type : String,
            required : false,
            minlength : 0
        },
        stripe_secret_key : {
            type : String,
            required : false,
            minlength : 0
        },
        header_logo : {
            type : String,
            required : false,
            minlength : 0
        },
        footer_logo : {
            type : String,
            required : false,
            minlength : 0
        },
        receipt_logo : {
            type : String,
            required : false,
            minlength : 0
        },
        url : {
            type : String,
            required : false,
            minlength : 0
        },

    })
)
exports.Organizations = Organizations;