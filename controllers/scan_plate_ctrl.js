const { ScanPlate } = require('../models/scan_plate_model');

module.exports.getScanPlates = async function (req, res){
    const scanPlates = await ScanPlate.find().select('-__v');
    res.send(scanPlates);
}

module.exports.addScanPlate = function(req,res){
    const scanPlates = new ScanPlate(req.body);
    scanPlates.save();
    res.send(scanPlates);
}

module.exports.delScanPlate = async function(req,res){
    const scanPlate = await ScanPlate.deleteOne({_id : req.body.id}).select('-__v');
    res.send(scanPlate);
}

module.exports.getScanPlatesByToken = async function(req,res){
    const scanPlate = await ScanPlate.find({session_token : req.params.token}).select('-__v');
    res.send(scanPlate);
}