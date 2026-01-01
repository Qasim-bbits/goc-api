const { ResidantPlates } = require('../models/residant_plate_model');
const { Parkings } = require('../models/parking_model');
const moment = require('moment-timezone');
const { Users } = require('../models/users_model');
var mongoose = require('mongoose');
const { crypto_encrypt, jwt_encode, crypto_decrypt } = require('../helpers/encrypt_helper');
const { Organizations } = require('../models/organizations_model');
var email_helper = require('../helpers/email_helper');
const constant = require('../lib/constant');
const { EmailTemplates } = require('../models/email_template_model');
moment.tz.setDefault("America/New_York");

module.exports.addResidantPlate = async function(req,res){
    addUser(req).then((response) => {
        if(response.status == 'success'){
            req.body.user = response.user._id;
            let body = {
                user: response.user._id,
                zone: req.body.zone,
                // city: req.body.city,
                org: req.body.org,
                plate: req.body.plate,
                car_make: req.body.car_make,
                model: req.body.model,
                color: req.body.color,
                plate_two: req.body.plate_two,
                car_make_two: req.body.car_make_two,
                model_two: req.body.model_two,
                color_two: req.body.color_two,
                plate_three: req.body.plate_three,
                car_make_three: req.body.car_make_three,
                model_three: req.body.model_three,
                color_three: req.body.color_three,
                amount: 0,
                service_fee: 0,
                from: moment().format(),
                to: moment().add(1,"months").format(),
                parking_id: Math.floor(100000 + Math.random() * 900000)
            }
            let parkingBody = [];
            body.zone.forEach(x=>{
                parkingBody.push({
                    ...body,
                    zone: x._id,
                    city: x.city_id._id,
                    parking_id: Math.floor(100000 + Math.random() * 900000)
                })
            })
            const residantPlates = new ResidantPlates(body);
            residantPlates.save().then(function () {
                Parkings.insertMany(parkingBody).then(function () {
                    res.send({
                        status: 'success',
                        msg: 'plate_added_successfully',
                        data: residantPlates
                    });
                }).catch(function (err) {
                    res.send(err);
                })
            }).catch(function (err) {
                res.send(err);
            })
        }else{
            res.send(response);
        }
    });
}

module.exports.getResidantPlates = async function(req,res){
    let body = {}
    let user = await Users.find({org: req.body.org_id}).select('-__v');
    if(user.length > 0){
        if(user[0].role !== 'root'){
            body['org'] = mongoose.Types.ObjectId(req.body.org_id);
        }
    }
    const plates = await ResidantPlates.
    find(body).
    sort({_id: -1}).
    // populate('zone').
    populate('user').
    populate('org');
    res.send(plates);
}

module.exports.delResidantPlate = async function (req, res){
    const plate = await ResidantPlates.findById(req.body.id).select('-__v');
    const user = await Users.deleteOne({_id : plate.user}).select('-__v');
    console.log(user);
    const parkings = await Parkings.deleteMany({user: plate.user});
    console.log(parkings);
    const plates = await ResidantPlates.deleteOne({_id : req.body.id}).select('-__v');
    res.send(plates);
}

