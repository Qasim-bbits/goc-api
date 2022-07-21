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

module.exports.getZonebyId = async function (req, res){
    const zones = await Zones.find({_id : req.body.id}).populate('city_id');
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
