const { Parkings } = require('../models/parking_model');
const { Organizations } = require('../models/organizations_model');
const { Users } = require('../models/users_model');
const { Zones } = require('../models/zone_model');
const { crypto_decrypt } = require('../helpers/encrypt_helper');
const calculateHash = require('../helpers/calculate_hash');
var email_helper = require('../helpers/email_helper');
var mongoose = require('mongoose');
const moment = require('moment-timezone');
const { ExternalParkingConfig } = require('../models/external_parking_config_model');
const { Ticket_Issued } = require('../models/ticket_issued_model');
moment.tz.setDefault("America/New_York");

module.exports.buyParking = async function(req,res){
    const org = await Organizations.findOne({_id: req.body.org}).select('-__v');
    if(req.body.amount == 0 || org.payment_gateway == 'moneris'){
      req.body.from = moment(req.body.from, 'MMMM Do YYYY, hh:mm a' ).format()
      req.body.to = moment(req.body.to, 'MMMM Do YYYY, hh:mm a' ).format()
      req.body.parking_id = Math.floor(100000 + Math.random() * 900000)
      const parkings = new Parkings(req.body);
      externalParking(req.body,parkings,res);
    }else{
      let secret_key = crypto_decrypt(org.stripe_secret_key);
      const stripe = require("stripe")(secret_key);
      try {
        const payment = await stripe.paymentIntents.create({
          amount: parseFloat(req.body.amount),
          currency: "CAD",
          description: req.body.plate + " is parked from " + req.body.from + " to " + req.body.to,
          payment_method: req.body.paymentMethod.id,
          confirm: true,
        });
        req.body.paymentMethod = payment.payment_method;
        req.body.from = moment(req.body.from, 'MMMM Do YYYY, hh:mm a' ).format()
        req.body.to = moment(req.body.to, 'MMMM Do YYYY, hh:mm a' ).format()
        req.body.parking_id = Math.floor(100000 + Math.random() * 900000)
        const parkings = new Parkings(req.body);
        externalParking(req.body,parkings,res);
      } catch (e) {
        switch (e.type) {
          case 'StripeCardError':
            res.json({
              message: e.message,
              status: 'error',
            });
            break;
          case 'StripeInvalidRequestError':
            res.json({
              message: 'An invalid request occurred.',
              status: 'error',
            });
            break;
          default:
            res.json({
              message: 'Another problem occurred, maybe unrelated to Stripe.',
              status: 'error',
            });
            break;
        }
      }
      
    }
}

module.exports.getParkings = async function(req,res){
  try {
    console.log(req.body)
    let body = {}
    let user = await Users.find({org: req.body.org}).select('-__v');
    if(user.length > 0 && user[0].role !== 'root'){
        body['org'] = mongoose.Types.ObjectId(req.body.org);
    }
    delete req.body.org;
    let parkings = await Parkings.
    find({...req.body, ...body}).
    sort({_id: -1}).
    populate('city').
    populate('user').
    populate('zone').
    populate('org').
    populate('rate');
    res.send(parkings);
  } catch (err) {
      res.status(500).json({ success: false, msg: err.message });
  }
}

module.exports.emailReciept = async function(req,res){
  try {
    let parkings = await Parkings.
    find({_id: req.body.parking_id}).
    populate('city').
    populate('user').
    populate('rate').
    populate('zone');
    if(parkings.length > 0){
      let emailBody = {
        startDate : moment(parkings[0].from).format('ll'),
        startTime : moment(parkings[0].from).format('hh:mm a'),
        endDate : moment(parkings[0].to).format('ll'),
        endTime : moment(parkings[0].to).format('hh:mm a'),
        zone : parkings[0].zone.zone_name,
        city : parkings[0].city.city_name,
        rate : parkings[0].rate.rate_name,
        amount : parseFloat(parkings[0].amount)/100,
        parking_id : parkings[0].parking_id,
        plate : parkings[0].plate,
        service_fee : parseFloat(parkings[0].service_fee)/100,
      }
      let emailRes = await email_helper.send_email('Parking Receipt','./views/receipt.ejs',parkings[0].user.email,emailBody);
      res.send({
        sent: emailRes,
        msg:"Receipt is sent to "+parkings[0].user.email,
        status: 'success'
      });
    }else{
      res.send({
        sent: 0,
        msg:"Parking not found",
        status: 'error'
      });
    }
  } catch (err) {
      res.status(500).json({ success: false, msg: err.message, status: 'error' });
  }
}

