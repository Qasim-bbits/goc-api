const mongoose = require('mongoose');

const Tickets = mongoose.model(
    'Tickets',
    new mongoose.Schema({
        org : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organizations',
            required : false,
            minlength : 0
        },
        ticket_name : {
            type : String,
            required : false,
            minlength : 0
        },
        ticket_num_min : {
            type : Number,
            required : false,
            minlength : 0
        },
        ticket_num_next : {
            type : Number,
            required : false,
            minlength : 0
        },
        ticket_type : {
            type : String,
            required : false,
            enum: ["normal", "booting"]
        },
    })
)
exports.Tickets = Tickets;