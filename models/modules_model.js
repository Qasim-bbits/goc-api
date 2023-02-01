const mongoose = require('mongoose');

const Modules = mongoose.model(
    'Modules',
    new mongoose.Schema({
        module_name : {
            type : String,
            required : false,
            minlength : 0
        },
        key : {
            type : String,
            required : false,
            minlength : 0
        },
    })
)
exports.Modules = Modules;