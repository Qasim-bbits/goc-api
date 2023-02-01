const mongoose = require('mongoose');

const Ticket_Issued = mongoose.model(
    'Ticket_Issued',
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
        ticket : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tickets',
            required : false,
            minlength : 0
        },
        issued_by : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required : false,
            minlength : 0
        },
        plate : {
            type : String,
            required : false,
            minlength : 0
        },
        ticket_num : {
            type : Number,
            required : false,
            minlength : 0
        },
        images : {
            type : Array,
            required : false,
            minlength : 0
        },
        parking_status : {
            type : String,
            required : false,
            minlength : 0
        },
        ticket_status : {
            type : String,
            required : false,
            minlength : 0
        },
        issued_at : {
            type : Date,
            required : false,
            minlength : 0
        },
        paymentMethod: {
            type : String,
            required : false,
            minlength : 0
        },
        payment_gateway: {
            type : String,
            required : false,
            minlength : 0
        },
        moneris_ticket: {
            type : String,
            required : false,
            minlength : 0
        },
    },
    { timestamps: { created_at: 'created_at' } })
)
exports.Ticket_Issued = Ticket_Issued;