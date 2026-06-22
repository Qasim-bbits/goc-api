const mongoose = require('mongoose');

const BlackListedPlates = mongoose.model(
    'BlackListedPlates',
    new mongoose.Schema({
        org : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organizations',
            required : false,
            minlength : 0
        },
        zone : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Zones',
            required : false,
            minlength : 0
        },
        plate : {
            type : String,
            required : false,
            minlength : 0
        },
        blacklist_scope : {
            type : String,
            required : false,
        },
        message : {
            type : String,
            required : false,
        }
    })
)
exports.BlackListedPlates = BlackListedPlates;