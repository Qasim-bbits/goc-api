const { Users } = require('../models/users_model');


module.exports.getUsers = async function (req, res){
    const users = await Users.find().select('-__v');
    res.send(users);
}

module.exports.delItem = async function (req, res){
    const users = await Users.deleteOne({_id : req.body.id}).select('-__v');
    res.send(users);
}
