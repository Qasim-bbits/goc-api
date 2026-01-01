const { VirtualMeterAds } = require('../models/virtual_meter_ad_model');
const { Users } = require('../models/users_model');
const mongoose = require('mongoose');
const constant = require('../lib/constant');

module.exports.getVirtualMeterAds = async function (req, res) {
    let body = {}
    let user = await Users.find({ org: req.body.org_id }).select('-__v');
    if (user.length > 0 && user[0].role !== 'root') {
        body['org'] = mongoose.Types.ObjectId(req.body.org_id);
    }
    const virtualMeterAds = await VirtualMeterAds.find(body).sort({ "_id": -1 }).select('-compaign -__v').populate('org').populate({
        path: 'zone',
        populate: {
            path: 'city_id',
            model: 'Cities'
        }
    }).lean();
    res.send(virtualMeterAds);
}

module.exports.getVirtualMeterAdById = async function (req, res) {
    const virtualMeterAds = await VirtualMeterAds.findById(req.body.id).select('-__v').populate('org').populate({
        path: 'zone',
        populate: {
            path: 'city_id',
            model: 'Cities'
        }
    }).lean();
    res.send(virtualMeterAds);
}

module.exports.editVirtualMeterAd = async function (req, res) {
    VirtualMeterAds.findByIdAndUpdate(req.body.id, req.body, { new: true })
        .then(response => {
            if (!response) {
                return res.status(404).json({
                    msg: "Data not found with id " + req.body.id
                });
            }
            res.json(response);
        }).catch(err => {
            if (err.kind === 'ObjectId') {
                return res.status(404).json({
                    msg: "Data not found with id " + req.body.id
                });
            }
            return res.status(500).json({
                msg: "Error updating Data with id " + req.body._id
            });
        });
}

module.exports.addVirtualMeterAd = async function (req, res) {
    delete req.body._id;
    const virtualMeterAds = new VirtualMeterAds(req.body);
    virtualMeterAds.save();
    res.send(virtualMeterAds);
}

module.exports.delVirtualMeterAd = async function (req, res) {
    const virtualMeterAds = await VirtualMeterAds.deleteOne({ _id: req.body.id }).select('-__v');
    res.send(virtualMeterAds);
}

module.exports.current_compaign = async function (req, res) {
    const today = new Date();
    const virtualMeterAds = await VirtualMeterAds.find({
        start_date: { $lte: today },
        end_date: { $gte: today },
        zone: mongoose.Types.ObjectId(req.body.zone_id)
    }).select('-__v');

    res.send(virtualMeterAds)
}

module.exports.upload_compaign = async function (req, res) {
    res.send({url: `${constant.FILE_URL}${req.files.compaign[0].path}`});
}