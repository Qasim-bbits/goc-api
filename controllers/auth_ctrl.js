var {Users} = require('../models/users_model');
var email_helper = require('../helpers/email_helper');
var encrypt_helper = require('../helpers/encrypt_helper');
const constant = require('../lib/constant');

module.exports.signup = function(req,res){
    emailExist(req.body.email).then((response)=>{
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
            req.body.token = token;
            req.body.email_verified = 0;
            let emailBody = { ... req.body };
            emailBody.path = req.get('origin') + '/';
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
                return res.send({
                    msg: "Token has been Expired. Please register again"
                });
            }
            res.send(response);
        })
    }else{
        res.send({msg: "Token has been Expired. Please register again"});
    }
}

module.exports.login = async function(req,res){
    const user = await Users.find({email : req.body.email}).select('-__v');
    if(user.length > 0){
        if(user[0].email_verified == true){
            let password = encrypt_helper.crypto_decrypt(user[0].password);
            if(password == req.body.password){
                let access_token = encrypt_helper.jwt_encode({ id : user[0].id, role : user[0].role }, '1d')
                let userInfo = {
                    fname : user[0].fname,
                    lname : user[0].lname,
                    email : user[0].email,
                    role : user[0].role
                }
                return res.cookie("access_token", access_token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    })
                    .status(200)
                    .send({auth : true, result : user[0], token: access_token});
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

const emailExist = async (email) =>{
    const user = await Users.find({email : email}).select('-__v');
    return await user;
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