module.exports.getUserHistory = async function(req,res){
  try {
    let parkings = await Parkings.
    find({user: req.body.user_id}).
    sort({_id: -1}).
    populate('city').
    populate('user').
    populate('rate').
    populate('zone');
    res.send(parkings);
  } catch (err) {
      res.status(500).json({ success: false, msg: err.message });
  }
}

module.exports.getCurrentParking = async function(req,res){
  try {
    let parkings = await Parkings.
    find({
      $and: [
        {
          from: {
            $lte: new Date()
          }
        },
        {
          to: {
            $gte: new Date()
          }
        },
        {
          user: req.body.user_id
        }
      ]
    }).
    sort({_id: -1}).
    populate('city').
    populate('user').
    populate('zone').
    populate('rate');
    res.send(parkings);
  } catch (err) {
      res.status(500).json({ success: false, msg: err.message });
  }
}

module.exports.getCurrentParkingsByPlate = async function(req,res){
  try {
    let parkings = await Parkings.
    find({
      $and: [
        {
          from: {
            $lte: new Date()
          }
        },
        {
          to: {
            $gte: new Date()
          }
        },
        {
          plate: { $in: req.body.plates }
        }
      ]
    }).
    sort({_id: -1}).
    populate('city').
    populate('user').
    populate('zone').
    populate('rate');
    res.send(parkings);
  } catch (err) {
      res.status(500).json({ success: false, msg: err.message });
  }
}

module.exports.editParking = async function (req, res){
  Parkings.findByIdAndUpdate(req.body.id, req.body, {new: true})
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
}

module.exports.delAllParkings = async function (req, res){
  const parkings = await Parkings.deleteMany({});
  res.send(parkings);
}

module.exports.mobileParking = async function(req,res){
  if(req.body.amount === 0){
    req.body.from = moment(req.body.from, 'MMMM Do YYYY, hh:mm a' ).format()
    req.body.to = moment(req.body.to, 'MMMM Do YYYY, hh:mm a' ).format()
    req.body.parking_id = Math.floor(100000 + Math.random() * 900000)
    const parkings = new Parkings(req.body);
    parkings.save();
    res.send(parkings);
  }else {
    try {
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: req.body.cardNum,
          exp_month: req.body.expMonth,
          exp_year: req.body.expYear,
          cvc: req.body.cvv,
        },
      });
      try {
        const payment = await stripe.paymentIntents.create({
          amount: parseFloat(req.body.amount) * 100,
          currency: "CAD",
          description: req.body.plate + " is parked from " + req.body.from + " to " + req.body.to,
          payment_method: paymentMethod.id,
          confirm: true,
        });
        req.body.paymentMethod = payment.payment_method;
        req.body.from = moment(req.body.from, 'MMMM Do YYYY, hh:mm a' ).format()
        req.body.to = moment(req.body.to, 'MMMM Do YYYY, hh:mm a' ).format()
        req.body.parking_id = Math.floor(100000 + Math.random() * 900000)
        console.log(req.body)
        const parkings = new Parkings(req.body);
        parkings.save();
        res.send(parkings);
      } catch (error) {
        if (error.type === 'StripeCardError') {
          if (error.payment_intent.charges.data[0].outcome.type === 'blocked') {
            res.json({
              message: 'Payment blocked for suspected fraud.',
              success: false,
            });
          } else if (error.code === 'card_declined') {
            res.json({
              message: 'Payment declined by the issuer.',
              success: false,
            });
          } else if (error.code === 'expired_card') {
            res.json({
              message: 'Card expired.',
              success: false,
            });
          } else {
            res.json({
              message: 'Other card error.',
              success: false,
            });
          }
        } else if (error.type === 'StripeInvalidRequestError') {
          res.json({
            message: 'An invalid request occurred.',
            success: false,
          })
        } else {
          res.json({
            message: 'Another problem occurred, maybe unrelated to Stripe.',
            success: false,
          });
        }
      }
    } catch (e) {
      console.log(e)
      res.send(e)
    }
  }
}

