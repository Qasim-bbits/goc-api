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
    })
)
exports.Zones = Zones;