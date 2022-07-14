const mongoose = require('mongoose');

const TaxRate = mongoose.model(
    'TaxRate',
    new mongoose.Schema({
        name : {
            type : String,
            required : false,
            minlength : 0
        },
        rate : {
            type : Number,
            required : false,
            minlength : 0
        },
        valid_from : {
            type : Date,
            required : false,
            minlength : 0
        },
        valid_to : {
            type : Date,
            required : false,
            minlength : 0
        },
    })
)
exports.TaxRate = TaxRate;