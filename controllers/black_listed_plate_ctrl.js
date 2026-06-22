const { BlackListedPlates } = require('../models/black_listed_plate_model');
const { Users } = require('../models/users_model');
var mongoose = require('mongoose');

module.exports.addBlackListedPlate = async function(req,res){
    const blackListedPlate = new BlackListedPlates(req.body);
    blackListedPlate.save();
    res.send(blackListedPlate);   
}

module.exports.getBlackListedPlates = async function(req,res){
    let body = {}
    let user = await Users.find({org: req.body.org_id}).select('-__v');
    if(user.length > 0){
        if(user[0].role !== 'root'){
            body['org'] = mongoose.Types.ObjectId(req.body.org_id);
        }
    }
    const plates = await BlackListedPlates.
    find(body).
    sort({_id: -1}).
    populate('zone').
    populate('org');
    res.send(plates);
}

module.exports.delBlackListedPlate = async function (req, res){
    const plates = await BlackListedPlates.deleteOne({_id : req.body.id}).select('-__v');
    res.send(plates);
}

module.exports.editBlackListedPlate = async function (req, res){
    req.body.plate && (req.body.plate = req.body.plate.toUpperCase());
    BlackListedPlates.findByIdAndUpdate(req.body.id, req.body, {new: true})
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
            msg: "Error updating Data with id " + req.body.id
        });
    });
}