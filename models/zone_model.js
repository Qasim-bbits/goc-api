const mongoose = require('mongoose');

const Zones = mongoose.model(
    'Zones',
    new mongoose.Schema({
        zone_name : {
            type : String,
            required : false,
            minlength : 0
        },
        city_id : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Cities',
            required : false,
            minlength : 0
        },
        polygon : {
            type : Array,
            required : false,
            minlength : 0
        },
        zone_type : {
            type : Number,
            required : false,
            minlength : 0
        },
        visitor_pass_time : {
            type : Number,
            required : false,
            minlength : 0
        },
        org : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organizations',
            required : false,
            minlength : 0
        },
        tenant_zone : {
            type : Boolean,
            required : false,
            minlength : 0
        },
        tenant_and_visitor : {
            type : Boolean,
            required : false,
            minlength : 0
        },
        caption_en : {
            type : String,
            required : false,
            minlength : 0
        },
        caption_fr : {
            type : String,
            required : false,
            minlength : 0
        },
        enable_parking_limit : {
            type : Boolean,
            default : false
        },
        no_of_parking_per_plate: {
            type : Number,
        },
        is_business_pass : {
            type : Boolean,
            default : false
        },
        no_of_business_pass: {
            type : Number,
        },
        can_user_kick_out : {
            type : Boolean,
            default : false
        },
        parking_limit_type: {
            type : String,
            required : false,
            minlength : 0
        },
        start_parking_limit_date : {
            type : Date,
            required : false,
            minlength : 0
        },
        end_parking_limit_date : {
            type : Date,
            required : false,
            minlength : 0
        },
        enable_extension: {
            type : Boolean,
            default : false,
        },
        is_plate_editable : {
            type : Boolean,
            default : false
        },
        no_of_times_plate_can_edit: {
            type : Number,
        },
        zone_code: {
            type : String,
        },
        owner_email: {
            type : String,
        },
    })
)
exports.Zones = Zones;