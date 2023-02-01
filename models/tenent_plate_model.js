const mongoose = require('mongoose');

const TenentPlates = mongoose.model(
    'TenentPlates',
    new mongoose.Schema({
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
exports.TenentPlates = TenentPlates;