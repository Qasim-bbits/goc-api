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
        },
        ssl_installed : {
            type : Boolean,
            default : false
        },
        condition_of_use : {
            type : String,
            required : false,
            minlength : 0
        },
        privacy_policy : {
            type : String,
            required : false,
            minlength : 0
        },
        literal_sheet_url: {
            type : String,
            required : false,
            minlength : 0
        },
        whatsapp_no: {
            type : Number,
            required : false,
            minlength : 0
        },
        hide_login_button: {
            type : Boolean,
            default: false
        },
        ticket_format : {
            type : String,
            required : false,
            minlength : 0
        },
        reporting_url : {
            type : String,
            required : false,
            minlength : 0
        },
        enable_custom_public_notes: {
            type : Boolean,
            default: false
        },
        enable_custom_private_notes: {
            type : Boolean,
            default: false
        },
    })
)
exports.Organizations = Organizations;