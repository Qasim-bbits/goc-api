const { Parkings } = require('../models/parking_model');
const { Users } = require('../models/users_model');
var mongoose = require('mongoose');

module.exports.getDashboard = async function(req,res){
    let body = {}
    let data = {};
    let user = await Users.find({org: req.body.org_id}).select('-__v');
    if(user.length > 0 && user[0].role !== 'root'){
        body['org'] = mongoose.Types.ObjectId(req.body.org_id);
    }
    const current = await Parkings.find({...{from: {$lte: new Date()},to: {$gte: new Date()}}, ...body}).count().select('-__v');
    const all = await Parkings.find(body).count().select('-__v');
    const paid = await Parkings.find({ ...{service_fee: { $ne: '0' }}, ...body }).count().select('-__v');
    const free = await Parkings.find({ ...{service_fee: '0'}, ...body }).count().select('-__v');
    const assetsReport = await Parkings.aggregate([
        { $match: body},
        {
            $group:
            {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$from' } },
                Amount: { $sum: { $multiply: [ "$amount", { "$divide": [ 1, 100 ] } ] } },
                count: { $sum: 1 }
            }
        },
        {"$sort": {_id: 1}},
      ])
    data['current'] = current;
    data['all'] = all;
    data['paid'] = paid;
    data['free'] = free;
    data['assetsReport'] = assetsReport.map((obj, i) => ({ ...obj, Amount: (parseFloat((assetsReport[i].Amount).toFixed(2))) }));
    res.send(data);
}