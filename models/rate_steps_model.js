const mongoose = require('mongoose');

const RateSteps = mongoose.model(
    'RateSteps',
    new mongoose.Schema({
        rate : {
            type : Number,
            required : false,
            minlength : 0
        },
        time : {
            type : Number,
            required : false,
            minlength : 0
        },
        order : {
            type : Number,
            required : false,
            minlength : 0
        },
        rate_type_id : {
            type : String,
            required : false,
            minlength : 0
        },
    })
)
exports.RateSteps = RateSteps;