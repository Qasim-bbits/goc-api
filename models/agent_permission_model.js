const mongoose = require('mongoose');

const Agent_Permissions = mongoose.model(
    'Agent_Permissions',
    new mongoose.Schema({
        org : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organizations',
            required : false,
            minlength : 0
        },
        user : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required : false,
            minlength : 0
        },
        cities : {
            type: mongoose.Schema.Types.Array,
            ref: 'Cities',
            required : false,
            minlength : 0
        },
    })
)
exports.Agent_Permissions = Agent_Permissions;