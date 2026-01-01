const { Parkings } = require('../models/parking_model');
const { Organizations } = require('../models/organizations_model');
const { Users } = require('../models/users_model');
const { Zones } = require('../models/zone_model');
const { crypto_decrypt, jwt_decode } = require('../helpers/encrypt_helper');
const calculateHash = require('../helpers/calculate_hash');
var email_helper = require('../helpers/email_helper');
var mongoose = require('mongoose');
const moment = require('moment-timezone');
const { ExternalParkingConfig } = require('../models/external_parking_config_model');
const { Ticket_Issued } = require('../models/ticket_issued_model');
const { TenentPlates } = require('../models/tenent_plate_model');
const { BusinessPlates } = require('../models/business_plate_model');
const { PlateParkingLimits } = require('../models/plate_parking_limit_model');
const { Cities } = require('../models/city_model');
const { Agent_Permissions } = require('../models/agent_permission_model');
const { KickOutPlates } = require('../models/kick_out_plates_model');
const { ResidantPlates } = require('../models/residant_plate_model');
const { filterQuery } = require('../helpers/search_helper');
const { Rates } = require('../models/rate_model');
const constant = require('../lib/constant');
const { EmailTemplates } = require('../models/email_template_model');
const { stringFormat } = require('../helpers/common_helper');
moment.tz.setDefault("America/New_York");
const CronJob = require('cron').CronJob;

const job = new CronJob('0 0 * * *', function(){
  // renewParking();
  renewBusinessParking();
})

job.start();

