const { Cities } = require('../models/city_model');
const { Users } = require('../models/users_model');
const { Zones } = require('../models/zone_model');
const { Parkings } = require('../models/parking_model');
var mongoose = require('mongoose');
const constant = require('../lib/constant');

module.exports.getCities = async function (req, res){
    let body = {}
    let user = await Users.find({org: req.body.org_id}).select('-__v');
    if(user.length > 0 && user[0].role !== 'root'){
        body['org'] = mongoose.Types.ObjectId(req.body.org_id);
    }
    const cities = await Cities.find(body).sort( { "city_name": 1 } ).select('-__v').populate('org');
    res.send(cities);
}

module.exports.editCity = async function (req, res){
    Cities.findByIdAndUpdate(req.body.id, req.body, {new: true})
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

module.exports.getZones = async function (req, res){
    try{
        let body = {}
        let user = await Users.find({org: req.body.org_id}).select('-__v');
        if(user.length > 0 && user[0].role !== 'root'){
            body['org'] = mongoose.Types.ObjectId(req.body.org_id);
        }
        const zones = await Zones
            .find({...{visitor_pass_time: 0}, ...body})
            .populate('org')
            .populate('city_id');
        res.send(zones);
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, msg: err.message });
    }
}

module.exports.addCity = function(req,res){
    const cities = new Cities(req.body);
    cities.save();
    res.send(cities);
}

module.exports.delCity = async function (req, res){
    const cities = await Cities.deleteOne({_id : req.body.id}).select('-__v');
    res.send(cities);
}

module.exports.addZone = async function(req,res){
    const isZoneCodeExist = await Zones.findOne({zone_code : req.body.zone_code}).select('-__v');
    if(isZoneCodeExist){
        res.send({
            status: 'error',
            msg: 'zone_code_already_exists'
        });
    }else{
        const zones = new Zones(req.body);
        zones.save();
        res.send(zones);
    }
}

module.exports.getZonesById = async function (req, res){
    const zones = await Zones.find({city_id : req.body.id, visitor_pass_time: 0}).select('-__v');
    res.send(zones);
}

module.exports.getZonebyId = async function (req, res){
    let zones = await Zones.find({_id : req.body.id, org: req.body.org_id}).populate('city_id').populate('org').lean();
    if(zones[0].is_business_pass){
        const parkings = await Parkings.find({
            $and: [
              {
                from: {
                  $lte: new Date()
                }
              },
              {
                to: {
                  $gte: new Date()
                }
              },
              {
                zone: req.body.id
              }
            ]
        });
        zones[0].available_passes = zones[0].no_of_business_pass - parkings.length;
        res.send(zones);
    }else{
        res.send(zones);
    }
}

module.exports.editZone = async function (req, res){
    const isZoneCodeExist = await Zones.findOne({zone_code : req.body.zone_code, _id: {$ne: req.body.id}}).select('-__v');
    if(isZoneCodeExist){
        res.send({
            status: 'error',
            msg: 'zone_code_already_exists'
        });
    }else{
        Zones.findByIdAndUpdate(req.body.id, req.body, {new: true})
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
}

module.exports.delZone = async function (req, res){
    const zone = await Zones.deleteOne({_id : req.body.id}).select('-__v');
    res.send(zone);
}

module.exports.getVisitorZone = async function (req, res){
    const zones = await Zones.find({_id : req.body.id, visitor_pass_time: {$ne : 0}}).populate('city_id');
    res.send(zones);
}

module.exports.getTenantAndVisitorZones = async function (req, res){
    const zones = await Zones.find({tenant_and_visitor: true, org: req.body.org_id}).populate('city_id');
    res.send(zones);
}

module.exports.getZoneUrl = async function (req, res){
    const { MessagingResponse } = require('twilio').twiml;
    const receivedMsg = req.body.Body.toUpperCase();
    console.log(req.body);
    const twiml = new MessagingResponse();
    const zone = await Zones.findOne({zone_code : receivedMsg}).select('-__v').populate('org');
    if(zone){
        let path = `${constant.client_url}zone/${zone._id}`;
        if (zone.org.sub_domain !== 'root') {
            path = `${constant.http}${zone.org.sub_domain}.${constant.domain}zone/${zone._id}`;
        }
        twiml.message(`Here is your link: ${path}`);
    }else{
        // twiml.message(receivedMsg);
        twiml.message("No zone exists with this code, please try again with different code");
    }
    res.type('text/xml');
    res.send(twiml.toString());
}

module.exports.getZoneByCode = async function (req, res){
    const zone = await Zones.findOne({zone_code : req.body.zone_code}).select('-__v').populate('city_id').populate('org');
    if(zone){
        res.send(zone);
    }else{
        res.send({
            success: false,
            status: 'error',
            msg: 'No zone exists with this code, please try again with different code'
        });
    }
}