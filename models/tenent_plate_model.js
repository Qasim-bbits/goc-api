const mongoose = require('mongoose');

const TenentPlates = mongoose.model(
    'TenentPlates',
    new mongoose.Schema({
        plate : {
            type : String,
            required : false,
            minlength : 0
        },
        car_make : {
            type : String,
            required : false,
            minlength : 0
        },
        model : {
            type : String,
            required : false,
            minlength : 0
        },
        color : {
            type : String,
            required : false,
            minlength : 0
        },
        plate_two : {
            type : String,
            required : false,
            minlength : 0
        },
        car_make_two : {
            type : String,
            required : false,
            minlength : 0
        },
        model_two : {
            type : String,
            required : false,
            minlength : 0
        },
        color_two : {
            type : String,
            required : false,
            minlength : 0
        },
        plate_three : {
            type : String,
            required : false,
            minlength : 0
        },
        car_make_three : {
            type : String,
            required : false,
            minlength : 0
        },
        model_three : {
            type : String,
            required : false,
            minlength : 0
        },
        color_three : {
            type : String,
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
        org : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organizations',
            required : false,
            minlength : 0
        },
        park_now : {
            type : Boolean,
            default : false,
        },
        rate : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Rates',
            required : false,
            minlength : 0
        },
        parking : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Parkings',
            required : false,
            minlength : 0
        },
        email : {
            type : String,
            required : false,
            minlength : 0
        },
        notes : {
            type : String,
            required : false,
            minlength : 0
        },
    })
)
exports.TenentPlates = TenentPlates;