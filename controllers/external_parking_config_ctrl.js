const { Ticket_Aging } = require('../models/tickets_aging_model');
const { Tickets } = require('../models/tickets_model');
const { Users } = require('../models/users_model');
var mongoose = require('mongoose');
const { ExternalParkingConfig } = require('../models/external_parking_config_model');
const { Zones } = require('../models/zone_model');

module.exports.getExternalParkingConfig = async function (req, res){
    let body = {}
    let user = await Users.find({org: req.body.org_id}).select('-__v');
    if(user.length > 0){
        if(user[0].role !== 'root'){
            body['org'] = mongoose.Types.ObjectId(req.body.org_id);
        }
    }
    const externalParkingConfig = await ExternalParkingConfig.find(body).populate('org').populate('zone').sort({ _id: 1 }).select('-__v');
    res.send(externalParkingConfig);
}

module.exports.getZoneByOrg = async function (req, res){
    const zones = await Zones.find({org: req.body.org_id}).sort({ _id: 1 }).select('-__v');
    res.send(zones);
}

module.exports.addExternalParkingConfig = async function(req,res){
    const find = await ExternalParkingConfig.findOne({zone: req.body.zone}).select('-__v');
    if(find){
        res.send({
            msg: 'zone_already_configured',
            status: 'error',
        })
    }else{
        const externalParkingConfig = new ExternalParkingConfig(req.body);
        externalParkingConfig.save();
        res.send({
            msg: 'configuration_added_successfully',
            status: 'success',
        })
    }
}

module.exports.editExternalParkingConfig = async function(req,res){
    ExternalParkingConfig.findByIdAndUpdate(req.body.id, req.body, {new: true})
    .then(response => {
        if(!response) {
            return res.status(404).json({
                msg: "Data not found with id " + req.body.id
            });
        }
        res.json(response);
    }).catch(err => {
        if(err.kind === 'ObjectId') {
            return res.status(404).json({
                msg: "Data not found with id " + req.body.id
            });                
        }
        return res.status(500).json({
            msg: "Error updating Data with id " + req.body._id
        });
    });
}

module.exports.delExternalParkingConfig = async function(req,res){
    const externalParkingConfig = await ExternalParkingConfig.deleteOne({_id : req.body.id}).select('-__v');
    res.send(externalParkingConfig);
}

