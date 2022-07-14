var {PermitType} = require('../models/permitType_model');

module.exports.getPermitType = async function (req, res){
    const permitType = await PermitType.find().select('-__v');
    res.send(permitType);
}

module.exports.addPermitType = function(req,res){
    const permitType = new PermitType(req.body);
    permitType.save();
    res.send(permitType);
}