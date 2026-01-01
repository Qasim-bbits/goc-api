const { Organizations } = require('../models/organizations_model');
var {Users} = require('../models/users_model');
var email_helper = require('../helpers/email_helper');
var encrypt_helper = require('../helpers/encrypt_helper');
const constant = require('../lib/constant');
const { User_Permissions } = require('../models/user_permission_model');
const { installSSL } = require('../helpers/install_ssl_helper');
const fs = require('fs');

module.exports.getOrganizations = async function (req, res){
    const organizations = await Organizations.find().select('-__v');
    res.send(organizations);
}

module.exports.getOrgBySubDomain = async function (req, res){
    if(req.body.sub_domain !== undefined){
        const organizations = await Organizations.find({sub_domain : req.body.sub_domain}).select('-__v');
        res.send(organizations);
    }else{
        try{
            const user = await Users
                .find({role: req.body.role})
                .populate('org');
            res.send(user);
        } catch (err) {
            console.log(err);
            res.status(500).json({ success: false, msg: err.message });
        }      
    }
}

module.exports.addOrganization = function(req,res){
    emailExist(req.body.email).then(async (response)=>{
        if(response.length > 0 && response[0].email_verified){
            res.send({
                exist: true,
                msg:"Email already exists",
                status: 'error'
            })
        }else{
            rootExist(req.body.role).then(async (r)=>{
                if(r.length > 0){
                    res.send({
                        exist: true,
                        msg:"Root user already exist",
                        status: 'error'
                    })
                }else{
                    const sub_domain = await Organizations.find({sub_domain : req.body.sub_domain}).select('-__v');
                    if(sub_domain.length > 0){
                        res.send({
                            exist: true,
                            msg:"Organization already exists with same sub domain.",
                            status: 'error'
                        })
                    }else{
                    if(req.body.payment_gateway == 'stripe'){
                        req.body.stripe_publishable_key = encrypt_helper.crypto_encrypt(req.body.stripe_publishable_key);
                        req.body.stripe_secret_key = encrypt_helper.crypto_encrypt(req.body.stripe_secret_key);
                    }else if(req.body.payment_gateway == 'moneris'){
                        req.body.moneris_store_id = encrypt_helper.crypto_encrypt(req.body.moneris_store_id);
                        req.body.moneris_api_token = encrypt_helper.crypto_encrypt(req.body.moneris_api_token);
                        req.body.moneris_checkout_id = encrypt_helper.crypto_encrypt(req.body.moneris_checkout_id);
                    }
                    req.body.logo = req.files.logo[0].path;
                    const organization = await new Organizations(req.body);
                    organization.save().then(()=>{
                        installSSL();
                    });
                    let password = req.body.password;
                    req.body.password = encrypt_helper.crypto_encrypt(req.body.password);
                    req.body.token = 0;
                    req.body.email_verified = 1;
                    req.body.forget_password = 1;
                    req.body.org = organization._id;
                    let emailBody = { ... req.body };
                    emailBody.password = password;
                    const user = await new Users(req.body);
                    user.save();
                    let permissions = JSON.parse(req.body.permission);
                    permissions.map(x=>{
                        x.module = x._id;
                        x.org = organization._id;
                        x.user = user._id
                    })
                    permissions.forEach(function(v){ delete v._id });
                    try {
                        User_Permissions.insertMany(permissions);
                    } catch (e) {
                        print (e);
                    }
                    // email_helper.send_email('Organization Registerd','./views/create_org.ejs',req.body.email,emailBody);
                    res.send({
                        exist: false,
                        msg:"Organization registered successfully and temporary password is sent to "+req.body.email+"",
                        status: 'success'
                    })
                    }
                }
            });
        }
    });
}

module.exports.delOrganization = async function (req, res){
    await Organizations.deleteOne({_id : req.body.id}).select('-__v');
    await Users.deleteOne({org : req.body.id}).select('-__v');
    const permissions = await User_Permissions.deleteOne({org : req.body.id}).select('-__v');
    res.send(permissions);
}

module.exports.editOrganization = async function(req,res){
    const org = await Organizations.find({sub_domain : req.body.sub_domain}).select('-__v');
    if(org.length > 0){
        if(org[0]._id == req.body.id){
            req.body.logo = org[0].logo;
            if(req.files.logo !== undefined)
            req.body.logo = req.files.logo[0].path;
        }else{
            res.send({
                exist: true,
                msg:"Organization already exists with same sub domain. Please change sub domain",
                status: 'error'
            })
        }
    }else{
        const org = await Organizations.find({_id : req.body.id}).select('-__v');
        req.body.logo = org[0].logo;
        if(req.files && req.files.logo !== undefined)
        req.body.logo = req.files.logo[0].path;
    }
    if(req.body.payment_gateway == 'stripe'){
        req.body.stripe_publishable_key = encrypt_helper.crypto_encrypt(req.body.stripe_publishable_key);
        req.body.stripe_secret_key = encrypt_helper.crypto_encrypt(req.body.stripe_secret_key);
    }else if(req.body.payment_gateway == 'moneris'){
        req.body.moneris_store_id = encrypt_helper.crypto_encrypt(req.body.moneris_store_id);
        req.body.moneris_api_token = encrypt_helper.crypto_encrypt(req.body.moneris_api_token);
        req.body.moneris_checkout_id = encrypt_helper.crypto_encrypt(req.body.moneris_checkout_id);
    }
    Organizations.findByIdAndUpdate(req.body.id, req.body, {new: true})
        .then(response => {
            console.log(response)
            if(!response) {
                res.send({
                    exist: false,
                    msg:"Error Occured",
                    status: 'error'
                })
            }
            res.send({
                exist: false,
                msg:"Organization updated successfully",
                status: 'success'
            })
        }).catch(err => {
            console.log(err)
            if(err.kind === 'ObjectId') {
                res.send({
                    exist: false,
                    msg:"Error Occured",
                    status: 'error'
                })               
            }
            res.send({
                exist: false,
                msg:"Error Occured",
                status: 'error'
            })
        });
}

module.exports.partialEditOrganization = async function(req,res){
    Organizations.findByIdAndUpdate(req.body.id, req.body, {new: true})
        .then(response => {
            if(!response) {
                res.send({
                    exist: false,
                    msg:"Error Occured",
                    status: 'error'
                })
            }
            res.send({
                exist: false,
                msg:"Organization updated successfully",
                status: 'success'
            })
        }).catch(err => {
            if(err.kind === 'ObjectId') {
                res.send({
                    exist: false,
                    msg:"Error Occured",
                    status: 'error'
                })               
            }
            res.send({
                exist: false,
                msg:"Error Occured",
                status: 'error'
            })
        });
}

const emailExist = async (email) =>{
    const user = await Users.find({email : email}).select('-__v');
    return await user;
}

const rootExist = async (role) =>{
    if(role == 'root'){
        const user = await Users.find({role : 'root'}).select('-__v');
        return await user;
    }else{
        return [];
    }
}

module.exports.getOrgImage = async function (req, res){
    const org = await Organizations.findById(req.body.id);
    fs.readFile(org.logo, (err, data) => {
        if (err) throw err;
        let base64Image = Buffer.from(data, 'binary').toString('base64');
        res.send(base64Image)        

    });
}