module.exports.editResidantPlate = async function (req, res){
    req.body.plate && (req.body.plate = req.body.plate.toUpperCase());
    const plates = await ResidantPlates.findById(req.body.id).select('-__v');
    const user = await Users.findOne({email: req.body.email}).select('-__v');
    plates.zone.map(async x => {
        const parkings = await Parkings.deleteMany({user: user._id, amount: 0, zone: x._id});
        console.log(parkings)
    })
    ResidantPlates.findByIdAndDelete(req.body.id)
    .then(() => {
        req.body.user = user._id;
        let body = {
            user: user._id,
            zone: req.body.zone,
            // city: req.body.city,
            org: req.body.org,
            plate: req.body.plate,
            car_make: req.body.car_make,
            model: req.body.model,
            color: req.body.color,
            plate_two: req.body.plate_two,
            car_make_two: req.body.car_make_two,
            model_two: req.body.model_two,
            color_two: req.body.color_two,
            plate_three: req.body.plate_three,
            car_make_three: req.body.car_make_three,
            model_three: req.body.model_three,
            color_three: req.body.color_three,
            amount: 0,
            service_fee: 0,
            from: moment().format(),
            to: moment().add(1,"months").format(),
            parking_id: Math.floor(100000 + Math.random() * 900000)
        }
        let parkingBody = [];
        body.zone.forEach(x=>{
            parkingBody.push({
                ...body,
                zone: x._id,
                city: x.city_id._id,
                parking_id: Math.floor(100000 + Math.random() * 900000)
            })
        })
        const residantPlates = new ResidantPlates(body);
        residantPlates.save().then(function () {
            Parkings.insertMany(parkingBody).then(function (parking_res) {
                res.send({
                    status: 'success',
                    msg: 'plate_added_successfully',
                    data: parking_res
                });
            }).catch(function (err) {
                res.send(err);
            })
        }).catch(function (err) {
            res.send(err);
        })
    }).catch(err => {
        if(err.kind === 'ObjectId') {
            return res.status(404).json({
                msg: "Tenant Plate not found with id " + req.body.id
            });                
        }
        return res.status(500).json({
            msg: "Error updating Data with id " + req.body._id
        });
    });
}

function addUser(req){
    return new Promise(resolve => {
        let userResponse;
        emailExist(req.body.email).then(async (response)=>{
            if(response.length > 0 && response[0].email_verified && response[0].org == req.body.org){
                userResponse = {
                    exist: true,
                    msg:"email_already_exist",
                    status: 'error'
                }
            }else{
                if(response.length > 0 && !response[0].email_verified && response[0].org == req.body.org_id){
                    Users.deleteOne({email: response[0].email}, function(err, results) {
                        if (err){
                        throw err;
                        }
                    });
                }
                let password = Math.random().toString(36).slice(2);
                let cipherPassword = crypto_encrypt(password);
                var token = jwt_encode({ email: req.body.email, password: password }, '1h');
                req.body.password = cipherPassword;
                req.body.token = token;
                req.body.email_verified = 0
                req.body.forget_password = 1;
                req.body.role = 'user';
                let emailBody = { ... req.body };
                emailBody.password = password;
                const user = new Users(req.body);
                user.save();
                const org = await Organizations.findById(req.body.org).select('-__v')
                emailBody.logo = org.logo;
                emailBody.color = org.color;
                emailBody.path = constant.client_url;
                emailBody.sendingEmail = constant.email;
                emailBody.orgName = org.org_name;
                emailBody.API_URL = constant.API_URL;
                emailBody.COMPANY_NAME = constant.COMPANY_NAME;
                if(org.sub_domain == 'root'){
                    emailBody.path = constant.client_url;
                }else{
                    emailBody.path = constant.http + org.sub_domain + '.' +constant.domain;
                }
                const template = await EmailTemplates.findOne({
                                        "org_id": req.body.org,
                                        "template_name": "confirmation_and_temporary_password"
                                    }).select('-__v');
                if(req.body.id == undefined)
                    if(template) {
                        emailBody.content = stringFormat(template.template, {orgName: org.org_name, verifyLink: `${emailBody.path}verify/${token}`, password: password});
                        email_helper.send_email(template.subject,'./views/email_template.ejs',req.body.email,emailBody);
                    }else{
                        email_helper.send_email('Confirmation Email','./views/confirm_reset_email.ejs',req.body.email,emailBody);
                    }
                userResponse = {
                    exist: false,
                    msg:"Email has been sent to "+req.body.email+". Please verify account to proceed",
                    status: 'success',
                    user: user
                };
            }
            resolve(userResponse)
        });
    });
}

const emailExist = async (email) =>{
    const user = await Users.find({email : email}).select('-__v');
    return await user;
}