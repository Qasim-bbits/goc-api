const mongoose = require('mongoose');

const Parkings = mongoose.model(
    'Parkings',
    new mongoose.Schema({
        amount : {
            type : String,
            required : false,
            minlength : 0
        },
        city : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Cities',
            required : false,
            minlength : 0
        },
        user : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required : false,
            minlength : 0
        },
        zone : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Zones',
            required : false,
            minlength : 0
        },
        paymentMethod : {
            type : String,
            required : false,
            minlength : 0
        },
        plate : {
            type : String,
            required : false,
            minlength : 0
        },
        from : {
            type : String,
            required : false,
            minlength : 0
        },
        to : {
            type : String,
            required : false,
            minlength : 0
        }
    })
)
exports.Parkings = Parkings;