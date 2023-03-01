const { Rates } = require('../models/rate_model');
const { RateTypes } = require('../models/rate_type_model');
const { RateSteps } = require('../models/rate_steps_model');
const { Parkings } = require('../models/parking_model');
const { Organizations } = require('../models/organizations_model');
const { Zones } = require('../models/zone_model');
const { TenentPlates } = require('../models/tenent_plate_model');

const moment = require('moment-timezone');
moment.tz.setDefault("America/New_York");
// moment.tz.setDefault("Asia/Karachi");

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
        const checkTenantZone = await Zones.findOne({_id : req.body.id, tenant_zone: true}).select('-__v');
        if(checkTenantZone){
            const checkPlateExist = await TenentPlates.findOne({plate : req.body.plate, zone: req.body.id}).select('-__v');
            if(checkPlateExist){
                const rates = await Rates.find({zone_id : req.body.id, qr_code: false}).select('-__v');
                res.send(rates);
            }else{
                res.send({
                    success: false,
                    msg: 'You are not allowed to park here'
                });
            }
        }else{
            const rates = await Rates.find({zone_id : req.body.id, qr_code: false}).select('-__v');
            res.send(rates);
        }
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
        startDate.setHours(10);
        startDate.setMinutes(0);
        let endDate = moment().toDate();
        endDate.setHours(22);
        endDate.setMinutes(0);
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
                    msg: 'Parking not allowed during these hours'
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
    const rate = await RateTypes.findOne({_id : req.body.id}).select('-__v');
    const rates = await RateTypes.find({rate_id : rate.rate_id}).select('-__v');
    const rateType = await RateTypes.deleteOne({_id : req.body.id}).select('-__v');
    if(rates.length == 1 ){
        const rateDelete = await Rates.deleteOne({_id : rate.rate_id}).select('-__v'); 
        res.send(rateDelete);
    }else{
        res.send(rateType);
    }
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
    var current_time = moment().format();
    var now = moment(current_time).format("L");
    const org = await Organizations.findOne({_id: req.body.org}).select('-__v');
    let rates = await RateTypes.find({
        $and: [
            {start_date: {$lte: new Date()}},
            {end_date: {$gte: new Date()}},
            {special_rate : true},
            {rate_id : req.body.id}
        ]}).select('-__v');
    if(rates.length == 0){
        rates= await RateTypes.find({rate_id : req.body.id, special_rate : false}).select('-__v');
    }
// console.log(current_time, now, 'before');
    let rateSteps = await generateStep(rates, current_time, now, req.body.plate, org);
    // let mergeSteps = await [...rateSteps];
    current_time = moment(rateSteps[rateSteps.length - 1].time_desc, 'MMMM Do YYYY, hh:mm a').format();
    now = moment(current_time).format("L");
    console.log(rates,'rates');
    // console.log(rateSteps[rateSteps.length - 1],'after');
    let mergeSteps = await [...rateSteps];
    if(rateSteps[rateSteps.length - 1].time < 1440){
        let nextStep = await generateStep(rates, current_time, now, req.body.plate, org);
        if(rateSteps.length > 0 && nextStep.length > 0){
            nextStep.map(x=>{
                x.total = rateSteps[rateSteps.length-1].total + x.rate;
                x.rate = rateSteps[rateSteps.length-1].rate + x.rate
            })
        }
        mergeSteps = await [...rateSteps, ...nextStep];
    }
    // current_time = moment().format();
    // now = moment(current_time).format("L");
    if(mergeSteps.length > 0){
        res.send(mergeSteps)
    }else{
        res.send({success : false, msg:"Parking not allowed during these hours"})
    }
}

