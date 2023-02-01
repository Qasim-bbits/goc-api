const { TenentPlates } = require('../models/tenent_plate_model');
const { Parkings } = require('../models/parking_model');
const moment = require('moment-timezone');
const { Users } = require('../models/users_model');
var mongoose = require('mongoose');
moment.tz.setDefault("America/New_York");

module.exports.addTenentPlate = async function(req,res){
    req.body.plate = req.body.plate.toUpperCase();
    const tenent_plate = await TenentPlates.find(req.body).select('-__v');
    console.log(tenent_plate.length)
    if(tenent_plate.length == 0){
        const plate = new TenentPlates(req.body);
        plate.save();
        res.send({
            status: 'success',
            msg: 'plate_added_successfully'
        });
    }else{
        res.send({
            status: 'error',
            msg: 'plate_already_exist'
        });
    }
}

module.exports.getTenantPlates = async function(req,res){
    let body = {}
    let user = await Users.find({org: req.body.org_id}).select('-__v');
    if(user.length > 0){
        if(user[0].role !== 'root'){
            body['org'] = mongoose.Types.ObjectId(req.body.org_id);
        }
    }
    const plates = await TenentPlates.
    find(body).
    sort({_id: -1}).
    populate('zone').
    populate('org');
    res.send(plates);
}

module.exports.delTenentPlate = async function (req, res){
    const plates = await TenentPlates.deleteOne({_id : req.body.id}).select('-__v');
    res.send(plates);
}

module.exports.editTenentPlate = async function (req, res){
    req.body.plate = req.body.plate.toUpperCase();
    TenentPlates.findByIdAndUpdate(req.body.id, req.body, {new: true})
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