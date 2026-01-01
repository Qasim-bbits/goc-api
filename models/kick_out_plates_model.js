const mongoose = require('mongoose');

const KickOutPlates = mongoose.model(
    'KickOutPlates',
    new mongoose.Schema({
        org : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organizations',
            required : false,
            minlength : 0
        },
        city : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Cities',
            required : false,
            minlength : 0
        },
        zone : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Zones',
            required : false,
            minlength : 0
        },
        parking : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Parkings',
            required : false,
            minlength : 0
        },
        kicked_out_plate : {
            type : String,
            required : false,
            minlength : 0
        },
        kicked_out_By : {
            type : String,
            required : false,
            minlength : 0
        },
    },
    { timestamps: { created_at: 'created_at' } })
)
exports.KickOutPlates = KickOutPlates;