const { Rates } = require('../models/rate_model');
const { RateTypes } = require('../models/rate_type_model');
const { RateSteps } = require('../models/rate_steps_model');
const { BusinessPlates } = require('../models/business_plate_model');
const { Parkings } = require('../models/parking_model');

const moment = require('moment-timezone');
// moment.tz.setDefault("America/New_York");

var current_time = moment().format();
let now = moment(current_time).format("L");

module.exports.getRateById = async function (req, res){
    const parkings = await Parkings.find({
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
            plate: req.body.plate
          }
        ]
      })
    if(parkings.length == 0){
        const rates = await Rates.find({zone_id : req.body.id, qr_code: false}).select('-__v');
        res.send(rates);
    }else{
        res.send({
            success: false,
            msg: 'Parking is already purchased, Please purchase again after '+
            moment(parkings[0].to).format("MMMM Do YYYY, hh:mm a")
        });
    }
}

module.exports.getQRRateById = async function (req, res){
    if(req.body.zone_type == 2){
        let startDate = moment().toDate();
        startDate.setHours(6);
        startDate.setMinutes(0);
        let endDate = moment().toDate();
        endDate.setHours(18);
        endDate.setMinutes(0);
        console.log(moment(startDate).format())
        console.log(moment(endDate).format())
        console.log(moment().format())
        if(moment().format() <= moment(endDate).format() && moment().format() >= moment(startDate).format()){
            const parkings = await Parkings.find({
                $and: [
                    {
                        from: {$gte: startDate}
                    },
                    {
                        to: {$lte: endDate}
                    },
                    {
                        plate: req.body.plate
                    }
                ]
            })
            if(parkings.length == 0){
                const rates = await Rates.find({zone_id : req.body.id, qr_code: true}).select('-__v');
                res.send(rates);
            }else{
                res.send({
                    success: false,
                    msg: 'Free parking purchased today, Parking not allowed except for Scotia Bank Customers'
                });
            }
        }else{
            const parkings = await Parkings.find({
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
                    plate: req.body.plate
                  }
                ]
              })
            if(parkings.length == 0){
                const rates = await Rates.find({zone_id : req.body.id, qr_code: false}).select('-__v');
                res.send(rates);
            }else{
                res.send({
                    success: false,
                    msg: 'Parking is already purchased, Please purchase again after '+
                    moment(parkings[0].to).format("MMMM Do YYYY, hh:mm a")
                });
            }
        }
    }else{
        const parkings = await Parkings.find({
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
                plate: req.body.plate
              }
            ]
          })
          console.log(parkings);
        if(parkings.length == 0){
            const rates = await Rates.find({zone_id : req.body.id, qr_code: false}).select('-__v');
            res.send(rates);
        }else{
            res.send({
                success: false,
                msg: 'Parking is already purchased, Please purchase again after '+
                moment(parkings[0].to).format("MMMM Do YYYY, hh:mm a")
            });
        }
    }
}

module.exports.getRates = async function (req, res){
    const rates = await Rates.find().select('-__v');
    res.send(rates);
}

module.exports.addRate = function(req,res){
    const rate = new Rates(req.body);
    rate.save();
    res.send(rate);
}

