var {Users} = require('../models/users_model');
var email_helper = require('../helpers/email_helper');
var encrypt_helper = require('../helpers/encrypt_helper');
const constant = require('../lib/constant');
const { User_Permissions } = require('../models/user_permission_model');
const { Modules } = require('../models/modules_model');
const { Organizations } = require('../models/organizations_model');
const { Agent_Permissions } = require('../models/agent_permission_model');

module.exports.signup = function(req,res){
    emailExist(req.body).then(async (response)=>{
        if(response.length > 0 && response[0].email_verified){
            res.send({
                exist: true,
                msg:"Email already exists",
                status: 'error'
            })
        }else{
            if(response.length > 0 && !response[0].email_verified){
                Users.deleteOne({email: response[0].email}, function(err, results) {
                    if (err){
                      console.log(err);
                      throw err;
                    }
                    console.log(results);
                 });
            }
            let cipherPassword = encrypt_helper.crypto_encrypt(req.body.password);
            var token = encrypt_helper.jwt_encode({ email: req.body.email, password: req.body.password }, '1h');
            req.body.password = cipherPassword;
            const org = await Organizations.findOne({_id : req.body.org}).select('-__v');
            req.body.token = token;
            req.body.email_verified = 0;
            req.body.forget_password = 0;
            let emailBody = { ... req.body };
            if(org.sub_domain == 'root'){
                emailBody.path = constant.client_url;
            }else{
                emailBody.path = constant.http + org.sub_domain + '.' +constant.domain;
            }
            const signup = new Users(req.body);
            signup.save();
            email_helper.send_email('Confirmation Email','./views/confirmation_email.ejs',req.body.email,emailBody);
            res.send({
                exist: false,
                msg:"Email has been sent to "+req.body.email+". Please verify your account to proceed",
                status: 'success'
            })
        }
    });
}

module.exports.verify = function(req,res){
    var decode = encrypt_helper.jwt_decode(req.body.token);
    if(decode.expiredAt == undefined){
        Users.findOneAndUpdate(
            { token : req.body.token },
            { $set: { email_verified : 1, token : 0 } },
            { returnOriginal: false }
         ).then(response => {
            if(!response) {
                return res.send({auth : false, msg: "Token has been Expired. Please register again"});
            }
            res.send({auth : true, msg: "Verified"});
        })
    }else{
        res.send({auth : false, msg: "Token has been Expired. Please register again"});
    }
}

module.exports.login = async function(req,res){
    const user = await Users.find({email : req.body.email, org: req.body.org_id}).select('-__v');
    if(user.length > 0){
        if(user[0].email_verified == true){
            let password = encrypt_helper.crypto_decrypt(user[0].password);
            if(password == req.body.password){
                let access_token = encrypt_helper.jwt_encode({ id : user[0]._id, role : user[0].role }, '1d')
                let response = user[0].toObject();
                if(user[0].role == 'admin' || user[0].role == 'root'){
                    const permission = await User_Permissions.find({user: user[0]._id}).populate('module');
                    response['permissions'] = permission;
                }
                return res.cookie("access_token", access_token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    })
                    .status(200)
                    .send({auth : true, result : response, token: access_token});
            }else{
                res.send({auth : false, msg:"Incorrect Password"})
            }   
        }else{
            res.send({auth : false, msg:"Email not verified yet, Please check your email"})
        }
    }else{
        res.send({auth : false, msg:"Incorrect Email"})
    }
}

module.exports.agent_login = async function(req,res){
    const user = await Users.find({email : req.body.email, role: 'agent'}).populate('org').select('-__v');
    if(user.length > 0){
        if(user[0].email_verified == true){
            let password = encrypt_helper.crypto_decrypt(user[0].password);
            if(password == req.body.password){
                let access_token = encrypt_helper.jwt_encode({ id : user[0]._id, role : user[0].role }, '1d')
                let response = user[0].toObject();
                let agent_permissions = await Agent_Permissions.
                findOne({ user: user[0]._id }).
                populate('cities').
                select('cities');
                response.cities = agent_permissions.cities;
                return res.cookie("access_token", access_token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    })
                    .status(200)
                    .send({auth : true, result : response, token: access_token});
            }else{
                res.send({auth : false, msg:"Incorrect Password"})
            }   
        }else{
            res.send({auth : false, msg:"Email not verified yet, Please check your email"})
        }
    }else{
        res.send({auth : false, msg:"Incorrect Email"})
    }
}

const emailExist = async (el) =>{
    const user = await Users.find({email: el.email, org: el.org}).select('-__v');
    return await user;
}

module.exports.forgetPassword = function(req,res){
    emailExist(req.body).then((response)=>{
        if(response.length > 0){
            let password = Math.random().toString(36).slice(2)
            let cipherPassword = encrypt_helper.crypto_encrypt(password);
            req.body.password = cipherPassword;
            let emailBody = { ... req.body };
            emailBody.password = password;
            emailBody.fname = response[0].fname;
            Users.findOneAndUpdate(
                { email : req.body.email },
                { $set: { forget_password : 1, password : cipherPassword } },
                { returnOriginal: false }
             ).then(response => {
                email_helper.send_email('Reset Password','./views/forget_password.ejs',req.body.email,emailBody);
                res.send({
                    exist: true,
                    msg:"Password has been sent to "+req.body.email,
                    status: 'success'
                })
            })
        }else{
            res.send({
                exist: false,
                msg:"Incorrect Email.",
                status: 'error'
            })    
        }
    });
}

module.exports.changePassword = async function(req,res){
    let cipherPassword = encrypt_helper.crypto_encrypt(req.body.new_password);
    Users.findOneAndUpdate(
        { _id : req.body.id },
        { $set: { password : cipherPassword, forget_password : 0 } },
        { returnOriginal: false }
     ).then(async response => {
        let access_token = encrypt_helper.jwt_encode({ id : response._id, role : response.role }, '1d')
        let obj = response.toObject();
                if(response.role == 'admin' || response.role == 'root'){
                    const permission = await User_Permissions.find({user: response._id}).populate('module');
                    obj['permissions'] = permission;
                }
        return res.cookie("access_token", access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            })
            .status(200)
            .send({auth : true, result : obj, token: access_token});
    })
}

module.exports.addRoot = async function(req,res){
    checkEmail(req.body.email).then(async (response)=>{
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
                        const organization = await new Organizations(req.body);
                        organization.save();
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
                        let modules = req.body.modules;
                        modules.map(async x=>{
                            const module = await new Modules(x);
                            module.save();
                            x.module = module._id;
                            x.org = organization._id;
                            x.user = user._id
                            console.log(x);
                            const permission = await new User_Permissions(x);
                            permission.save();
                            console.log(permission);
                        })
                        email_helper.send_email('Organization Registerd','./views/create_org.ejs',req.body.email,emailBody);
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

const checkEmail = async (email) =>{
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

module.exports.testAddUser = function(req,res){
    let obj = {
        fname: 'test',
        test: 'test',
        address: 'Sia',
        email: 'asdasda',
        password: 'test123'
    }
    const signup = new Users(obj);
    signup.save();
    res.send(signup);
}

module.exports.testGetUser = async function (req, res){
    const users = await Users.find().select('-__v');
    res.send(users);
}
