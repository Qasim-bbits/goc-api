const mongoose = require('mongoose');

const RateTypes = mongoose.model(
    'RateTypes',
    new mongoose.Schema({
        rate_type_name : {
            type : String,
            required : false,
            minlength : 0
        },
        start_time : {
            type : String,
            required : false,
            minlength : 0
        },
        end_time : {
            type : String,
            required : false,
            minlength : 0
        },
        rate_id : {
            type : String,
            required : false,
            minlength : 0
        },
        service_fee : {
            type : Number,
            required : false,
            minlength : 0
        },
        Monday : {
            type : Boolean,
            required : false,
            minlength : 0
        },
        Tuesday : {
            type : Boolean,
            required : false,
            minlength : 0
        },
        Wednesday : {
            type : Boolean,
            required : false,
            minlength : 0
        },
        Thursday : {
            type : Boolean,
            required : false,
            minlength : 0
        },
        Friday : {
            type : Boolean,
            required : false,
            minlength : 0
        },
        Saturday : {
            type : Boolean,
            required : false,
            minlength : 0
        }
    })
)
exports.RateTypes = RateTypes;