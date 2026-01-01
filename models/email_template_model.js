const mongoose = require('mongoose');

const EmailTemplates = mongoose.model(
    'EmailTemplates',
    new mongoose.Schema({
        template_name : {
            type : String,
            required : false,
            minlength : 0
        },
        template : {
            type : String,
            required : false,
            minlength : 0
        },
        subject : {
            type : String,
            required : false,
            minlength : 0
        },
        org : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organizations',
            required : false,
            minlength : 0
        },
    })
)
exports.EmailTemplates = EmailTemplates;