const { KickOutPlates } = require('../models/kick_out_plates_model');
const { Users } = require('../models/users_model');
var mongoose = require('mongoose');

module.exports.getKickOutPlates = async function (req, res){
    let body = {}
    let user = await Users.find({org: req.body.org_id}).select('-__v');
    if(user.length > 0 && user[0].role !== 'root'){
        body['org'] = mongoose.Types.ObjectId(req.body.org_id);
    }
    const plates = await KickOutPlates.find(body).sort( { "createdAt": -1 } ).select('-__v')
    .populate('org')
    .populate('city')
    .populate('zone')
    .populate('parking');
    res.send(plates);
}