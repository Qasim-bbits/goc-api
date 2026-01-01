const mongoose = require('mongoose');

const Printed_Tickets = mongoose.model(
    'Printed_Tickets',
    new mongoose.Schema({
        org : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organizations',
            required : false,
            minlength : 0
        },
        printed_ticket : {
            type : String,
            required : false,
            minlength : 0
        },
        printer_details : {
            type : String,
            required : false,
            minlength : 0
        },
    },
    { timestamps: { created_at: 'created_at' } })
)
exports.Printed_Tickets = Printed_Tickets;