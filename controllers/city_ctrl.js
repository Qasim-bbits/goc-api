const { Cities } = require('../models/city_model');
const { Zones } = require('../models/zone_model');

module.exports.getCities = async function (req, res){
    const cities = await Cities.find().select('-__v');
    res.send(cities);
}

module.exports.getZones = async function (req, res){
    // const zones = await Zones.find().select('-__v');
    try{
        const zones = await Zones
            .find()
            .populate('city_id');
        res.send(zones);
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, msg: err.message });
    }
}

module.exports.addCity = function(req,res){
    console.log(req.body)
    const cities = new Cities(req.body);
    cities.save();
    res.send(cities);
}

module.exports.addZone = function(req,res){
    const zones = new Zones(req.body);
    zones.save();
    res.send(zones);
}

module.exports.getZonesById = async function (req, res){
    const zones = await Zones.find({city_id : req.body.id}).select('-__v');
    res.send(zones);
}
