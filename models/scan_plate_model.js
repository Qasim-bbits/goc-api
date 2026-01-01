const mongoose = require('mongoose');

const ScanPlate = mongoose.model(
    'ScanPlate',
    new mongoose.Schema({
        session_token : {
            type : String,
            required : false,
            minlength : 0
        },
        plate : {
            type : String,
            required : false,
            minlength : 0
        },
        org : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organizations',
            required : false,
            minlength : 0
        },
        user : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required : false,
            minlength : 0
        },
    },
    { timestamps: { created_at: 'created_at' } })
)
exports.ScanPlate = ScanPlate;