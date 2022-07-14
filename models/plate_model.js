const mongoose = require('mongoose');

const Plates = mongoose.model(
    'Plates',
    new mongoose.Schema({
        plate : {
            type : String,
            required : false,
            minlength : 0
        },
        user_id : {
            type : String,
            required : false,
            minlength : 0
        }
    })
)
exports.Plates = Plates;