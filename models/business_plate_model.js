const mongoose = require('mongoose');

const BusinessPlates = mongoose.model(
    'BusinessPlates',
    new mongoose.Schema({
        plate : {
            type : String,
            required : false,
            minlength : 0
        },
        zone : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Zones',
            required : false,
            minlength : 0
        }
    })
)
exports.BusinessPlates = BusinessPlates;