module.exports.getParkingStatus = async function (req, res){
  let startDate = moment().toDate();
  startDate.setHours(0);
  startDate.setMinutes(0);
  let endDate = moment().toDate();
  endDate.setHours(23);
  endDate.setMinutes(59);
  let body = {plate: req.body.plate}
  let user = await Users.find({org: req.body.org_id}).select('-__v');
  if(user.length > 0 && user[0].role !== 'root'){
    body['org'] = mongoose.Types.ObjectId(req.body.org_id);
    body['city'] = mongoose.Types.ObjectId(req.body.city_id);
  }
  let parking = await Parkings.findOne({...{from: {$lte: new Date()},to: {$gte: new Date()}}, ...body}).select('-__v');
  const ticket_issued = await Ticket_Issued.find({plate: req.body.plate, ticket_status: "unpaid"}).
  populate('city').
  populate('zone').
  populate('parking').
  populate('ticket').
  populate('issued_by').
  select('-__v');
  let response = {};
  if(parking == null){
    parking = await Parkings.findOne({...{to: {$gte: startDate, $lt: endDate}}, ...body}).select('-__v');
    if(parking == null){
      response.status = 'unpaid';
      response.plate = req.body.plate;
    }else{
      response = parking.toObject();
      response.status = 'expired';
      response.from = moment(response.from).format('MMMM Do YYYY, hh:mm a');
      response.to = moment(response.to).format('MMMM Do YYYY, hh:mm a');
    }
  }else{
    response = parking.toObject();
    response.status = 'paid';
    response.from = moment(response.from).format('MMMM Do YYYY, hh:mm a');
    response.to = moment(response.to).format('MMMM Do YYYY, hh:mm a');
  }
  if(ticket_issued.length > 0){
    response.ticket_issued = ticket_issued
  }
  if(ticket_issued.length >= 3){
    response.scofflaw = true
  }
  res.send(response);
}

const externalParking = async (parking,parkings,res) =>{
  console.log(parking, 'body');
  const externalParkingConfig = await ExternalParkingConfig.findOne({zone: parking.zone}).select('-__v');
  if(externalParkingConfig !== null){
    var from = moment(parking.from)
    var to = moment(parking.to)
    var duration = moment.duration(to.diff(from));
    var minutes = duration.asMinutes();
    console.log(minutes, 'minutes');
    var parseString = require('xml2js').parseString;
    let ipark_in= {
      "ins_id": externalParkingConfig.blinkay_ins_id,
      "grp_id": externalParkingConfig.blinkay_group_id,
      "tar_id": externalParkingConfig.blinkay_tariff_id,
      "lic_pla": parking.plate,
      "pur_date": moment(from).format('HHmmssDDMMYYYY'),
      "ini_date": moment(from).format('HHmmssDDMMYYYY'),
      "end_date": moment(to).format('HHmmssDDMMYYYY'),
      "amou_payed": 0,
      "time_payed": minutes,
      "oper_id": "CWP_APP",
      "ext_acc": "VPP",
      "term_id": "",
      "ver": "1.0",
      "prov": "CWP_APP",
      "ah": ""
    }
    ipark_in.ah = calculateHash.ah(ipark_in)
    console.log(ipark_in, 'ipark_in');
    const body = "jsonIn="+JSON.stringify({ipark_in: ipark_in});
    let header = {
        'Authorization': 'Basic '+Buffer.from('integraTariffs:vuf`spnZlX').toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      } 
    const axios = require("axios");
    axios.post('https://ws-iparksuite.iparkme.com/TariffComputer.WS/TariffComputer.asmx/InsertExternalParkingOperationInstallationTimeJSON', 
        body,
        {headers: header})
      .then(function (response) {
        let jsonResult;
        parseString(response.data, function (err, res){
            jsonResult = JSON.parse(res.string._)                    
        });
        console.log(jsonResult)
        if(jsonResult.ipark_out.r == 1){
          parkings.save();
          res.send(parkings)
        }else{
          res.json({
            message: 'System error. Contact Support',
            status: 'error',
          });
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  }else{
    parkings.save();
    res.send(parkings);
  }
}