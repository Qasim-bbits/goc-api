const { BusinessPlates } = require('../models/business_plate_model');


module.exports.addBusinessPlate = function(req,res){
    const plate = new BusinessPlates(req.body);
    plate.save();
    res.send(plate);
}

module.exports.delPlate = async function (req, res){
    const plates = await BusinessPlates.deleteOne({_id : req.body.id}).select('-__v');
    res.send(plates);
}

module.exports.editPlate = async function (req, res){
    BusinessPlates.findByIdAndUpdate(req.body.id, req.body, {new: true})
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
    // const plates = await BusinessPlates.deleteOne({_id : req.body.id}).select('-__v');
    // res.send(plates);
}