const generateStep = async(rates, current_time, now, plate, org)=>{
    let steps = [];
    let added_date;
    let purchasedFree = false;
    let startDate = moment().toDate();
    startDate.setHours(0);
    startDate.setMinutes(0);
    let endDate = moment().toDate();
    endDate.setHours(23);
    endDate.setMinutes(59);
    const parkings = await Parkings.find({
        $and: [
            {
                from: {$gte: startDate}
            },
            {
                to: {$lte: endDate}
            },
            {
                plate: plate
            },
            {
                amount: 0
            }
        ]
    })
    if(parkings.length > 0){
        purchasedFree = true
    }
    await Promise.all(rates.map(async(x)=>{
        let start_time = moment(now +" "+ x.start_time, "L HH:mm").format();
        let end_time = moment(now +" "+ x.end_time, "L HH:mm").format();
        if(start_time >= end_time){
            if(moment(current_time).format("HH") < moment(end_time).format("HH")){
                start_time = moment(now +" "+ x.start_time, "L HH:mm").subtract(1,"days").format();
            }else{
                end_time = moment(now +" "+ x.end_time, "L HH:mm").add(1,"days").format();
            }
        }
        let day_now = moment(current_time).format('dddd')
        const condition1 = moment(current_time) >= moment(start_time);
        const condition2 = moment(current_time) < moment(end_time);
        const condition3 = x[day_now] == true;
        console.log(condition1,condition2,condition3)
        console.log(current_time,start_time,end_time)
        if(condition1 && condition2 && condition3){
            let time_reached = false;
            const rateStep = await RateSteps.find({rate_type_id : x._id}).select('-__v');
            await Promise.all(rateStep.map(async (y)=>{
                added_date = moment(current_time).add(y.time, 'minutes').format('MMMM Do YYYY, hh:mm a');
                console.log(x)
                if(rateStep[rateStep.length - 1].time >= 1440 && x.flat_rate){
                    end_time = moment(current_time).add(y.time, 'minutes').format()
                }
                let last_step = moment(current_time).add(y.time, 'minutes').format() >= moment(end_time).format();
                if(last_step){
                    added_date = moment(end_time).format('MMMM Do YYYY, hh:mm a');
                }
                let service_fee = (y.rate == 0) ? 0 : org.service_fee;
                let obj={
                    time: y.time,
                    rate: y.rate,
                    time_desc: added_date,
                    time_diff: showDiff(added_date),
                    day: calculateDay(moment(added_date, 'MMMM Do YYYY, hh:mm a' ).format()),
                    service_fee: service_fee,
                    total: (y.rate + service_fee),
                    current_time: moment().format('MMMM Do YYYY, hh:mm a')
                }
                if(!time_reached){
                    if(purchasedFree == true){
                        if(y.rate !== 0){
                            steps.push(obj);
                        }
                    }else{
                        steps.push(obj);
                    }
                }
                if(moment(added_date, 'MMMM Do YYYY, hh:mm a').format() >= moment(end_time).format()){
                    time_reached = true;
                }
            }))
            current_time = moment(added_date, 'MMMM Do YYYY, hh:mm a').format();
            now = moment(added_date, 'MMMM Do YYYY, hh:mm a').format("L");
        }else{
            steps = [];
        }
    }))
    return steps;
}

const showDiff = (added_date)=>{
    var date1 = moment().toDate();    
    var date2 = moment(added_date, 'MMMM Do YYYY, hh:mm a').add(1,"m").toDate();
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
    min = (min == 0) ? '' : (min + "min ");
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
    const rates = await Rates.find({zone_id: req.body.zone_id}).sort( { "rate_name": 1 } ).select('-__v');
    let rateDetail = [];
    await Promise.all(rates.map(async (el) => {
        const rateType = await RateTypes.find({rate_id: el._id}).select('-__v');
        let rateSteps;
        await Promise.all(rateType.map(async (x)=>{
            rateSteps = await RateSteps.find({rate_type_id: x._id}).select('-__v');
            let obj = {
                rate_name : el.rate_name,
                rate_id : el._id,
                Monday : x.Monday,
                Tuesday : x.Tuesday,
                Wednesday : x.Wednesday,
                Thursday : x.Thursday,
                Friday : x.Friday,
                Saturday : x.Saturday,
                Sunday : x.Sunday,
                Holiday : x.Holiday,
                rate_type_id : x._id,
                rate_type_name : x.rate_type_name,
                start_time : x.start_time,
                end_time : x.end_time,
                special_rate : x.special_rate,
                start_date : x.start_date,
                end_date : x.end_date,
                flat_rate: x.flat_rate,
                rate_step : rateSteps
            }
            rateDetail.push(obj);
        }))
    }))
    res.send(rateDetail);
}

