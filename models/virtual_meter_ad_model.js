const mongoose = require('mongoose');

const VirtualMeterAds = mongoose.model(
    'VirtualMeterAds',
    new mongoose.Schema({
        compaign: {
            type: String,
            required: false,
            minlength: 0
        },
        start_date: {
            type: Date,
            required: false,
            minlength: 0
        },
        end_date: {
            type: Date,
            required: false,
            minlength: 0
        },
        org: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organizations',
            required: false,
            minlength: 0
        },
        zone: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Zones',
            required: false,
            minlength: 0
        },
    },
        { timestamps: { created_at: 'created_at' } }
    )
)
exports.VirtualMeterAds = VirtualMeterAds;