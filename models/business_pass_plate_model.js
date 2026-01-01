const mongoose = require('mongoose');

const BusinessPassPlates = mongoose.model(
    'BusinessPassPlates',
    new mongoose.Schema({
        name : {
            type : String,
            required : false,
            minlength : 0
        },
        notes : {
            type : String,
            required : false,
            minlength : 0
        },
        plate : {
            type : String,
            required : false,
            minlength : 0
        },
        zone : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Zones',
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
exports.BusinessPassPlates = BusinessPassPlates;