var mongoose = require('mongoose');
const { Users } = require('../models/users_model');
const { User_Permissions } = require('../models/user_permission_model');
var email_helper = require('../helpers/email_helper');
var encrypt_helper = require('../helpers/encrypt_helper');
const constant = require('../lib/constant');
const { Agent_Permissions } = require('../models/agent_permission_model');
const { Organizations } = require('../models/organizations_model');

module.exports.getUsers = async function (req, res){
    let body = {}
    let user = await Users.find({org: req.body.org_id}).select('-__v');
    if(user.length > 0 && user[0].role !== 'root'){
        body['org'] = mongoose.Types.ObjectId(req.body.org_id);
    }
    const users = await Users.find(body)
        .sort({_id: -1})
        .populate('org')
        .select('-__v');
    res.send(users);
}

module.exports.getUserProfile = async function (req, res){
    const users = await Users.find({_id : req.body.user_id}).select('-__v');
    users[0].password = encrypt_helper.crypto_decrypt(users[0].password)
    res.send(users);
}

module.exports.delUser = async function (req, res){
    const users = await Users.deleteOne({_id : req.body.id}).select('-__v');
    res.send(users);
}

module.exports.addUser = function(req,res){
    emailExist(req.body.email).then(async (response)=>{
        if(response.length > 0 && response[0].email_verified && response[0].org == req.body.org_id){
            res.send({
                exist: true,
                msg:"Email already exists",
                status: 'error'
            })
        }else{
            if(response.length > 0 && !response[0].email_verified && response[0].org == req.body.org_id){
                Users.deleteOne({email: response[0].email}, function(err, results) {
                    if (err){
                      console.log(err);
                      throw err;
                    }
                    console.log(results);
                 });
            }
            let password = Math.random().toString(36).slice(2)
            let cipherPassword = encrypt_helper.crypto_encrypt(password);
            var token = encrypt_helper.jwt_encode({ email: req.body.email, password: password }, '1h');
            req.body.password = cipherPassword;
            req.body.token = token;
            req.body.email_verified = 0
            req.body.forget_password = 1;
            req.body.org = req.body.org_id;
            let emailBody = { ... req.body };
            emailBody.password = password;
            const user = new Users(req.body);
            user.save();
            if(req.body.role == 'admin'){
                let permissions = req.body.permission;
                permissions.map(x=>{
                    x.module = x._id;
                    x.org = req.body.org_id;
                    x.user = user._id
                })
                permissions.forEach(function(v){ delete v._id });
                try {
                    User_Permissions.insertMany(permissions);
                } catch (e) {
                    print (e);
                }
            }else if(req.body.role == 'agent'){
                let obj = {
                    user: user._id,
                    org: req.body.org_id,
                    cities: req.body.cities
                };
                const agent_permission = new Agent_Permissions(obj);
                agent_permission.save();
            }
            const org = await Organizations.findOne({_id: req.body.org}).select('-__v');
            emailBody.logo = org.logo;
            emailBody.color = org.color;
            emailBody.path = constant.client_url;
            email_helper.send_email('Confirmation Email','./views/confirm_reset_email.ejs',req.body.email,emailBody);
            res.send({
                exist: false,
                msg:"Email has been sent to "+req.body.email+". Please verify account to proceed",
                status: 'success'
            })
        }
    });
}

module.exports.editUser = async function (req, res){
    Users.findByIdAndUpdate(req.body.id, req.body, {new: true})
    .then(response => {
        if(!response) {
            return res.status(404).json({
                msg: "Data not found with id " + req.body.id
            });
        }
        if(req.body.role == 'agent'){
            Agent_Permissions.findOneAndUpdate(
                { user : req.body.id },
                { $set: { cities : req.body.cities } },
                { returnOriginal: false }
             )
            .then(result => {
                res.send({
                    exist: false,
                    msg:"User Updated Successfully",
                    status: 'success'
                })
            })
        }else{
            res.send({
                exist: false,
                msg:"User Updated Successfully",
                status: 'success'
            })
        }
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
}

const emailExist = async (email) =>{
    const user = await Users.find({email : email}).select('-__v');
    return await user;
}

module.exports.editProfile = async function (req, res){
    req.body.password = encrypt_helper.crypto_encrypt(req.body.password);
    Users.findByIdAndUpdate(req.body._id, req.body, {new: true})
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

module.exports.getAgents = async function (req, res){
    const users = await Users.find({role: 'agent'}).sort({_id: -1}).select('-__v');
    res.send(users);
}