const { Rates } = require('../models/rate_model');
const { RateTypes } = require('../models/rate_type_model');
const { RateSteps } = require('../models/rate_steps_model');
const { BusinessPlates } = require('../models/business_plate_model');

const moment = require('moment');

var current_time = moment().format();
let now = moment(current_time).format("L");

module.exports.getRateById = async function (req, res){
    const rates = await Rates.find({zone_id : req.body.id}).select('-__v');
    res.send(rates);
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

module.exports.addRateType = function(req,res){
    const rateType = new RateTypes(req.body);
    rateType.save();
    res.send(rateType);
}

module.exports.getRateTypes = async function (req, res){
    const rateType = await RateTypes.find().select('-__v');
    res.send(rateType);
}

module.exports.addRateStep = function(req,res){
    const rateStep = new RateSteps(req.body);
    rateStep.save();
    res.send(rateStep);
}

module.exports.getRateSteps = async function(req,res){
    const rates = await RateTypes.find({rate_id : req.body.id}).select('-__v');
    if(req.body.rate_type == 1){
        const businessPlates = await BusinessPlates.find({plate : req.body.plate}).select('-__v');
        if(businessPlates.length > 0){
            let rateSteps = [];
            let added_date = moment().add(1440, 'minutes').format('MMMM Do YYYY, hh:mm a');
            let obj={
                time: 1440,
                rate: 0,
                time_desc: added_date,
                time_diff: showDiff(added_date),
                day: calculateDay(moment(added_date, 'MMMM Do YYYY, hh:mm a' ).format())
            }
            rateSteps.push(obj);
            current_time = moment().format();
            now = moment(current_time).format("L");
            res.send(rateSteps);
        }else{
            res.send({success : false, msg:"You are not allowed to park here"})
        }
    }else{
        let rateSteps = await generateStep(rates);
        let nextStep =  await generateStep(rates);
        let mergeSteps = await [...rateSteps, ...nextStep];
        if(rateSteps.length > 0 && nextStep.length > 0){
            nextStep[0].rate = rateSteps[rateSteps.length-1].rate + nextStep[0].rate;
        }
        console.log(rateSteps,nextStep);
        current_time = moment().format();
        now = moment(current_time).format("L");

        res.send(mergeSteps)
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
        // console.log(condition1,condition2,start_time,end_time);
        if(condition1 && condition2){
            console.log('in if');

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
                    day: calculateDay(moment(added_date, 'MMMM Do YYYY, hh:mm a' ).format())
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
            console.log('in else');
            steps = [];
        }
    }))
    console.log(steps);
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
  