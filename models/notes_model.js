const mongoose = require('mongoose');

const Notes = mongoose.model(
    'Notes',
    new mongoose.Schema({
        org : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organizations',
            required : false,
            minlength : 0
        },
        note : {
            type : String,
            required : false,
            minlength : 0
        },
        type : {
            type : String,
            required : false,
            enum: ["private", "public"]
        },
    })
)
exports.Notes = Notes;