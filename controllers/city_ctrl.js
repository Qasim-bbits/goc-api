const { Cities } = require('../models/city_model');
const { Users } = require('../models/users_model');
const { Zones } = require('../models/zone_model');
var mongoose = require('mongoose');

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

module.exports.addZone = function(req,res){
    const zones = new Zones(req.body);
    zones.save();
    res.send(zones);
}

module.exports.getZonesById = async function (req, res){
    const zones = await Zones.find({city_id : req.body.id, visitor_pass_time: 0}).select('-__v');
    res.send(zones);
}

module.exports.getZonebyId = async function (req, res){
    const zones = await Zones.find({_id : req.body.id, org: req.body.org_id}).populate('city_id').populate('org');
    res.send(zones);
}

module.exports.editZone = async function (req, res){
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

module.exports.delZone = async function (req, res){
    const zone = await Zones.deleteOne({_id : req.body.id}).select('-__v');
    res.send(zone);
}

module.exports.getVisitorZone = async function (req, res){
    const zones = await Zones.find({_id : req.body.id, visitor_pass_time: {$ne : 0}}).populate('city_id');
    res.send(zones);
}
