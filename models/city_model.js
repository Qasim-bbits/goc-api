const mongoose = require('mongoose');

const Cities = mongoose.model(
    'Cities',
    new mongoose.Schema({
        city_name : {
            type : String,
            required : false,
            minlength : 0
        },
        polygon : {
            type : Array,
            required : false,
            minlength : 0
        },
        org : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organizations',
            required : false,
            minlength : 0
        },
    })
)
exports.Cities = Cities;