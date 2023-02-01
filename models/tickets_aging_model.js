const mongoose = require('mongoose');

const Ticket_Aging = mongoose.model(
    'Ticket_Aging',
    new mongoose.Schema({
        ticket : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tickets',
            required : false,
            minlength : 0
        },
        rate : {
            type : Number,
            required : false,
            minlength : 0
        },
        applied_from : {
            type : Number,
            required : false,
            minlength : 0
        },
        applied_to : {
            type : Number,
            required : false,
            minlength : 0
        },
        order : {
            type : Number,
            required : false,
            minlength : 0
        },
    })
)
exports.Ticket_Aging = Ticket_Aging;