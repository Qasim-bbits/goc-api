const { Users } = require('../models/users_model');


module.exports.getUsers = async function (req, res){
    const users = await Users.find().select('-__v');
    res.send(users);
}