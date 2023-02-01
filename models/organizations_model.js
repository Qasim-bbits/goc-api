const mongoose = require('mongoose');

const Organizations = mongoose.model(
    'Organizations',
    new mongoose.Schema({
        org_name : {
            type : String,
            required : false,
            minlength : 0
        },
        sub_domain : {
            type : String,
            required : false,
            minlength : 0
        },
        service_fee : {
            type : Number,
            required : false,
            minlength : 0
        },
        logo : {
            type : String,
            required : false,
            minlength : 0
        },
        color : {
            type : String,
            required : false,
            minlength : 0
        },
        payment_gateway : {
            type : String,
            required : false,
            minlength : 0
        },
        payment_envoirnment : {
            type : String,
            required : false,
            minlength : 0
        },
        stripe_publishable_key : {
            type : String,
            required : false,
            minlength : 0
        },
        stripe_secret_key : {
            type : String,
            required : false,
            minlength : 0
        },
        moneris_store_id: {
            type : String,
            required : false,
            minlength : 0
        },
        moneris_api_token : {
            type : String,
            required : false,
            minlength : 0
        },
        moneris_checkout_id : {
            type : String,
            required : false,
            minlength : 0
        },
        moneris_environment : {
            type : String,
            required : false,
            minlength : 0
        }
    })
)
exports.Organizations = Organizations;