const { BusinessPlates } = require('../models/business_plate_model');
const { Parkings } = require('../models/parking_model');
const moment = require('moment-timezone');
moment.tz.setDefault("America/New_York");

module.exports.addBusinessPlate = async function(req,res){
    if(req.body.zone_type == 2){
        res.send({
            success: false,
            msg: 'Plate cannot be added in this zone'
        });
    }
    req.body.plate = req.body.plate.toUpperCase();
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
        const plate = new BusinessPlates(req.body);
        plate.save();
        let body = {
            amount: 0, 
            service_fee: 0,
            parking_id: Math.floor(100000 + Math.random() * 900000),
            city: req.body.city,
            zone: req.body.zone,
            plate: req.body.plate,
            from: moment().format(),
            to: moment().add((req.body.zone_type == 0) ? 1 : req.body.visitor_pass_time,(req.body.zone_type == 0) ? "M" : "m").format(),
            parking_type: 1,
        }
        const parkings = new Parkings(body);
        parkings.save();
        res.send(parkings);
    }else{
        res.send({
            success: false,
            msg: 'Plate is already entered, Please add plate again after '+
            moment(parkings[0].to).format("MMMM Do YYYY, hh:mm a")
        });
    }
}

module.exports.getBusinessPlate = async function(req,res){
    const plates = await BusinessPlates.
    find().
    sort({_id: -1}).
    populate('zone');
    res.send(plates);
}

module.exports.delBusinessPlate = async function (req, res){
    const plates = await BusinessPlates.deleteOne({_id : req.body.id}).select('-__v');
    res.send(plates);
}

module.exports.editBusinessPlate = async function (req, res){
    req.body.plate = req.body.plate.toUpperCase();
    BusinessPlates.findByIdAndUpdate(req.body.id, req.body, {new: true})
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