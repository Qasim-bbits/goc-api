const { PlateParkingLimits } = require('../models/plate_parking_limit_model');
const CronJob = require('cron').CronJob;

const job = new CronJob('* * * 1 * *', function(){
//   editPlateParkingLimit();
})

job.start();

module.exports.addPlateParkingLimit = async function(req,res){
    const plateExist = await PlateParkingLimits.findOne({zone: req.body.zone._id, plate: req.body.plate}).select('-__v');
    if(plateExist != null){
        const no_of_parking_per_plate = req.body.zone.no_of_parking_per_plate + plateExist.no_of_parking_per_plate;
        PlateParkingLimits.findByIdAndUpdate(plateExist._id, {no_of_parking_per_plate: no_of_parking_per_plate}, {new: true})
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
                msg: "Error updating Data with id " + req.body.id
            });
        });
    }else{
        req.body.no_of_parking_per_plate = req.body.zone.no_of_parking_per_plate+req.body.zone.no_of_parking_per_plate;
        req.body.zone = req.body.zone._id;
        const plate = new PlateParkingLimits(req.body);
        plate.save();
        res.send(plate);
    }
}

const editPlateParkingLimit = async() => {
    const plates = await PlateParkingLimits.find().populate('zone').select('-__v');
    plates.forEach((x)=>{
        PlateParkingLimits.findByIdAndUpdate(x._id, {no_of_parking_per_plate: (x.no_of_parking_per_plate*2)})
        .then(response => {
            console.log(response);
        })
    })
}
