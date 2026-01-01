const { BusinessPassPlates } = require('../models/business_pass_plate_model');
const moment = require('moment-timezone');
const { Users } = require('../models/users_model');
var mongoose = require('mongoose');
moment.tz.setDefault("America/New_York");

module.exports.addBusinessPassPlate = async function(req,res){
    req.body.plate = req.body.plate.toUpperCase();
    const tenent_plate = await BusinessPassPlates.find(req.body).select('-__v');
    if(tenent_plate.length == 0){
        const plate = new BusinessPassPlates(req.body);
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

module.exports.getBusinessPassPlates = async function(req,res){
    let body = {}
    let user = await Users.find({org: req.body.org_id}).select('-__v');
    if(user.length > 0){
        if(user[0].role !== 'root'){
            body['org'] = mongoose.Types.ObjectId(req.body.org_id);
        }
    }
    const plates = await BusinessPassPlates.
    find(body).
    sort({_id: -1}).
    populate('zone').
    populate('org');
    res.send(plates);
}

module.exports.delBusinessPassPlate = async function (req, res){
    const plates = await BusinessPassPlates.deleteOne({_id : req.body.id}).select('-__v');
    res.send(plates);
}

module.exports.editBusinessPassPlate = async function (req, res){
    req.body.plate = req.body.plate.toUpperCase();
    BusinessPassPlates.findByIdAndUpdate(req.body.id, req.body, {new: true})
    .then(response => {
        if(!response) {
            return res.status(404).json({
                msg: "Tenant Plate not found with id " + req.body.id
            });
        }
        res.send({
            status: 'success',
            msg: 'plate_updated_successfully'
        });
    }).catch(err => {
        if(err.kind === 'ObjectId') {
            return res.status(404).json({
                msg: "Tenant Plate not found with id " + req.body.id
            });                
        }
        return res.status(500).json({
            msg: "Error updating Data with id " + req.body._id
        });
    });
}