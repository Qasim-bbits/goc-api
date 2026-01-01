const mongoose = require('mongoose');

const PlateParkingLimits = mongoose.model(
    'PlateParkingLimits',
    new mongoose.Schema({
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
        no_of_parking_per_plate : {
            type : Number,
            default: 0
        },
    })
)
exports.PlateParkingLimits = PlateParkingLimits;