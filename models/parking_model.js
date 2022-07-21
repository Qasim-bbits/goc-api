const mongoose = require('mongoose');

const Parkings = mongoose.model(
    'Parkings',
    new mongoose.Schema({
        amount : {
            type : String,
            required : false,
            minlength : 0
        },
        service_fee : {
            type : String,
            required : false,
            minlength : 0
        },
        parking_id : {
            type : Number,
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
        rate : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Rates',
            required : false,
            minlength : 0
        },
        coord : {
            type : Object,
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
            type : Date,
            required : false,
            minlength : 0
        },
        to : {
            type : Date,
            required : false,
            minlength : 0
        }
    })
)
exports.Parkings = Parkings;