module.exports.editRate = async function (req, res){
    Rates.findByIdAndUpdate(req.body.id, req.body, {new: true})
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

module.exports.delRate = async function (req, res){
    const rate = await Rates.deleteOne({_id : req.body.id}).select('-__v');
    res.send(rate);
}

module.exports.delRateType = async function (req, res){
    const rateType = await RateTypes.deleteOne({_id : req.body.id}).select('-__v');
    res.send(rateType);
}

module.exports.delRateStep = async function (req, res){
    const rateStep = await RateSteps.deleteOne({_id : req.body.id}).select('-__v');
    res.send(rateStep);
}

module.exports.addRateType = function(req,res){
    const rateType = new RateTypes(req.body);
    rateType.save();
    res.send(rateType);
}

module.exports.getRateTypes = async function (req, res){
    const rateType = await RateTypes.find().select('-__v');
    res.send(rateType);
}

module.exports.getAllSteps = async function (req, res){
    const rateSteps = await RateSteps.find().select('-__v');
    res.send(rateSteps);
}

module.exports.editRateType = async function (req, res){
    RateTypes.findByIdAndUpdate(req.body.id, req.body, {new: true})
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

module.exports.editRateStep = async function (req, res){
    RateSteps.findByIdAndUpdate(req.body.id, req.body, {new: true})
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

module.exports.addRateStep = function(req,res){
    const rateStep = new RateSteps(req.body);
    rateStep.save();
    res.send(rateStep);
}

module.exports.getRateSteps = async function(req,res){
    const rates = await RateTypes.find({rate_id : req.body.id}).select('-__v');
    let rateSteps = await generateStep(rates);
    let nextStep =  await generateStep(rates);
    let mergeSteps = await [...rateSteps, ...nextStep];
    if(rateSteps.length > 0 && nextStep.length > 0){
        nextStep[0].total = rateSteps[rateSteps.length-1].total + nextStep[0].rate;
        nextStep[0].rate = rateSteps[rateSteps.length-1].rate + nextStep[0].rate;
    }
    current_time = moment().format();
    now = moment(current_time).format("L");
    if(mergeSteps.length > 0){
        res.send(mergeSteps)
    }else{
        res.send({success : false, msg:"Parking not allowed except for Scotia Bank Customers"})
    }
}

const generateStep = async(rates)=>{
    let steps = [];
    let added_date;
    await Promise.all(rates.map(async(x)=>{ 
        let start_time = moment(now +" "+ x.start_time, "L HH:mm").format();
        let end_time = moment(now +" "+ x.end_time, "L HH:mm").format();
        if(start_time > end_time){
            end_time = moment(now +" "+ x.end_time, "L HH:mm").add(1,"days").format();
        }
        const condition1 = moment(current_time) >= moment(start_time);
        const condition2 = moment(current_time) < moment(end_time);
        console.log(condition1,condition2,current_time,start_time);
        if(condition1 && condition2){
            // console.log('in if');

            // console.log(x._id);
            let time_reached = false;
            const rateStep = await RateSteps.find({rate_type_id : x._id}).select('-__v');
            await Promise.all(rateStep.map(async (y)=>{
                added_date = moment(current_time).add(y.time, 'minutes').format('MMMM Do YYYY, hh:mm a');
                let last_step = moment(current_time).add(y.time, 'minutes').format() >= moment(end_time).format();
                if(last_step){
                    added_date = moment(end_time).format('MMMM Do YYYY, hh:mm a');
                }
                let obj={
                    time: y.time,
                    rate: y.rate,
                    time_desc: added_date,
                    time_diff: showDiff(added_date),
                    day: calculateDay(moment(added_date, 'MMMM Do YYYY, hh:mm a' ).format()),
                    service_fee: x.service_fee,
                    total: (y.rate + x.service_fee),
                    current_time: moment().format('MMMM Do YYYY, hh:mm a')
                }
                if(!time_reached){
                    steps.push(obj);
                }
                if(moment(added_date, 'MMMM Do YYYY, hh:mm a').format("HH:mm") >= moment(end_time).format("HH:mm")){
                    time_reached = true;
                }
            }))
            current_time = moment(added_date, 'MMMM Do YYYY, hh:mm a' ).format();
            // return await rateSteps;
        }else{
            // console.log('in else');
            steps = [];
        }
    }))
    // console.log(steps);
    return steps;
}

const showDiff = (added_date)=>{
    var date1 = new Date();    
    var date2 = new Date(moment(added_date, 'MMMM Do YYYY, hh:mm a').format());
    //Customise date2 for your required future time

    var diff = (date2 - date1)/1000;
    var diff = Math.abs(Math.floor(diff));

    var days = Math.floor(diff/(24*60*60));
    var leftSec = diff - days * 24*60*60;

    var hrs = Math.floor(leftSec/(60*60));
    var leftSec = leftSec - hrs * 60*60;

    var min = Math.floor(leftSec/(60));
    var leftSec = leftSec - min * 60;
    days = (days == 0) ? '' : (days + "d ");
    hrs = (hrs == 0) ? '' : (hrs + "h ");
    min = min + "m "
    return days + hrs + min;
  }

  const calculateDay = (added_date)=>{
    var fromNow = moment(added_date ).fromNow();    
      return moment(added_date).calendar( null, {
          lastWeek: '[Last] dddd',
          lastDay:  '[Yesterday]',
          sameDay:  '[Today]',
          nextDay:  '[Tomorrow]',
          nextWeek: 'dddd',             
          sameElse: function () {
              return "[" + fromNow + "]";
          }
      });
  }

module.exports.getRateDetail = async function (req, res){
    const rates = await Rates.find({zone_id: req.body.zone_id}).select('-__v');
    let rateDetail = [];
    const rateType = await RateTypes.find({rate_id: rates[0]._id}).select('-__v');
    let rateSteps;
    await Promise.all(rateType.map(async (x)=>{
        rateSteps = await RateSteps.find({rate_type_id: x._id}).select('-__v');
        let obj = {
            rate_name : rates[0].rate_name,
            rate_type : x.rate_type_name,
            rate_step : rateSteps
        }
        rateDetail.push(obj);
    }))
    
    res.send(rateDetail);
}
  