module.exports.buyParking = async function(req,res){
  let parkingsLeft;
    const city = await Cities.findOne({_id: req.body.city}).select('-__v');
    if(city.time_zone){
      console.log(city.time_zone)
      moment.tz.setDefault(city.time_zone);
    }else{
        moment.tz.setDefault("America/New_York");
    }
    req.body.plate = req.body.plate.replace(/\s+/g, '');

    const parking_limit_zone = await Zones.findOne({_id: req.body.zone, enable_parking_limit: true}).select('-__v');
    if(parking_limit_zone?.enable_parking_limit == true){
      let startParkingLimitDate = moment().startOf('year').format();
      let endParkingLimitDate = moment().endOf('year').format();
      if(parking_limit_zone.parking_limit_type == 'custom'){
        startParkingLimitDate = moment(parking_limit_zone.start_parking_limit_date).year(moment().format('YYYY')).format();
        endParkingLimitDate = moment(parking_limit_zone.end_parking_limit_date).year(moment().format('YYYY')).format();
        
        if(moment(parking_limit_zone.start_parking_limit_date).format('YYYY') < moment(parking_limit_zone.end_parking_limit_date).format('YYYY')){
          startParkingLimitDate = moment(startParkingLimitDate).subtract(1,"years").format();
        }
      }else if(parking_limit_zone.parking_limit_type == 'monthly'){
        startParkingLimitDate = moment().startOf('month').format();
        endParkingLimitDate = moment().endOf('month').format();
      }

      let parkings = await Parkings.find({
        $and: [
          {plate: req.body.plate},
          {rate: req.body.rate},
          {amount: 0},
          {
            from: {
              $gte: startParkingLimitDate,
              $lt: endParkingLimitDate
            }
          }
        ]
      }).select('-__v');

      let parkingLimit = parking_limit_zone.no_of_parking_per_plate;
      const isResetLimit = await PlateParkingLimits.findOne({zone: req.body.zone, plate: req.body.plate}).select('-__v');
      
      if(isResetLimit != null){
        parkingLimit = isResetLimit.no_of_parking_per_plate;
      }
      parkingsLeft = parkingLimit - parkings.length - 1;
      if(parkings.length >= parkingLimit){
        res.send({
          success: false,
          message: `parking_limit_exceed`,
        });
        return;
      }
      // let parkingPurchased = 0;
      // parkings.forEach(x=>{
      //   parkingPurchased += moment(x.to).diff(moment(x.from), 'minutes', true)
      // })

      // if(
      //   (parkingPurchased + moment(req.body.to, 'MMMM Do YYYY, hh:mm a' ).diff(moment(req.body.from, 'MMMM Do YYYY, hh:mm a' ), 'minutes', true))
      //   > parking_limit_zone.plate_limit){
      //   res.send({
      //     success: false,
      //     message: `Plate limit exceeds, ${parking_limit_zone.plate_limit - parkingPurchased} minutes left for this month`,
      //     parking: parkings,
      //     parkingPurchased:parkingPurchased
      //   });
      //   return;
      // }

    }

    const kickOutZone = await Zones.findOne({_id: req.body.zone, can_user_kick_out: true}).select('-__v');
    if(kickOutZone?.can_user_kick_out == true){
      let parkings = await Parkings.find({
        $and: [
          {from: {$lte: moment().toDate()}},
          {to: {$gte: moment().toDate()}},
          {zone: kickOutZone._id}
        ]
      }).select('-__v');
      if(parkings.length > 0){
        res.send({
          success: false,
          message: 'kickOutZone',
          parkings: parkings
        });
        return;
      }
    }

    const zone = await Zones.findOne({_id: req.body.zone}).select('-__v');
    const org = await Organizations.findOne({_id: req.body.org}).select('-__v');
    if(req.body.tenant_visitor_zone){
      let parking = await Parkings.find({
        $and: [
          {from: {$lte: new Date()}},
          {to: {$gte: new Date()}},
          {plate: req.body.plate}
        ]
      }).count();
      if(parking > 0){
        res.send({
          success: false,
          message: 'Visitor Pass already purchased with this plate'
        });
          return;
      }else{
        let count = await Parkings.find({
          $and: [
            {from: {$lte: new Date()}},
            {to: {$gte: new Date()}},
            {added_by: req.body.added_by}
          ]
        }).count();
        if(count >= req.body.no_of_visitors){
          res.send({
            success: false,
            message: 'You can only purchase '+req.body.no_of_visitors+' visitor passes at a time. Contact support to increase visitor passes'
          });
          return;
        }
      }
    }
    if(req.body.amount == 0 || org.payment_gateway == 'moneris'){
      req.body.from = moment(req.body.from, 'MMMM Do YYYY, hh:mm a' ).format()
      req.body.to = moment(req.body.to, 'MMMM Do YYYY, hh:mm a' ).format()
      req.body.parking_id = Math.floor(100000 + Math.random() * 900000);
      req.body.transaction_date = moment().format();    
      const parkings = new Parkings(req.body);
      parkings.save();
      let newParking = {...parkings._doc};
      if(parking_limit_zone && parking_limit_zone.enable_parking_limit){
        newParking.parkings_left = parkingsLeft;
      }
      externalParking(req.body,newParking,res);
    }else{
      let secret_key = crypto_decrypt(org.stripe_secret_key);
      const stripe = require("stripe")(secret_key);
      try {
        const payment = await stripe.paymentIntents.create({
          amount: parseFloat(req.body.amount),
          currency: "usd",
          description: req.body.plate + " is parked from " + req.body.from + " to " + req.body.to +" in "+zone.zone_name+", "+org.org_name,
          automatic_payment_methods: {
            enabled: true,
          }
        });
        const paymentIntent = await stripe.paymentIntents.confirm(
          payment.id,
          {
            payment_method: req.body.paymentMethod.id,
            return_url: 'https://bbits.solutions.com/zone'
          }
        );
        req.body.paymentMethod = req.body.paymentMethod.id;
        req.body.from = moment(req.body.from, 'MMMM Do YYYY, hh:mm a' ).format()
        req.body.to = moment(req.body.to, 'MMMM Do YYYY, hh:mm a' ).format()
        req.body.parking_id = Math.floor(100000 + Math.random() * 900000)
        req.body.transaction_date = moment().format();
        const parkings = new Parkings(req.body);
        parkings.save();
        let newParking = {...parkings._doc};
        // if(parking_limit_zone.enable_parking_limit){
        //   newParking.parkings_left = parkingsLeft;
        // }
        externalParking(req.body,newParking,res);
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

module.exports.buyVisitorPass = async function(req,res){
  const isExtensionAllowed = await Zones.findOne({_id: req.body.zone, enable_extension: true}).select('-__v');
  req.body.plate = req.body.plate.replace(/\s+/g, '');
  var start = new Date();
  start.setHours(0,0,0,0);

  var end = new Date();
  end.setHours(23,59,59,999);
  let parking = await Parkings.find({
    $and: [
      {from: {$gte: start, $lt: end}},
      {plate: req.body.plate},
      {zone: req.body.zone},
    ]
  });
  if(parking.length == 0 || (parking.length > 0 && isExtensionAllowed)){
    req.body.from = moment(req.body.from, 'MMMM Do YYYY, hh:mm a' ).format()
    req.body.to = moment(req.body.to, 'MMMM Do YYYY, hh:mm a' ).format()
    req.body.parking_id = Math.floor(100000 + Math.random() * 900000)
    if(req.body.parking){
      Parkings.findByIdAndUpdate(req.body.parking, {to: req.body.to}, {new: true})
      .then(response => {
          if(!response) {
              return res.status(404).json({
                  msg: "Data not found with id " + req.body.id
              });
          }
          externalParking(req.body,response,res);
      })
    }else{
      const parkings = new Parkings(req.body);
      parkings.save();
      externalParking(req.body,parkings,res);
    }
  }else{
    res.send({
      success: false,
      msg: 'Visitor Pass already purchased with this plate today'
    });
  }
}

module.exports.getParkings = async function(req,res){
  try {
    let body = {}
    let user = await Users.find({org: req.body.org}).select('-__v');
    if(user.length > 0 && user[0].role !== 'root'){
        body['org'] = mongoose.Types.ObjectId(req.body.org);
    }
    delete req.body.org;
    let parkings = [];
    let query = { ...req.body, ...body };
    if (req.query.pagination == 'false') {
      parkings = await Parkings.find(query).select('-__v');
    } else {
      let { page, pageSize, sort, sortBy, ...rest } = req.query;
      if (rest) query = { ...query, ...filterQuery(rest) };

      parkings = await Parkings.find(query)
        .collation({ locale: "en" })
        .sort({ [req.query.sortBy]: parseInt(req.query.sort) })
        .skip(req.query.page * req.query.pageSize)
        .limit(req.query.pageSize)
        .populate('city').
        populate('user').
        populate('zone').
        populate('org').
        populate('rate');
    }

    const count = await Parkings.countDocuments(query);

    return res.json({
      pagination: {
        total: count,
        page: parseInt(req.query.page),
        pageSize: parseInt(req.query.pageSize),
      },
      data: parkings
    });
    // parkings = await Parkings.
    // find({...req.body, ...body}).
    // sort({_id: -1}).
    // populate('city').
    // populate('user').
    // populate('zone').
    // populate('org').
    // populate('rate');
    // res.send(parkings);
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
    populate('org').
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
      if(parkings[0].org.sub_domain == 'root'){
        emailBody.path = constant.client_url;
      }else{
          emailBody.path = constant.http + parkings[0].org.sub_domain + '.' +constant.domain;
      }
      emailBody.logo = parkings[0].org.logo;
      emailBody.color = parkings[0].org.color;
      emailBody.sendingEmail = constant.email;
      emailBody.orgName = parkings[0].org.org_name;
      emailBody.API_URL = constant.API_URL;
      emailBody.COMPANY_NAME = constant.COMPANY_NAME;
      let email = req.body.email ? req.body.email : parkings[0].user?.email;
      let emailRes = await email_helper.send_email('Parking Receipt','./views/receipt.ejs',email,emailBody);
      res.send({
        sent: emailRes,
        msg:"Receipt is sent to "+email,
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
          currency: "usd",
          description: req.body.plate + " is parked from " + req.body.from + " to " + req.body.to,
          payment_method: paymentMethod.id,
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
  let body = {}
  let user = await Users.find({org: req.body.org_id}).select('-__v');
  if(user.length > 0 && user[0].role !== 'root'){
    body['org'] = mongoose.Types.ObjectId(req.body.org_id);
    body['city'] = mongoose.Types.ObjectId(req.body.city_id);
  }
  let parking = await Parkings.findOne({
    $and: [
      {
          $or: [
              {"plate": req.body.plate},
              {"plate_two": req.body.plate},
              {"plate_three": req.body.plate}
          ]
      },
      {from: {$lte: new Date()}},
      {to: {$gte: new Date()}},
      {city: req.body.city_id}
    ]  
  }).select('-__v');
  const ticket_issued = await Ticket_Issued.find({plate: req.body.plate}).
  populate('city').
  populate('zone').
  populate('parking').
  populate('ticket').
  populate('issued_by').
  select('-__v');
  let response = {};
  if(parking == null){
    
    parking = await Parkings.findOne({
      $and: [
        {
            $or: [
                {"plate": req.body.plate},
                {"plate_two": req.body.plate},
                {"plate_three": req.body.plate}
            ]
        },
        {to: {$gte: startDate, $lt: endDate}},
        {city: req.body.city_id}
      ] 
    }).select('-__v');
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
  if(ticket_issued.filter(x=> x.ticket_status == "unpaid").length >= 3){
    response.scofflaw = true
  }
  res.send(response);
}

const externalParking = async (parking,parkings,res) =>{
  const zone = await Zones.findById(parking.zone).select('-__v').populate('org').lean();
  if(zone.owner_email){
    const rate = await Rates.findById(parking.rate).select('-__v').lean();
    let emailBody = {
      startDate : moment(parking.from).format('ll hh:mm a'),
      endDate : moment(parking.to).format('ll hh:mm a'),
      zone : zone.zone_name,
      rate : rate.rate_name,
      amount : ((parseFloat(parking.amount)/100).toFixed(2) + ' $'),
      plate : parking.plate,
      day: moment(parking.from).format('dddd'),
    }
    if(zone.org.sub_domain == 'root'){
        emailBody.path = constant.client_url;
    }else{
        emailBody.path = constant.http + zone.org.sub_domain + '.' +constant.domain;
    }
    emailBody.logo = zone.org.logo;
    emailBody.color = zone.org.color;
    emailBody.sendingEmail = constant.email;
    emailBody.orgName = zone.org.org_name;
    emailBody.API_URL = constant.API_URL;
    emailBody.COMPANY_NAME = constant.COMPANY_NAME;
    const template = await EmailTemplates.findOne({
                        "org_id": zone.org._id,
                        "template_name": "parking_purchased"
                    }).select('-__v');
    if(template) {
        emailBody.content = stringFormat(template.template, emailBody);
        email_helper.send_email(template.subject,'./views/email_template.ejs',zone.owner_email,emailBody);
    }else{
      await email_helper.send_email('Parking Purchased','./views/parking_purchased.ejs',zone.owner_email,emailBody);
    }
  }
  const externalParkingConfig = await ExternalParkingConfig.findOne({zone: parking.zone}).select('-__v');
  if(externalParkingConfig !== null){
    var from = moment(parking.from)
    var to = moment(parking.to)
    var duration = moment.duration(to.diff(from));
    var minutes = duration.asMinutes();
    var parseString = require('xml2js').parseString;
    let ipark_in= {
      "ins_id": externalParkingConfig.blinkay_ins_id,
      "grp_id": externalParkingConfig.blinkay_group_id,
      "tar_id": externalParkingConfig.blinkay_tariff_id,
      "lic_pla": parking.plate,
      "pur_date": moment(from).format('HHmmssDDMMYYYY'),
      "ini_date": moment(from).format('HHmmssDDMMYYYY'),
      "end_date": moment(to).format('HHmmssDDMMYYYY'),
      "amou_payed": parseFloat(parking.amount),
      "time_payed": minutes,
      "oper_id": "CWP_APP",
      "ext_acc": "VPP",
      "term_id": "",
      "ver": "1.0",
      "prov": "CWP_APP",
      "ah": ""
    }
    ipark_in.ah = calculateHash.ah(ipark_in)
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
        if(jsonResult.ipark_out.r == 1){
          Parkings.findByIdAndUpdate(parkings._id, { operation_id: jsonResult.ipark_out.oper_id }, { new: true })
          .then(response => {
              if (!response) {
                  return res.status(404).json({
                      msg: "Data not found with id " + req.body.id
                  });
              }
              res.send(parkings);
          }).catch(err => {
              if (err.kind === 'ObjectId') {
                  return res.status(404).json({
                      msg: "Data not found with id " + req.body.id
                  });
              }
              return res.status(500).json({
                  msg: "Error updating Data with id " + req.body.id
              });
          });
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
    res.send(parkings);
  }
}

module.exports.renewTenantParking = async function (req, res){
  res.json(renewParking());
}

const renewParking = async() => {
  const plates = await TenentPlates.find().select('plate');
  var allPlates = await plates.map(function (obj) {
    return obj.plate;
  });
  const expiredParkings = await Parkings.find({plate: { $in: allPlates }, to: {$lte: new Date()}}).select('plate');
  if(expiredParkings.length > 0){
    var expiredPlates = expiredParkings.map(function (obj) {
      return obj.plate;
    });
    Parkings.updateMany(
    {plate: { $in: expiredPlates }},
    {"$set":{from: moment().format(), to: moment().add(1,"months").format()}})
    .then(response => {
      console.log(response)
      return response;
    })
  }
}

module.exports.residantParking = async function (req, res){
  res.send(renewResidantParking());
}

const renewResidantParking = async() => {
  const plates = await ResidantPlates.find().select('plate');
  var allPlates = [];
  await plates.map(function (obj) {
    if(obj.plate){
      allPlates.push(obj.plate);
    }
  });
  const expiredParkings = await Parkings.find({plate: { $in: allPlates }, to: {$lte: new Date()}}).select('plate');
  if(expiredParkings.length > 0){
    var expiredPlates = expiredParkings.map(function (obj) {
      return obj.plate;
    });
    Parkings.updateMany(
    {plate: { $in: expiredPlates }},
    {"$set":{from: moment().format(), to: moment().add(1,"months").format()}})
    .then(response => {
      return response;
    })
  }
}

const renewBusinessParking = async() => {
  const plates = await BusinessPlates.find().select('plate');
  var allPlates = await plates.map(function (obj) {
    return obj.plate;
  });
  console.log(allPlates)
  const expiredParkings = await Parkings.find({plate: { $in: allPlates }, to: {$lte: new Date()}}).select('plate');
  if(expiredParkings.length > 0){
    var expiredPlates = expiredParkings.map(function (obj) {
      return obj.plate;
    });
    Parkings.updateMany(
    {plate: { $in: expiredPlates }},
    {"$set":{from: moment().format(), to: moment().add(1,"months").format()}})
    .then(response => {
      console.log(response)
      return response;
    })
  }
}

module.exports.getParkingsByCity = async function (req, res){
  let startDate = moment().toDate();
  startDate.setHours(0);
  startDate.setMinutes(0);
  let endDate = moment().toDate();
  endDate.setHours(23);
  endDate.setMinutes(59);
  let parkings = await Parkings.find({
    $or: [
      {
        $and: [
          {from: {$lte: new Date()}},
          {to: {$gte: new Date()}},
          {city: req.body.city_id}
        ] 
      },
      {
        $and: [
          {to: {$gte: startDate, $lt: endDate}},
          {city: req.body.city_id}
        ] 
      },
    ]  
     
  }).
  populate('zone').
  select('-__v');
  res.send(parkings);
}

module.exports.parkingPlates = async function (req, res){
    const data = jwt_decode(req.body.token);
    if(data.expiredAt == undefined && data.id){
      const agent_permissions = await Agent_Permissions.
      findOne({ user: data.id }).
      select('cities');
      if(agent_permissions){
        let parkings = await Parkings.find({
          $and: [
            {to: {$gte: req.body.startDate, $lte: req.body.endDate}},
            {city: { $in: agent_permissions.cities }}
          ]  
        }).
        populate('zone', 'zone_name').
        select('-__v');
        res.send(parkings);
      }else{
        return res.send({status: 403, msg: 'Unauthorized, Please login again'});
      }
    }else{
        return res.send({status: 403, msg: 'Unauthorized, Please login again'});
    }
}

module.exports.activeParkingPlates = async function (req, res){
  const data = jwt_decode(req.body.token);
  if(data.expiredAt == undefined){
    const agent_permissions = await Agent_Permissions.
    findOne({ user: data.id }).
    select('cities');
    if(agent_permissions){
      let parkings = await Parkings.find({
        $and: [
          {to: {$gte: new Date()}},
          {city: { $in: agent_permissions.cities }}
        ]  
      }).
      populate('zone', 'zone_name').
      select('-__v');
      res.send(parkings);
    }else{
      return res.send({status: 403, msg: 'Unauthorized, Please login again'});
    }
  }else{
      return res.send({status: 403, msg: 'Unauthorized, Please login again'});
  }
}

module.exports.kickOutPlate = async function (req, res){
  const city = await Cities.findOne({_id: req.body.city}).select('-__v');
  if(city.time_zone){
    moment.tz.setDefault(city.time_zone);
  }else{
      moment.tz.setDefault("America/New_York");
  }
  Parkings.findByIdAndUpdate(req.body.parking, {to : moment().toDate()}, {new: true})
  .then(async (response) => {
      if(!response) {
          return res.status(404).json({
              msg: "Data not found with id " + req.body.id
          });
      }
      const plate = await new KickOutPlates(req.body);
      plate.save().then(()=>{
        res.send({
          status: 'success',
          msg: 'plate_kickout_purchase_now',
          parking: response
        });
      });
  })
}

module.exports.exitParking = async function(req,res){
  Parkings.findOneAndUpdate(
    { plate : req.body.plate, zone : req.body.zone, to: {$gte: new Date()} },
    { $set: { to : moment().toDate() } },
    { returnOriginal: false }
 ).then(async (result) => {
    if(result){
      const externalParkingConfig = await ExternalParkingConfig.findOne({ zone: req.body.zone }).select('-__v');
      if (externalParkingConfig !== null && result.operation_id) {
          const axios = require("axios");
          const header = {
              'Authorization': 'Basic ' + Buffer.from('integraTariffs:vuf`spnZlX').toString('base64'),
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          };
          const cancel_url = 'https://ws-iparksuite.iparkme.com/TariffComputer.WS/TariffComputer.asmx/CancelParkingOperationJSON';
          let ipark_in = {
              "ins_id": externalParkingConfig.blinkay_ins_id,
              "ope_id": result.operation_id,
              "ver": "1.0",
              "prov": "CWP_APP",
              "ah": ""
          }
          ipark_in.ah = calculateHash.ah(ipark_in)
          const body = "jsonIn=" + JSON.stringify({ ipark_in: ipark_in });
          axios.post(cancel_url, body, { headers: header })
              .then(function (cancelResponse) {
                  console.log(cancelResponse.data)
                  res.send({
                    status: 'success',
                    msg: 'session_end'
                  });
              })
      } else {
        res.send({
          status: 'success',
          msg: 'session_end'
        });
      }
    } else
      res.send({
        status: 'error',
        msg: 'no_vehicle_parked'
      });
  })
}

module.exports.testExternalParking = async function (req, res) {
  var from = moment(req.body.from, "MMMM Do YYYY, h:mm:ss a");
  var to = moment(req.body.to, "MMMM Do YYYY, h:mm:ss a");
  var duration = moment.duration(to.diff(from));
  var minutes = duration.asMinutes();
  var parseString = require('xml2js').parseString;
  let ipark_in = {
    "ins_id": req.body.blinkay_ins_id,
    "grp_id": req.body.blinkay_group_id,
    "tar_id": req.body.blinkay_tariff_id,
    "lic_pla": req.body.plate,
    "pur_date": moment(from).format('HHmmssDDMMYYYY'),
    "ini_date": moment(from).format('HHmmssDDMMYYYY'),
    "end_date": moment(to).format('HHmmssDDMMYYYY'),
    "amou_payed": req.body.amount,
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
  const body = "jsonIn=" + JSON.stringify({ ipark_in: ipark_in });
  let header = {
    'Authorization': 'Basic ' + Buffer.from('integraTariffs:vuf`spnZlX').toString('base64'),
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  }
  const axios = require("axios");
  axios.post('https://ws-iparksuite.iparkme.com/TariffComputer.WS/TariffComputer.asmx/InsertExternalParkingOperationInstallationTimeJSON',
    body,
    { headers: header })
    .then(function (response) {
      let jsonResult;
      parseString(response.data, function (err, res) {
        jsonResult = JSON.parse(res.string._)
      });
      console.log(jsonResult)
      if (jsonResult.ipark_out.r == 1) {
        res.send(jsonResult)
      } else {
        res.json({
          message: 'System error. Contact Support',
          status: 'error',
        });
      }
    })
    .catch(function (error) {
      console.log(error);
    });
}

module.exports.editParkingPlate = async function (req, res) {
  const parking = await Parkings.findById(req.body.parking_id).
  populate('zone').
  select('-__v');
  if(parking.zone.is_plate_editable && parking.zone.no_of_times_plate_can_edit > parking.no_of_times_plate_edited){
    const externalParkingConfig = await ExternalParkingConfig.findOne({ zone: parking.zone._id }).select('-__v');
    if (externalParkingConfig !== null) {
      var parseString = require('xml2js').parseString;
      const axios = require("axios");
      const header = {
          'Authorization': 'Basic ' + Buffer.from('integraTariffs:vuf`spnZlX').toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      };
      const cancel_url = 'https://ws-iparksuite.iparkme.com/TariffComputer.WS/TariffComputer.asmx/CancelParkingOperationJSON';
      const insert_url = 'https://ws-iparksuite.iparkme.com/TariffComputer.WS/TariffComputer.asmx/InsertExternalParkingOperationInstallationTimeJSON'
      var from = moment(parking.from)
      var to = moment(parking.to)
      var duration = moment.duration(to.diff(from));
      var minutes = duration.asMinutes();
      let insert_ipark_in = {
          "ins_id": externalParkingConfig.blinkay_ins_id,
          "grp_id": externalParkingConfig.blinkay_group_id,
          "tar_id": externalParkingConfig.blinkay_tariff_id,
          "lic_pla": req.body.plate,
          "pur_date": moment(from).format('HHmmssDDMMYYYY'),
          "ini_date": moment(from).format('HHmmssDDMMYYYY'),
          "end_date": moment(to).format('HHmmssDDMMYYYY'),
          "amou_payed": parseFloat(parking.amount),
          "time_payed": minutes,
          "oper_id": "CWP_APP",
          "ext_acc": "VPP",
          "term_id": "",
          "ver": "1.0",
          "prov": "CWP_APP",
          "ah": ""
      }
      insert_ipark_in.ah = calculateHash.ah(insert_ipark_in)
      const insert_body = "jsonIn=" + JSON.stringify({ ipark_in: insert_ipark_in });
      axios.post(insert_url,
          insert_body,
          { headers: header })
          .then(function (response) {
              let jsonResult;
              parseString(response.data, function (err, res) {
                  jsonResult = JSON.parse(res.string._)
              });

              if (jsonResult.ipark_out.r == 1) {
                console.log(jsonResult)
                Parkings.findByIdAndUpdate(parking._id, { operation_id: jsonResult.ipark_out.oper_id, plate: req.body.plate, no_of_times_plate_edited: (parking.no_of_times_plate_edited + 1) }, { new: true })
                  .then(response => {
                      if (!response) {
                          return res.status(404).json({
                              msg: "Data not found with id " + req.body.id
                          });
                      }
                    let ipark_in = {
                        "ins_id": externalParkingConfig.blinkay_ins_id,
                        "ope_id": parking.operation_id,
                        "ver": "1.0",
                        "prov": "CWP_APP",
                        "ah": ""
                    }
                    ipark_in.ah = calculateHash.ah(ipark_in)
                    const body = "jsonIn=" + JSON.stringify({ ipark_in: ipark_in });
                    axios.post(cancel_url, body, { headers: header })
                        .then(function (cancelResponse) {
                            let jsonResult;
                            parseString(cancelResponse.data, function (err, res) {
                                jsonResult = JSON.parse(res.string._)
                            });
                            console.log(jsonResult)
                            if (jsonResult.ipark_out.r == 1) {
                                res.send(response)
                            } else {
                                res.json({
                                    message: 'System error. Contact Support',
                                    status: 'b_error',
                                });
                            }
                        })
                    })
                  } else {
                      res.json({
                          message: 'System error. Contact Support',
                          status: 'error',
                      });
                  }
          })
    }else{
      Parkings.findByIdAndUpdate(parking._id, {plate: req.body.plate, no_of_times_plate_edited: (parking.no_of_times_plate_edited + 1) }, { new: true })
        .then(async (response) => {
            if (!response) {
                res.json({
                  message: 'plate_edit_limit_exceeds',
                  status: 'error',
                });
            }
            res.send(response)
        })
    }
  }else{
    res.json({
      message: 'plate_edit_limit_exceeds',
      status: 'error',
    });
  }
}

module.exports.parking_available = async function (req, res) {
  const city = await Cities.findOne({ _id: req.body.city }).select('-__v');
  if (city.time_zone) {
    moment.tz.setDefault(city.time_zone);
  } else {
    moment.tz.setDefault("America/New_York");
  }
  req.body.plate = req.body.plate.replace(/\s+/g, '');

  const parking_limit_zone = await Zones.findOne({ _id: req.body.zone, enable_parking_limit: true }).select('-__v');
  if (parking_limit_zone?.enable_parking_limit == true) {
    let startParkingLimitDate = moment().startOf('year').format();
    let endParkingLimitDate = moment().endOf('year').format();
    if (parking_limit_zone.parking_limit_type == 'custom') {
      startParkingLimitDate = moment(parking_limit_zone.start_parking_limit_date).year(moment().format('YYYY')).format();
      endParkingLimitDate = moment(parking_limit_zone.end_parking_limit_date).year(moment().format('YYYY')).format();

      if (moment(parking_limit_zone.start_parking_limit_date).format('YYYY') < moment(parking_limit_zone.end_parking_limit_date).format('YYYY')) {
        startParkingLimitDate = moment(startParkingLimitDate).subtract(1, "years").format();
      }
    } else if (parking_limit_zone.parking_limit_type == 'monthly') {
      startParkingLimitDate = moment().startOf('month').format();
      endParkingLimitDate = moment().endOf('month').format();
    }

    let parkings = await Parkings.find({
      $and: [
        { plate: req.body.plate },
        { rate: req.body.rate },
        { amount: 0 },
        {
          from: {
            $gte: startParkingLimitDate,
            $lt: endParkingLimitDate
          }
        }
      ]
    }).select('-__v');

    let parkingLimit = parking_limit_zone.no_of_parking_per_plate;
    const isResetLimit = await PlateParkingLimits.findOne({ zone: req.body.zone, plate: req.body.plate }).select('-__v');

    if (isResetLimit != null) {
      parkingLimit = isResetLimit.no_of_parking_per_plate;
    }
    let parkingsLeft;
    parkingsLeft = parkingLimit - parkings.length - 1;
    if (parkings.length >= parkingLimit) {
      res.send({
        success: false,
        message: `parking_limit_exceed`,
      });
      return;
    }
  }

  if (req.body.tenant_visitor_zone) {
    let parking = await Parkings.find({
      $and: [
        { from: { $lte: new Date() } },
        { to: { $gte: new Date() } },
        { plate: req.body.plate }
      ]
    }).count();
    if (parking > 0) {
      res.send({
        success: false,
        message: 'Visitor Pass already purchased with this plate'
      });
      return;
    } else {
      let count = await Parkings.find({
        $and: [
          { from: { $lte: new Date() } },
          { to: { $gte: new Date() } },
          { added_by: req.body.added_by }
        ]
      }).count();
      if (count >= req.body.no_of_visitors) {
        res.send({
          success: false,
          message: 'You can only purchase ' + req.body.no_of_visitors + ' visitor passes at a time. Contact support to increase visitor passes'
        });
        return;
      }
    }
  }

  res.send({
    success: true,
    message: 'parking_available'
  });
}

module.exports.park_vehicle = async function (req, res) {
  const city = await Cities.findOne({ _id: req.body.city }).select('-__v');
  if (city.time_zone) {
    moment.tz.setDefault(city.time_zone);
  } else {
    moment.tz.setDefault("America/New_York");
  }
  req.body.plate = req.body.plate.replace(/\s+/g, '');
  req.body.from = moment(req.body.from, 'MMMM Do YYYY, hh:mm a').format()
  req.body.to = moment(req.body.to, 'MMMM Do YYYY, hh:mm a').format()
  req.body.parking_id = Math.floor(100000 + Math.random() * 900000)
  if (req.body.parking) {
    Parkings.findByIdAndUpdate(req.body.parking, { to: req.body.to }, { new: true })
      .then(response => {
        if (!response) {
          return res.status(404).json({
            msg: "Data not found with id " + req.body.id
          });
        }
        externalParking(req.body, response, res);
      })
  } else {
    const parkings = new Parkings(req.body);
    parkings.save();
    const parking_limit_zone = await Zones.findOne({ _id: req.body.zone, enable_parking_limit: true }).select('-__v');
    let newParking = { ...parkings._doc };
    if (parking_limit_zone && parking_limit_zone.enable_parking_limit) {
      let parkingLimit = parking_limit_zone.no_of_parking_per_plate;
      const isResetLimit = await PlateParkingLimits.findOne({ zone: req.body.zone, plate: req.body.plate }).select('-__v');

      if (isResetLimit != null) {
        parkingLimit = isResetLimit.no_of_parking_per_plate;
      }
      newParking.parkings_left = parkingLimit - parkings.length - 1;
    }
    externalParking(req.body, newParking, res);
  }
}