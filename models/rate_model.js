const mongoose = require('mongoose');

const Rates = mongoose.model(
    'Rates',
    new mongoose.Schema({
        rate_name : {
            type : String,
            required : false,
            minlength : 0
        },
        zone_id : {
            type : String,
            required : false,
            minlength : 0
        },
        rate_type : {
            type : Number,
            required : false,
            minlength : 0
        },
        is_visitor_pass: {
            type : Boolean,
            default : false,
        },
        enable_custom_rate: {
            type : Boolean,
            default : false,
        },
        qr_code : {
            type : Boolean,
            required : false,
            minlength : 0
        },
        is_whitelist: {
            type : Boolean,
            default : false,
        },
    })
)
exports.Rates = Rates;