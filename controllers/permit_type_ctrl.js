var {PermitType} = require('../models/permit_type_model');

module.exports.getPermitType = async function (req, res){
    const permitType = await PermitType.find().select('-__v');
    res.send(permitType);
}

module.exports.addPermitType = function(req,res){
    const permitType = new PermitType(req.body);
    permitType.save();
    res.send(permitType);
}