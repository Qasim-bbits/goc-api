const { Plates } = require('../models/plate_model');
const { Zones } = require('../models/zone_model');


module.exports.addPlate = function(req,res){
    req.body.plate = req.body.plate.toUpperCase();
    const plate = new Plates(req.body);
    plate.save();
    res.send(plate);
}

module.exports.getPlatesByUser = async function (req, res){
    const plates = await Plates.find({user_id : req.body.id}).sort({_id: -1}).select('-__v');
    res.send(plates);
}

module.exports.delPlate = async function (req, res){
    const plates = await Plates.deleteOne({_id : req.body.id}).select('-__v');
    res.send(plates);
}

module.exports.editPlate = async function (req, res){
    req.body.plate = req.body.plate.toUpperCase();
    Plates.findByIdAndUpdate(req.body.id, req.body, {new: true})
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
    // const plates = await Plates.deleteOne({_id : req.body.id}).select('-__v');
    // res.send(plates);
}