const { TenentPlates } = require('../models/tenent_plate_model');
const { Parkings } = require('../models/parking_model');
const moment = require('moment-timezone');
const { Users } = require('../models/users_model');
var mongoose = require('mongoose');
const { crypto_encrypt, jwt_encode } = require('../helpers/encrypt_helper');
const { Organizations } = require('../models/organizations_model');
var email_helper = require('../helpers/email_helper');
const constant = require('../lib/constant');
const { response } = require('express');
const { ExternalParkingConfig } = require('../models/external_parking_config_model');
const calculateHash = require('../helpers/calculate_hash');
const { EmailTemplates } = require('../models/email_template_model');
const { stringFormat } = require('../helpers/common_helper');
moment.tz.setDefault("America/New_York");

module.exports.addTenentPlate = async function(req,res){
    if(req.body.tenant_and_visitor){
        addUser(req).then((response) => {
            // console.log(response)
            if(response.status == 'success'){
                req.body.user = response.user._id;
                let body = {
                    user: response.user._id,
                    zone: req.body.zone,
                    city: req.body.city,
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
                const tenantPlates = new TenentPlates(body);
                tenantPlates.save().then(function () {
                    const parking = new Parkings(body);
                    parking.save().then(function () {
                        res.send({
                            status: 'success',
                            msg: 'plate_added_successfully'
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
    }else{
        req.body.plate = req.body.plate.toUpperCase();
        const tenent_plate = await TenentPlates.find(req.body).select('-__v');
        if(tenent_plate.length == 0){
            const plate = new TenentPlates(req.body);
            plate.save();
            res.send({
                status: 'success',
                msg: 'plate_added_successfully',
                response: plate
            });
        }else{
            res.send({
                status: 'error',
                msg: 'plate_already_exist'
            });
        }
    }
}

module.exports.getTenantPlates = async function(req,res){
    let body = {}
    let user = await Users.find({org: req.body.org_id}).select('-__v');
    if(user.length > 0){
        if(user[0].role !== 'root'){
            body['org'] = mongoose.Types.ObjectId(req.body.org_id);
        }
    }
    const plates = await TenentPlates.
    find(body).
    sort({_id: -1}).
    populate('zone').
    populate('user').
    populate('org');
    res.send(plates);
}

module.exports.delTenentPlate = async function (req, res){
    let tenantPlate = await TenentPlates.findOne({_id: req.body.id}).select('-__v').populate('parking').lean();
    if(tenantPlate.park_now && tenantPlate.parking){
        Parkings.findByIdAndUpdate(tenantPlate.parking._id, {to : moment().toDate()}, { new: true })
        .then(async () => {
            const plates = await TenentPlates.deleteOne({_id : req.body.id}).select('-__v');
            console.log(plates)
            const externalParkingConfig = await ExternalParkingConfig.findOne({ zone: tenantPlate.zone }).select('-__v');
            if (externalParkingConfig !== null && tenantPlate.parking.operation_id) {
                const axios = require("axios");
                const header = {
                    'Authorization': 'Basic ' + Buffer.from('integraTariffs:vuf`spnZlX').toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                };
                const cancel_url = 'https://ws-iparksuite.iparkme.com/TariffComputer.WS/TariffComputer.asmx/CancelParkingOperationJSON';
                let ipark_in = {
                    "ins_id": externalParkingConfig.blinkay_ins_id,
                    "ope_id": tenantPlate.parking.operation_id,
                    "ver": "1.0",
                    "prov": "CWP_APP",
                    "ah": ""
                }
                ipark_in.ah = calculateHash.ah(ipark_in)
                const body = "jsonIn=" + JSON.stringify({ ipark_in: ipark_in });
                axios.post(cancel_url, body, { headers: header })
                    .then(function (cancelResponse) {
                        console.log(cancelResponse.data)
                        res.send(plates);
                    })
            } else {
                res.send(plates);
            }
        })
    }else{
        const plates = await TenentPlates.deleteOne({_id : req.body.id}).select('-__v');
        res.send(plates);
    }
}

module.exports.editTenentPlate = async function (req, res){
    req.body.plate = req.body.plate.toUpperCase();
    TenentPlates.findByIdAndUpdate(req.body.id, req.body, {new: true})
    .then(response => {
        if(!response) {
            return res.status(404).json({
                msg: "Tenant Plate not found with id " + req.body.id
            });
        }
        if(req.body.user){
            Users.findByIdAndUpdate(req.body.user, req.body, {new: true})
            .then(response => {
                if(!response) {
                    return res.status(404).json({
                        msg: "User not found with id " + req.body.id
                    });
                }
                Parkings.deleteOne({user: req.body.user, plate: req.body.plate}, function(err, results) {
                    if (err){
                    throw err;
                    }
                });
                let body = {
                    ...req.body,
                    amount: 0,
                    service_fee: 0,
                    from: moment().format(),
                    to: moment().add(1,"months").format(),
                    parking_id: Math.floor(100000 + Math.random() * 900000)
                }
                const parking = new Parkings(body);
                parking.save().then(function () {
                    res.send({
                        status: 'success',
                        msg: 'plate_updated_successfully'
                    });
                }).catch(function (err) {
                    res.send(err);
                })
            }).catch(err => {
                if(err.kind === 'ObjectId') {
                    return res.status(404).json({
                        msg: "User not found with id " + req.body.id
                    });                
                }
                return res.status(500).json({
                    msg: "Error updating Data with id " + req.body._id
                });
            });
        }else{
            res.send(response)
        }
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
                let password = Math.random().toString(36).slice(2)
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
                const template = await EmailTemplates.findOne({
                                                    "org_id": req.body.org,
                                                    "template_name": "confirmation_and_temporary_password"
                                                }).select('-__v');
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