module.exports.bulkEditSteps = async function (req, res){
    Rates.findByIdAndUpdate(req.body.rate_id, {rate_name: req.body.rate_name}, {new: true})
    .then(response => {
        if(!response) {
            return res.status(404).json({
                msg: "Data not found with id " + req.body.rate_id
            });
        }
        response['rate'] = response;
        RateTypes.findByIdAndUpdate(req.body.rate_type_id, req.body, {new: true})
            .then(async typeRes => {
                if(!typeRes) {
                    return res.status(404).json({
                        msg: "Data not found with id " + req.body.rate_type_id
                    });
                }
                response['rate'] = typeRes;
                let bulk = req.body.rate_step.map(x=>{
                    return {
                        updateOne : {
                            "filter" : { "_id" : x._id },
                            "update" : { $set : { "rate" : x.rate, "time" : x.time  } }
                        }
                    }
                })
                let rateSteps = await RateSteps.bulkWrite(bulk);
                response['rateSteps'] = rateSteps;
                res.send(response);
            }).catch(err => {
                if(err.kind === 'ObjectId') {
                    return res.status(404).json({
                        msg: "Data not found with id " + req.body.rate_type_id
                    });                
                }
                return res.status(500).json({
                    msg: "Error updating Data with id " + req.body.rate_type_id
                });
            });
    }).catch(err => {
        if(err.kind === 'ObjectId') {
            return res.status(404).json({
                msg: "Data not found with id " + req.body.rate_id
            });                
        }
        return res.status(500).json({
            msg: "Error updating Data with id " + req.body.rate_id
        });
    });
}

module.exports.addCompleteRate = async function (req, res){
    let types = [];
    let steps = [];
    const rate = await new Rates(req.body);
    rate.save();
    await Promise.all(req.body.rates.map(async x=>{
        x.rate_id = rate._id;
        x.service_fee = req.body.service_fee;
        const rateType = await new RateTypes(x);
        rateType.save();
        types.push(rateType);
        x.rate_steps.map(async (y, index)=>{
            let obj = {
                rate: y.rate,
                time: y.time,
                order: (index+1),
                rate_type_id: rateType._id
            }
            const rateSteps = await new RateSteps(obj);
            rateSteps.save();
            steps.push(rateSteps);
        })
    }))
    let obj = {
        rate: rate,
        rateType: types,
        rateSteps: steps
    }
    res.send(obj);
}

module.exports.addSpecialRate = async function (req, res){
    let types = [];
    let steps = [];
    await Promise.all(req.body.rates.map(async x=>{
        x.rate_id = x.rate_type_id;
        x.service_fee = req.body.service_fee;
        const rateType = await new RateTypes(x);
        rateType.save();
        types.push(rateType);
        x.rate_steps.map(async (y, index)=>{
            let obj = {
                rate: y.rate,
                time: y.time,
                order: (index+1),
                rate_type_id: rateType._id
            }
            const rateSteps = await new RateSteps(obj);
            rateSteps.save();
            steps.push(rateSteps);
        })
    }))
    let obj = {
        rateType: types,
        rateSteps: steps
    }
    res.send(obj);
}
 
module.exports.getRateByZone = async function (req, res){
    const rates = await Rates.find({zone_id : req.body.id, qr_code: false}).select('-__v');
    res.send(rates);
}