const mongoose = require('mongoose');

const ExternalParkingConfig = mongoose.model(
    'ExternalParkingConfig',
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
            minlength : 0,
        },
        blinkay_ins_id : {
            type : Number,
            required : false,
            minlength : 0
        },
        blinkay_group_id : {
            type : Number,
            required : false,
            minlength : 0
        },
        blinkay_tariff_id : {
            type : Number,
            required : false,
            minlength : 0
        },
    })
)
exports.ExternalParkingConfig = ExternalParkingConfig;