const { Parkings } = require('../models/parking_model');
const stripe = require("stripe")(process.env.SECRET_KEY);
var email_helper = require('../helpers/email_helper');

const moment = require('moment-timezone');
moment.tz.setDefault("America/New_York");

module.exports.buyParking = async function(req,res){
    if(req.body.amount == 0){
      req.body.from = moment(req.body.from, 'MMMM Do YYYY, hh:mm a' ).format()
      req.body.to = moment(req.body.to, 'MMMM Do YYYY, hh:mm a' ).format()
      req.body.parking_id = Math.floor(100000 + Math.random() * 900000)
      const parkings = new Parkings(req.body);
      parkings.save();
      res.send(parkings);
    }else{
      try {
        const payment = await stripe.paymentIntents.create({
          amount: parseFloat(req.body.amount)*100,
          currency: "CAD",
          description: "Your Company Description",
          payment_method: req.body.paymentMethod.id,
          confirm: true,
        });
        req.body.paymentMethod = payment.payment_method;
        req.body.from = moment(req.body.from, 'MMMM Do YYYY, hh:mm a' ).format()
        req.body.to = moment(req.body.to, 'MMMM Do YYYY, hh:mm a' ).format()
        req.body.parking_id = Math.floor(100000 + Math.random() * 900000)
        const parkings = new Parkings(req.body);
        parkings.save();
        res.send(parkings);
      } catch (error) {
        res.json({
          message: error,
          success: false,
        });
      }
    }
}

module.exports.getParkings = async function(req,res){
  try {
    let parkings = await Parkings.
    find().
    populate('city').
    populate('user').
    populate('zone');
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
    console.log(parkings)
    if(parkings.length > 0){
      let emailBody = {
        startDate : moment(parkings[0].from).format('ll'),
        startTime : moment(parkings[0].from).format('hh:mm a'),
        endDate : moment(parkings[0].to).format('ll'),
        endTime : moment(parkings[0].to).format('hh:mm a'),
        zone : parkings[0].zone.zone_name,
        city : parkings[0].city.city_name,
        rate : parkings[0].rate.rate_name,
        amount : parkings[0].amount,
        parking_id : parkings[0].parking_id,
        plate : parkings[0].plate,
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
    populate('city').
    populate('user').
    populate('rate').
    populate('zone');
    res.send(parkings);
  } catch (err) {
      res.status(500).json({ success: false, msg: err.message });
  }
}

module.exports.mobileParking = async function(req,res){
  if(req.body.amount == 0){
    req.body.from = moment(req.body.from, 'MMMM Do YYYY, hh:mm a' ).format()
    req.body.to = moment(req.body.to, 'MMMM Do YYYY, hh:mm a' ).format()
    req.body.parking_id = Math.floor(100000 + Math.random() * 900000)
    console.log(req.body)
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
      console.log(paymentMethod)
      try {
        const payment = await stripe.paymentIntents.create({
          amount: parseFloat(req.body.amount) * 100,
          currency: "CAD",
          description: "Your Company Description",
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
        res.json({
          message: error,
          success: false,
        });
      }
    } catch (e) {
      console.log(e)
    }
  }}